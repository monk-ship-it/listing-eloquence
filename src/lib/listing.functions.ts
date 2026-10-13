import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callClaudeTool } from "./ai-gateway.server";
import { VOICE_PROMPTS, type VoiceId } from "./voices";
import { MASTER_LISTING_SYSTEM_PROMPT } from "./master-listing-prompt";
import type { CoreOutput, ListingInput, ListingOutput, MarketingOutput } from "./listing-types";
import { coerceLegacyOutput, validateCoreOutput, validateMarketingOutput } from "./listing-types";
import { VOICES } from "./voices";

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
  const stringKeys: (keyof ListingInput)[] = [
    "voiceNotes",
    "address",
    "areaHighlights",
    "propertyType",
    "tenure",
    "leaseYears",
    "price",
    "priceQualifier",
    "bedrooms",
    "bathrooms",
    "receptions",
    "keyFeatures",
    "dimensions",
    "epc",
    "councilTaxBand",
    "outsideSpace",
    "parking",
    "heating",
    "utilities",
    "nearby",
    "periodFeatures",
    "targetAudience",
    "yearBuilt",
    "disclosures",
    "showingNotes",
    "mediaNotes",
  ];
  for (const k of stringKeys) {
    const max = k === "voiceNotes" ? MAX_VOICE_NOTES_LEN : MAX_FIELD_LEN;
    (out as unknown as Record<string, string>)[k as string] = clip(
      (input as unknown as Record<string, unknown>)[k as string],
      max,
      String(k),
    );
  }
  return out;
}

function field(label: string, value: string) {
  return value && value.trim() ? `- ${label}: ${value.trim()}\n` : "";
}

/** UK labels so the model interprets each structured field correctly. */
const L = {
  tenure: "Tenure",
  lease: "Lease remaining (years)",
  price: "Asking price (GBP)",
  receptions: "Reception rooms",
  dimensions: "Room dimensions",
  epc: "EPC rating",
  tax: "Council Tax band",
  outside: "Outside space / garden",
  utilities: "Utilities / broadband",
  nearby: "Nearby (schools, transport, amenities)",
  periodFeatures: "Period / character features",
  yearBuilt: "Year built",
  disclosures: "Disclosures / condition notes",
  showingNotes: "Viewing / access notes",
  mediaNotes: "Media / photo / floor-plan notes",
};

function buildFacts(input: ListingInput): string {
  let details = "";
  details += field("Address / location", input.address);
  details += field("Area highlights", input.areaHighlights);
  details += field("Property type", input.propertyType);
  details += field(L.yearBuilt, input.yearBuilt);
  details += field(L.tenure, input.tenure);
  details += field(L.lease, input.leaseYears);
  details += field(L.price, input.price);
  details += field("Price qualifier", input.priceQualifier);
  details += field("Bedrooms", input.bedrooms);
  details += field("Bathrooms", input.bathrooms);
  details += field(L.receptions, input.receptions);
  details += field("Key features", input.keyFeatures);
  details += field(L.dimensions, input.dimensions);
  details += field(L.epc, input.epc);
  details += field(L.tax, input.councilTaxBand);
  details += field(L.outside, input.outsideSpace);
  details += field("Parking", input.parking);
  details += field("Heating / cooling", input.heating);
  details += field(L.utilities, input.utilities);
  details += field(L.nearby, input.nearby);
  details += field(L.periodFeatures, input.periodFeatures);
  details += field(L.disclosures, input.disclosures);
  details += field(L.showingNotes, input.showingNotes);
  details += field(L.mediaNotes, input.mediaNotes);
  details += field("Target audience", input.targetAudience);

  const voiceNotes = input.voiceNotes?.trim()
    ? `\nAGENT VOICE NOTES (raw, dictated or pasted — treat as supplementary context only):\n${input.voiceNotes.trim()}\n`
    : "";

  return `STRUCTURED PROPERTY DETAILS (authoritative — these always take priority):
${details || "- (none supplied — use the voice notes)\n"}
${voiceNotes}
RULES FOR COMBINING SOURCES:
- The structured property details above are authoritative. Where the agent voice notes conflict with a structured field, ALWAYS use the structured field (e.g. structured "Bedrooms: 4" wins over voice notes saying "five bedrooms").
- Use the voice notes only to add extra colour, context or facts that are NOT already covered by a structured field. Never invent or upgrade figures from the notes.

GENERAL REQUIREMENTS:
- Write only from the facts provided; never invent figures, names or features that are not given.
- Read every detail precisely and do not transfer an adjective from one thing to another. A descriptor attached to a specific feature applies ONLY to that feature — e.g. "Victorian fireplace" means the fireplace is Victorian, NOT that the property is Victorian. Never describe the property's style, era or type unless the property type itself explicitly states it.
- Do not generalise, upgrade or embellish facts: keep each described attribute scoped exactly to the item it was given for.
- Use British English and spelling throughout.
- Do NOT include viewing/access notes anywhere — treat those as internal-only.`;
}

