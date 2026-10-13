import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callClaudeTool } from "./ai-gateway.server";
import { VOICE_PROMPTS, type VoiceId } from "./voices";
import { MASTER_LISTING_SYSTEM_PROMPT } from "./master-listing-prompt";
import type { CoreOutput, ListingInput, ListingOutput, MarketingOutput } from "./listing-types";
import { coerceLegacyOutput, validateCoreOutput, validateMarketingOutput } from "./listing-types";
import { VOICES } from "./voices";
import { FIELD_BY_KEY, FIELD_DEFS } from "./listing-fields";
import { buildMaterialInfoBlock, checkMaterialInfo, summariseChecks } from "./material-info";

/** Max characters accepted per free-text field to keep payloads sane. */
const MAX_FIELD_LEN = 4000;
const MAX_VOICE_NOTES_LEN = 8000;

const VALID_VOICES = new Set(VOICES.map((v) => v.id));

function clip(v: unknown, max: number, label: string): string {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v !== "string") throw new Error(`${label} must be text.`);
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/\u0000/g, "").trim();

  if (t.length > max) {
    throw new Error(`${label} is too long (max ${max.toLocaleString()} characters).`);
  }
  return t;
}

function normaliseInput(input: ListingInput): ListingInput {
  if (!VALID_VOICES.has(input.voice)) {
    throw new Error("Please choose a valid brand voice.");
  }
  const out = { ...input, market: "uk" } as ListingInput;
  const stringKeys: string[] = [...FIELD_DEFS.map((d) => d.key), "utilities"];
  for (const k of stringKeys) {
    const max = k === "voiceNotes" ? MAX_VOICE_NOTES_LEN : MAX_FIELD_LEN;
    (out as unknown as Record<string, string>)[k] = clip(
      (input as unknown as Record<string, unknown>)[k],
      max,
      FIELD_BY_KEY[k]?.label ?? k,
    );
  }
  out.sellerApproved = input.sellerApproved === true;
  return out;
}

function field(label: string, value: string | undefined) {
  return value && value.trim() ? `- ${label}: ${value.trim()}\n` : "";
}

const PRIVATE_KEYS = new Set(["showingNotes", "mediaNotes"]);

function buildFacts(input: ListingInput): string {
  let details = "";
  let privateNotes = "";
  for (const def of FIELD_DEFS) {
    if (def.key === "voiceNotes") continue;
    if (def.showIf && !def.showIf(input)) continue;
    const v = input[def.key];
    if (PRIVATE_KEYS.has(def.key)) privateNotes += field(def.label, v);
    else
      details += field(
        def.key === "targetAudience"
          ? "Likely buyer (emphasis only — never exclude anyone)"
          : def.label,
        v,
      );
  }
  // Legacy combined supplies field from older saved listings.
  details += field("Utilities / broadband (legacy)", input.utilities);

  const mi = buildMaterialInfoBlock(input);
  const voiceNotes = input.voiceNotes?.trim()
    ? `\nAGENT VOICE NOTES (raw, dictated or pasted — supplementary context only):\n${input.voiceNotes.trim()}\n`
    : "";

  return `STRUCTURED PROPERTY DETAILS (authoritative — these always take priority):
${details || "- (none supplied — use the voice notes)\n"}
MATERIAL INFORMATION (verbatim facts — state these accurately; never contradict or soften):
${mi || "(none supplied)"}
${privateNotes ? `\nPRIVATE NOTES (never quote or use in any output; only use photo notes to add a "virtual staging" / "CGI" / "show home" label where images are referenced):\n${privateNotes}` : ""}${voiceNotes}
Where the voice notes conflict with a structured field, ALWAYS use the structured field. Never invent or upgrade figures from the notes.
Seller approval of particulars: ${input.sellerApproved ? "confirmed" : "NOT confirmed"}.`;
}

const LIMIT_REMINDER =
  "\n\nIMPORTANT: your previous answer broke the output limits. The strapline must be 250 characters or fewer, and every key feature 80 characters or fewer.";

function buildCorePrompt(input: ListingInput, reminder = false): string {
  return `Create the core copy for a UK property sales listing from the details below.

${buildFacts(input)}

PRODUCE:
- "headline": brochure / email headline, max 70 characters.
- "listing": the portal description — plain-text paragraphs separated by a blank line (opening, accommodation, outside space, location, then the material facts per your rules).
- "summary": the strapline (portal summary), max 250 characters; the first 160 characters must stand alone; don't open with the bedroom count or property type.
- "keyFeatures": 6–10 bullets, max 80 characters each, one fact per bullet, no full stops; the first three are the most decision-relevant facts.

Return the result by calling the ${CORE_TOOL} tool.${reminder ? LIMIT_REMINDER : ""}`;
}

