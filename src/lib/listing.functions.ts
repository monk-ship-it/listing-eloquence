import { createServerFn } from "@tanstack/react-start";
import { finalizeOrRelease, releaseSlot, type ReadSlot, type SlotRpc } from "./quota-slot";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getConfiguredClaudeModel } from "./ai-gateway.server";
import { runCore, runMarketing } from "./generation.server";
import type { VoiceId } from "./voices";
import type { AttemptMeta, ListingInput, ListingOutput, MarketingOutput } from "./listing-types";
import { coerceLegacyOutput } from "./listing-types";
import { isValidVoice, normaliseInput } from "./prompts/render";
import { PROMPT_VERSION } from "./prompts/version.gen";

function errorCode(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  const known = [
    "AI_TRUNCATED",
    "AI_TIMEOUT",
    "RATE_LIMIT",
    "AI_UNAVAILABLE",
    "MALFORMED_AI_OUTPUT",
  ];
  return known.find((k) => m.includes(k)) ?? "UNKNOWN";
}

/** Server-side log of each failed attempt (never blocks the request). */
async function logGenerationError(
  userId: string,
  stage: "core" | "marketing" | "regen",
  err: unknown,
) {
  const code = errorCode(err);
  console.warn("Generation attempt failed", { stage, code });
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("generation_errors").insert({ user_id: userId, stage, code });
  } catch (e) {
    console.error("generation_errors insert failed", e);
  }
}

/** Same access gate as generation: comped, or active trial/subscription. */
async function assertAccess(
  supabase: Parameters<typeof import("./subscription.functions").readReconciledSubscriber>[0],
  userId: string,
) {
  const { isCompedUserId } = await import("./comped.server");
  const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
  const sub = await readReconciledSubscriber(supabase, userId);
  const comped = isCompedUserId(userId);
  const status = sub?.status ?? "none";
  const hasAccess = comped || hasActiveAccess(status, sub?.current_period_end ?? null, sub?.stripe_price_id);
  if (!hasAccess) throw new Error("SUBSCRIPTION_REQUIRED");
  return { sub, comped };
}

export const generateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ListingInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    const cleaned = normaliseInput(input);
    const hasFacts =
      !!cleaned.address?.trim() || !!cleaned.propertyType?.trim() || !!cleaned.keyFeatures?.trim();
    if (!hasFacts && (cleaned.voiceNotes?.trim().length ?? 0) < 20) {
      throw new Error("Please provide some property details before generating.");
    }
    return cleaned;
  })
  .handler(async ({ data, context }): Promise<{ generationId: string; output: ListingOutput }> => {
    const { supabase, userId } = context;

    // Subscription gate (server-side), reconciled against Stripe first.
    const { sub, comped } = await assertAccess(supabase, userId);

    // Atomic monthly-quota reservation for paid/trial users. Comped accounts
    // stay unlimited and skip reservation entirely. The quota RPCs are
    // service-role only; the user id comes from the verified auth middleware.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let reservationId: string | null = null;
    if (!comped) {
      const { data: reserved, error: reserveError } = await supabaseAdmin.rpc(
        "reserve_generation_slot",
        { _user_id: userId },
      );
      if (reserveError) {
        const msg = (reserveError.message ?? "").toString();
        if (msg.includes("LISTING_LIMIT_REACHED")) {
          throw new Error("LISTING_LIMIT_REACHED");
        }
        throw new Error("Couldn't reserve a listing slot. Please try again.");
      }
      reservationId = (reserved as string | null) ?? null;
      if (!reservationId) {
        throw new Error("Couldn't reserve a listing slot. Please try again.");
      }
    }

    const rpc: SlotRpc = (fn, args) =>
      supabaseAdmin.rpc(fn as never, args as never) as unknown as Promise<{
        data: unknown;
        error: unknown;
      }>;
    const releaseReservation = async () => {
      const id = reservationId;
      reservationId = null;
      await releaseSlot(rpc, userId, id);
    };

    try {
      // Core and marketing run in parallel. Only core success is required
      // (and only it consumes the reserved listing credit).
      const model = await getConfiguredClaudeModel();
      const log = (stage: "core" | "marketing" | "regen", e: unknown) =>
        logGenerationError(userId, stage, e);
      const attempts: AttemptMeta[] = [];
      const onMeta = (m: AttemptMeta) =>
        attempts.push({ call: m.call, attempt: m.attempt, ms: m.ms, reason: m.reason });
      const [coreRes, mktRes] = await Promise.allSettled([
        runCore(data, { log, model, onMeta }),
        runMarketing(data, { log, model, onMeta }),
      ]);
      if (coreRes.status === "rejected") throw coreRes.reason;

      const parsed: ListingOutput =
        mktRes.status === "fulfilled"
          ? { ...coreRes.value, ...mktRes.value }
          : { ...coreRes.value, emailBlast: null, social: [], marketingStatus: "failed" };
      parsed.meta = { promptVersion: PROMPT_VERSION, model, attempts };

      const voice = (data.voice ?? "professional") as VoiceId;
      const { data: savedGen, error: insertError } = await supabase
        .from("generations")
        .insert({
          user_id: userId,
          voice,
          property_title: data.address || data.propertyType || "Untitled property",
          inputs: JSON.parse(JSON.stringify(data)),
          output: JSON.parse(JSON.stringify(parsed)),
        })
        .select("id")
        .maybeSingle();
      if (insertError || !savedGen?.id) {
        throw new Error("Couldn't save your listing. Please try again.");
      }
      const savedGenId = savedGen.id as string;

      if (reservationId) {
        const id = reservationId;
        // finalizeOrRelease reconciles and releases the slot itself.
        reservationId = null;
        const readSlot: ReadSlot = async (rid) => {
          const { data: row, error } = await supabaseAdmin
            .from("generation_usage")
            .select("reservation_status")
            .eq("id", rid)
            .eq("user_id", userId)
            .maybeSingle();
          if (error) return null;
          if (!row) return "missing";
          return row.reservation_status === "completed" ? "completed" : "reserved";
        };
        const outcome = await finalizeOrRelease(rpc, readSlot, userId, id, savedGenId);
        if (outcome === "released") {
          // Credit confirmed not used, so the listing isn't kept either.
          await supabase.from("generations").delete().eq("id", savedGenId).eq("user_id", userId);
          throw new Error("Couldn't record listing usage. Please try again — this didn't use a listing.");
        }
        if (outcome === "unresolved") {
          // Unknown whether the credit committed: keep the saved listing. A row
          // still 'reserved' expires; if it actually completed, usage stays counted.
          console.error("finalize unresolved; keeping generation", { userId, reservationId: id, savedGenId });
        }
      } else if (comped) {
        // Comped accounts are unlimited; this row is only an audit trail, so a
        // failure here must not cost the agent their saved listing.
        const { error: usageError } = await supabase.from("generation_usage").insert({
          user_id: userId,
          generation_id: savedGenId,
          plan: sub?.plan ?? null,
        });
        if (usageError) console.error("comped usage insert failed", usageError);
      }

      return { generationId: savedGenId, output: parsed };
    } catch (err) {
      await releaseReservation();
      throw err;
    }
  });