function buildCorePrompt(input: ListingInput): string {
  return `Create the core copy for a UK property sales listing from the details below.

${buildFacts(input)}
- Where Material Information is provided (tenure, price, council tax band, EPC, parking, utilities) weave the key facts in naturally.
- The full listing should be portal-ready (Rightmove / OnTheMarket style): an opening hook, then well-organised paragraphs covering the property, accommodation, outside space and location. Separate paragraphs with a blank line.
- Only reference disclosures, condition, year built or media notes when those facts are explicitly provided.
- Provide a short punchy teaser summary (1–2 sentences).
- Provide 6–10 concise, factual, portal-ready "keyFeatures" bullets drawn STRICTLY from the supplied facts. Each bullet must be a short phrase (no sentences, no trailing full stops), non-duplicative, and safe for compliance. Order them by usefulness to a buyer.

Return the result by calling the ${CORE_TOOL} tool.`;
}

function buildMarketingPrompt(input: ListingInput): string {
  return `Create the marketing copy (applicant email and social posts) for a new UK sales instruction from the details below.

${buildFacts(input)}

EMAIL BLAST (new-instruction email to the agent's applicant database):
- "subjectLines": exactly 3 unique options, each ideally 60 characters or fewer, no emoji, no ALL CAPS.
- "previewText": one factual preheader, ideally 90 characters or fewer.
- "headline": a short campaign headline.
- "body": plain text, 2–4 short paragraphs separated by a blank line, matching the selected voice, grounded ONLY in the facts above. Include the EPC rating where supplied. Do not include a bullet list (key features are added separately), a greeting name, or a sign-off.
- "callToAction": a short label such as "View property details" or "Arrange a viewing".
- NEVER invent an agent name, phone, email, URL, date, availability, urgency or offer deadline.

SOCIAL: exactly three posts — platform "Instagram", "Facebook" and "X" — each an engaging caption suited to that platform, plus relevant hashtags (words only, no '#').

Return the result by calling the ${MARKETING_TOOL} tool.`;
}

const CORE_TOOL = "submit_listing_core";
const MARKETING_TOOL = "submit_listing_marketing";

const CORE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "A compelling listing headline" },
    listing: { type: "string", description: "Full portal description, paragraphs separated by \\n\\n" },
    summary: { type: "string", description: "1–2 sentence teaser" },
    keyFeatures: {
      type: "array",
      items: { type: "string" },
      minItems: 6,
      maxItems: 10,
      description: "6–10 short factual bullets",
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
  required: ["emailBlast", "social"],
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

/** CORE call: retry once on truncation/invalid output (8000 tokens) or timeout. */
export async function runCore(input: ListingInput, userId: string): Promise<CoreOutput> {
  const system = systemPromptFor(input.voice);
  const user = buildCorePrompt(input);
  const attempt = async (maxTokens: number) =>
    validateCoreOutput(
      await callClaudeTool({
        system,
        user,
        toolName: CORE_TOOL,
        toolDescription: "Submit the headline, portal description, teaser and key features.",
        inputSchema: CORE_SCHEMA,
        maxTokens,
      }),
    );
  try {
    return await attempt(6000);
  } catch (err) {
    await logGenerationError(userId, "core", err);
    const code = errorCode(err);
    if (code === "AI_TRUNCATED" || code === "MALFORMED_AI_OUTPUT") return await attempt(8000);
    if (code === "AI_TIMEOUT") return await attempt(6000);
    throw err;
  }
}

/** MARKETING call: one retry on any failure. */
export async function runMarketing(
  input: ListingInput,
  userId: string,
  stage: "marketing" | "regen" = "marketing",
): Promise<MarketingOutput> {
  const system = systemPromptFor(input.voice);
  const user = buildMarketingPrompt(input);
  const attempt = async () =>
    validateMarketingOutput(
      await callClaudeTool({
        system,
        user,
        toolName: MARKETING_TOOL,
        toolDescription: "Submit the Email Blast and the three social posts.",
        inputSchema: MARKETING_SCHEMA,
        maxTokens: 3000,
      }),
    );
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
  supabase: Parameters<
    typeof import("./subscription.functions").readReconciledSubscriber
  >[0],
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
      voice: (VALID_VOICES.has(rawInputs.voice as VoiceId) ? rawInputs.voice : row.voice) as VoiceId,
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