function buildMarketingPrompt(input: ListingInput): string {
  const gaps = summariseChecks(checkMaterialInfo(input)).open.filter(
    (i) => i.severity !== "block" && i.question,
  );
  const gapList = gaps.length
    ? gaps.map((g) => `- ${g.question}`).join("\n")
    : "- (none — all supplies and Part C items are answered)";
  return `Create the marketing copy (applicant email, seller approval email and social posts) for a new UK sales instruction from the details below.

${buildFacts(input)}

EMAIL BLAST (new-instruction email to the agent's registered applicants) — follow your Email Blast limits:
- "subjectLines": exactly 3, max 60 characters, no urgency or clickbait. "previewText": max 90. "headline". "callToAction": e.g. "View full details" or "Book a viewing".
- "body": 2–4 short plain-text paragraphs separated by a blank line, no bullet list, greeting name or sign-off. Include price and qualifier, tenure, council tax band, EPC rating and (leasehold/shared ownership) the key costs. End with "Full material information is on the property listing."

SELLER APPROVAL EMAIL ("sellerEmail.body"): to the SELLER, asking them to check the draft particulars before they go live.
- 150–250 words, warm and professional, plain text. Open "Dear [Seller name]," — never invent a name.
- A numbered list of every key fact supplied above for them to confirm: price and qualifier, tenure, lease figures, council tax, EPC, room counts, parking, supplies and each answered Part C item. Only facts supplied — nothing else.
- Then ask these questions in plain English so the particulars are complete:
${gapList}
- End with "[Your name, branch, phone]".

SOCIAL: exactly three posts — platform "Instagram", "Facebook" and "X" — each caption includes price and qualifier and tenure; add "Full material information on the listing." where space runs out; relevant hashtags (words only, no '#').

Return the result by calling the ${MARKETING_TOOL} tool.`;
}

const CORE_TOOL = "submit_listing_core";
const MARKETING_TOOL = "submit_listing_marketing";

const CORE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "Brochure / email headline, max 70 characters" },
    listing: {
      type: "string",
      description: "Portal description, plain-text paragraphs separated by \\n\\n",
    },
    summary: { type: "string", description: "Strapline (portal summary), max 250 characters" },
    keyFeatures: {
      type: "array",
      items: { type: "string" },
      minItems: 6,
      maxItems: 10,
      description: "6–10 bullets, max 80 characters each",
    },
  },
  required: ["headline", "listing", "summary", "keyFeatures"],
};

const MARKETING_SCHEMA = {
  type: "object",
  properties: {
    emailBlast: {
      type: "object",
      properties: {
        subjectLines: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        previewText: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" },
        callToAction: { type: "string" },
      },
      required: ["subjectLines", "previewText", "headline", "body", "callToAction"],
    },
    sellerEmail: {
      type: "object",
      properties: { body: { type: "string" } },
      required: ["body"],
    },
    social: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["Instagram", "Facebook", "X"] },
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
        },
        required: ["platform", "caption", "hashtags"],
      },
    },
  },
  required: ["emailBlast", "sellerEmail", "social"],
};

function systemPromptFor(voiceId: string): string {
  const voice = (voiceId ?? "professional") as VoiceId;
  const voicePrompt = VOICE_PROMPTS[voice] ?? VOICE_PROMPTS.professional;
  return `${MASTER_LISTING_SYSTEM_PROMPT}\n\nBRAND VOICE FOR THIS LISTING:\n${voicePrompt}\n\nReturn your answer only by calling the provided tool.`;
}

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

function breaksLimits(o: CoreOutput): boolean {
  return o.summary.length > 250 || o.keyFeatures.some((f) => f.length > 80);
}

/**
 * CORE call: retry once on truncation/invalid output (8000 tokens) or timeout.
 * If the strapline or a bullet breaks its limit, retry once with a reminder,
 * then accept (the UI counters flag anything still over).
 */
export async function runCore(input: ListingInput, userId: string): Promise<CoreOutput> {
  const system = systemPromptFor(input.voice);
  let retried = false;
  const attempt = async (maxTokens: number, reminder = false) =>
    validateCoreOutput(
      await callClaudeTool({
        system,
        user: buildCorePrompt(input, reminder),
        toolName: CORE_TOOL,
        toolDescription: "Submit the headline, portal description, strapline and key features.",
        inputSchema: CORE_SCHEMA,
        maxTokens,
      }),
    );
  let out: CoreOutput;
  try {
    out = await attempt(6000);
  } catch (err) {
    await logGenerationError(userId, "core", err);
    const code = errorCode(err);
    retried = true;
    if (code === "AI_TRUNCATED" || code === "MALFORMED_AI_OUTPUT") out = await attempt(8000);
    else if (code === "AI_TIMEOUT") out = await attempt(6000);
    else throw err;
  }
  if (!retried && breaksLimits(out)) {
    await logGenerationError(userId, "core", new Error("LIMITS_EXCEEDED"));
    try {
      out = await attempt(6000, true);
    } catch (err) {
      await logGenerationError(userId, "core", err);
    }
  }
  return out;
}

