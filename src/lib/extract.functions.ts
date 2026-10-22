import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ExtractResult } from "./extract-filter";

const MAX_NOTES = 8000;
/** "Fill the form from my voice note". Free (no listing credit), 40/day. */
export const extractListingFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { voiceNotes: string }) => {
    const notes = typeof input?.voiceNotes === "string" ? input.voiceNotes.trim() : "";
    if (notes.length < 10) throw new Error("Add a few details to your voice notes first.");
    if (notes.length > MAX_NOTES)
      throw new Error("Your voice notes are too long to read in one go.");
    return { voiceNotes: notes };
  })
  .handler(async ({ data, context }): Promise<ExtractResult> => {
    const { supabase, userId } = context;
    const { isCompedUserId } = await import("./comped.server");
    const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
    const sub = await readReconciledSubscriber(supabase, userId);
    const comped = isCompedUserId(userId);
    if (!comped && !hasActiveAccess(sub?.status ?? "none", sub?.current_period_end ?? null, sub?.stripe_price_id)) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Atomic pre-call reservation (40/day, bounded in-flight); every attempt counts.
    const { reserveProviderCall, settleProviderCall } = await import("./provider-quota");
    const reservationId = await reserveProviderCall(supabaseAdmin, userId, "extract");

    let result: ExtractResult;
    try {
      const { runExtraction } = await import("./generation.server");
      result = await runExtraction(data.voiceNotes);
      await settleProviderCall(supabaseAdmin, userId, reservationId, true);
    } catch (err) {
      await settleProviderCall(supabaseAdmin, userId, reservationId, false);
      const m = err instanceof Error ? err.message : "";
      console.warn("extract failed", m);
      try {
        await supabaseAdmin
          .from("generation_errors")
          .insert({ user_id: userId, stage: "regen", code: `extract:${m.slice(0, 40)}` });
      } catch {
        // ignore
      }
      throw new Error(
        ["AI_TIMEOUT", "RATE_LIMIT", "AI_TRUNCATED", "MALFORMED_AI_OUTPUT"].find((k) =>
          m.includes(k),
        ) ?? "AI_UNAVAILABLE",
      );
    }

    return result;
  });