/**
 * Fill in the Email Blast (and the social pack, if empty) for an existing
 * saved listing. Free — never reserves a listing slot — but limited to
 * REGEN_DAILY_LIMIT successful runs per user per day.
 */
export const generateMarketingForGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid listing.");
    return { generationId: id };
  })
  .handler(async ({ data, context }): Promise<ListingOutput> => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabase
      .from("generations")
      .select("id, voice, inputs, output")
      .eq("id", data.generationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !row) throw new Error("That listing couldn't be found.");

    const rawInputs = (row.inputs ?? {}) as Record<string, unknown>;
    const input = {
      ...(rawInputs as unknown as ListingInput),
      voice: (isValidVoice(rawInputs.voice) ? rawInputs.voice : row.voice) as VoiceId,
    };
    let safeInput: ListingInput;
    try {
      safeInput = normaliseInput({
        ...input,
        voice: isValidVoice(input.voice) ? input.voice : "professional",
      });
    } catch {
      safeInput = { ...input, voice: "professional" };
    }

    // Atomic pre-call reservation (30/day, bounded in-flight); every attempt counts.
    const { reserveProviderCall, settleProviderCall } = await import("./provider-quota");
    const reservationId = await reserveProviderCall(supabaseAdmin, userId, "marketing");
    let mkt: MarketingOutput;
    try {
      mkt = await runMarketing(safeInput, {
        stage: "regen",
        log: (stage, e) => logGenerationError(userId, stage, e),
      });
      await settleProviderCall(supabaseAdmin, userId, reservationId, true);
    } catch (err) {
      await settleProviderCall(supabaseAdmin, userId, reservationId, false);
      const code = errorCode(err);
      throw new Error(code === "UNKNOWN" ? "AI_UNAVAILABLE" : code);
    }

    const current = coerceLegacyOutput(row.output);
    const rawOut = { ...((row.output ?? {}) as Record<string, unknown>) };
    delete rawOut.marketingStatus;
    rawOut.emailBlast = mkt.emailBlast;
    if (current.social.length === 0) rawOut.social = mkt.social;
    if (!current.sellerEmail && mkt.sellerEmail) rawOut.sellerEmail = mkt.sellerEmail;

    const { error: updateError } = await supabase
      .from("generations")
      .update({ output: JSON.parse(JSON.stringify(rawOut)) })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (updateError) {
      console.error("generation update failed", updateError);
      throw new Error("Couldn't save the email. Please try again.");
    }

    return coerceLegacyOutput(rawOut);
  });