/** MARKETING call: one retry on any failure. */
export async function runMarketing(
  input: ListingInput,
  userId: string,
  stage: "marketing" | "regen" = "marketing",
): Promise<MarketingOutput> {
  const system = systemPromptFor(input.voice);
  const user = buildMarketingPrompt(input);
  const subject = `Your property details for approval – ${input.address?.trim() || "your property"}`;
  const attempt = async () => {
    const out = validateMarketingOutput(
      await callClaudeTool({
        system,
        user,
        toolName: MARKETING_TOOL,
        toolDescription:
          "Submit the Email Blast, the seller approval email and three social posts.",
        inputSchema: MARKETING_SCHEMA,
        maxTokens: 3500,
      }),
    );
    if (out.sellerEmail) out.sellerEmail = { ...out.sellerEmail, subject };
    return out;
  };
  try {
    return await attempt();
  } catch (err) {
    await logGenerationError(userId, stage, err);
    try {
      return await attempt();
    } catch (err2) {
      await logGenerationError(userId, stage, err2);
      throw err2;
    }
  }
}

/** Same access gate as generation: comped, or active trial/subscription. */
async function assertAccess(
  supabase: Parameters<typeof import("./subscription.functions").readReconciledSubscriber>[0],
  userId: string,
) {
  const { isCompedEmail } = await import("./comped.server");
  const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
  const sub = await readReconciledSubscriber(supabase, userId);
  const comped = isCompedEmail(sub?.email);
  const status = sub?.status ?? "none";
  const hasAccess = comped || hasActiveAccess(status, sub?.current_period_end ?? null);
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

    const releaseReservation = async () => {
      if (!reservationId) return;
      try {
        await supabaseAdmin.rpc("release_generation_slot", {
          _user_id: userId,
          reservation_id: reservationId,
        });
      } catch (err) {
        console.error("release_generation_slot failed", err);
      }
    };

    try {
      // Core and marketing run in parallel. Only core success is required
      // (and only it consumes the reserved listing credit).
      const [coreRes, mktRes] = await Promise.allSettled([
        runCore(data, userId),
        runMarketing(data, userId),
      ]);
      if (coreRes.status === "rejected") throw coreRes.reason;

      const parsed: ListingOutput =
        mktRes.status === "fulfilled"
          ? { ...coreRes.value, ...mktRes.value }
          : { ...coreRes.value, emailBlast: null, social: [], marketingStatus: "failed" };

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
        const { data: finalizedOk, error: finalizeError } = await supabaseAdmin.rpc(
          "finalize_generation_slot",
          { _user_id: userId, reservation_id: reservationId, generation_id: savedGenId },
        );
        if (finalizeError || finalizedOk !== true) {
          await supabase.from("generations").delete().eq("id", savedGenId).eq("user_id", userId);
          reservationId = null;
          throw new Error("Couldn't record listing usage. Please try again.");
        }
        reservationId = null;
      } else if (comped) {
        const { error: usageError } = await supabase.from("generation_usage").insert({
          user_id: userId,
          generation_id: savedGenId,
          plan: sub?.plan ?? null,
        });
        if (usageError) {
          await supabase.from("generations").delete().eq("id", savedGenId).eq("user_id", userId);
          throw new Error("Couldn't record listing usage. Please try again.");
        }
      }

      return { generationId: savedGenId, output: parsed };
    } catch (err) {
      await releaseReservation();
      throw err;
    }
  });

const REGEN_DAILY_LIMIT = 30;

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
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabaseAdmin
      .from("regen_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "marketing")
      .gte("created_at", since.toISOString());
    if (countError) {
      console.error("regen_usage count failed", countError);
      throw new Error("AI_UNAVAILABLE");
    }
    if ((count ?? 0) >= REGEN_DAILY_LIMIT) throw new Error("REGEN_LIMIT_REACHED");

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
      voice: (VALID_VOICES.has(rawInputs.voice as VoiceId)
        ? rawInputs.voice
        : row.voice) as VoiceId,
    };
    let safeInput: ListingInput;
    try {
      safeInput = normaliseInput({
        ...input,
        voice: VALID_VOICES.has(input.voice) ? input.voice : "professional",
      });
    } catch {
      safeInput = { ...input, voice: "professional" };
    }

    let mkt: MarketingOutput;
    try {
      mkt = await runMarketing(safeInput, userId, "regen");
    } catch (err) {
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

    const { error: usageErr } = await supabaseAdmin
      .from("regen_usage")
      .insert({ user_id: userId, kind: "marketing" });
    if (usageErr) console.error("regen_usage insert failed", usageErr);

    return coerceLegacyOutput(rawOut);
  });
