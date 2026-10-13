import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "./ai-gateway.server";
import { VOICE_PROMPTS, type VoiceId } from "./voices";
import { MASTER_LISTING_SYSTEM_PROMPT } from "./master-listing-prompt";
import type { ListingInput, ListingOutput } from "./listing-types";
import { validateNewListingOutput } from "./listing-types";
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

function buildUserPrompt(input: ListingInput): string {
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

  const languageLine =
    "- Use British English and spelling throughout.";

  const materialLine =
    "- Where Material Information is provided (tenure, price, council tax band, EPC, parking, utilities) weave the key facts in naturally.";

  const portalLine =
    "- The full listing should be portal-ready (Rightmove / OnTheMarket style): an opening hook, then well-organised paragraphs covering the property, accommodation, outside space and location.";

  const factHandlingLine =
    "- Only reference disclosures, condition, year built or media notes when those facts are explicitly provided. Do NOT include viewing/access notes in the portal description, teaser or social captions — treat those as internal-only.";

  return `Create a UK property sales listing from the details below.

STRUCTURED PROPERTY DETAILS (authoritative — these always take priority):
${details}
${voiceNotes}
RULES FOR COMBINING SOURCES:
- The structured property details above are authoritative. Where the agent voice notes conflict with a structured field, ALWAYS use the structured field (e.g. structured "Bedrooms: 4" wins over voice notes saying "five bedrooms").
- Use the voice notes only to add extra colour, context or facts that are NOT already covered by a structured field. Never invent or upgrade figures from the notes.


REQUIREMENTS:
- Write only from the facts provided; never invent figures, names or features that are not given.
- Read every detail precisely and do not transfer an adjective from one thing to another. A descriptor attached to a specific feature applies ONLY to that feature — e.g. "Victorian fireplace" means the fireplace is Victorian, NOT that the property is Victorian. Never describe the property's style, era or type unless the property type itself explicitly states it.
- Do not generalise, upgrade or embellish facts: keep each described attribute scoped exactly to the item it was given for.
${languageLine}
${materialLine}
${portalLine}
${factHandlingLine}
- Provide a short punchy teaser summary (1–2 sentences).
- Provide 6–10 concise, factual, portal-ready "keyFeatures" bullets drawn STRICTLY from the supplied facts. Each bullet must be a short phrase (no sentences, no trailing full stops), non-duplicative, and safe for compliance. NEVER invent, upgrade or infer facts. Bullets should highlight the property's strongest, most factual selling points (property type, bedrooms/bathrooms, tenure/ownership, key features, outside space, parking, energy/tax band, notable features, location advantages) in the order most useful to a buyer.
- Provide an "emailBlast" object with:
    - "subjectLines": exactly 3 unique, concise subject-line options (short strings, no emoji spam, no ALL CAPS);
    - "previewText": one short preheader / preview text (factual one-liner);
    - "headline": a short campaign headline;
    - "body": a plain-text email body of 2–4 short paragraphs, UK estate-agent database email tone, matching the selected voice, grounded ONLY in the structured facts above;
    - "callToAction": a short CTA label such as ${isUs ? '"View property details" or "Schedule a showing"' : '"View property details" or "Arrange a viewing"'}.
    NEVER invent an agent name, phone, email, URL, date, availability, urgency or offer deadline in the email — the user fills those in separately. Keep private viewing/access notes out of the campaign copy.
- Provide three social media posts (Instagram, Facebook, X) — each an engaging caption appropriate to that platform, plus a list of relevant hashtags (no '#' symbol in the array, just the words).

Respond ONLY with a JSON object in exactly this shape:
{
  "headline": "string — a compelling listing headline",
  "listing": "string — the full listing body, paragraphs separated by \\n\\n",
  "summary": "string — short teaser",
  "keyFeatures": ["string — short factual bullet", "..."],
  "emailBlast": {
    "subjectLines": ["string", "string", "string"],
    "previewText": "string",
    "headline": "string",
    "body": "string",
    "callToAction": "string"
  },
  "social": [
    { "platform": "Instagram", "caption": "string", "hashtags": ["string"] },
    { "platform": "Facebook", "caption": "string", "hashtags": ["string"] },
    { "platform": "X", "caption": "string", "hashtags": ["string"] }
  ]
}`;
}

export const generateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ListingInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    const cleaned = normaliseInput(input);
    if (!cleaned.address?.trim() && !cleaned.propertyType?.trim() && !cleaned.keyFeatures?.trim()) {
      throw new Error("Please provide some property details before generating.");
    }
    return cleaned;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Subscription gate (server-side enforcement). The row is reconciled
    // against Stripe first so a subscription cancelled in Stripe can never
    // keep granting access from a stale database status.
    const { isCompedEmail } = await import("./comped.server");
    const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
    const sub = await readReconciledSubscriber(supabase, userId);
    const comped = isCompedEmail(sub?.email);
    const status = sub?.status ?? "none";
    const hasAccess = comped || hasActiveAccess(status, sub?.current_period_end ?? null);
    if (!hasAccess) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    // Atomic monthly-quota reservation for paid/trial users. Comped accounts
    // stay unlimited and skip reservation entirely. The quota RPCs are
    // service-role only (not callable by signed-in users); the user id passed
    // in comes from the verified auth middleware, never from the client.
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
      const voice = (data.voice ?? "professional") as VoiceId;
      const voicePrompt = VOICE_PROMPTS[voice] ?? VOICE_PROMPTS.professional;

      const messages = [
        {
          role: "system" as const,
          content: `${MASTER_LISTING_SYSTEM_PROMPT}\n\nBRAND VOICE FOR THIS LISTING:\n${voicePrompt}`,
        },
        { role: "user" as const, content: buildUserPrompt(data) },
      ];

      const parseOutput = (content: string): ListingOutput | null => {
        try {
          return validateNewListingOutput(JSON.parse(content));
        } catch {
          const match = content.match(/\{[\s\S]*\}/);
          if (!match) return null;
          try {
            return validateNewListingOutput(JSON.parse(match[0]));
          } catch {
            return null;
          }
        }
      };

      // One automatic retry on malformed JSON. The quota slot was reserved once
      // above, so a retry never consumes a second listing.
      let parsed: ListingOutput | null = null;
      for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
        const content = await callLovableAiJson(messages);
        parsed = parseOutput(content);
        if (!parsed) console.warn("Malformed AI output", { attempt });
      }
      if (!parsed) throw new Error("MALFORMED_AI_OUTPUT");

      // Persist to history.
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
        // Finalize the reservation atomically — attach it to the generation.
        const { data: finalizedOk, error: finalizeError } = await supabaseAdmin.rpc(
          "finalize_generation_slot",
          { _user_id: userId, reservation_id: reservationId, generation_id: savedGenId },
        );

        if (finalizeError || finalizedOk !== true) {
          // Compensate: remove the just-created generation, then release the
          // reservation so history and quota can't diverge.
          await supabase.from("generations").delete().eq("id", savedGenId).eq("user_id", userId);
          reservationId = null; // finalize failed but reservation still exists
          throw new Error("Couldn't record listing usage. Please try again.");
        }
        // Reservation is now completed; do not release on any later error.
        reservationId = null;
      } else if (comped) {
        // Comped accounts keep durable usage analytics via the direct insert
        // path. If it fails, roll back history so the two views stay aligned.
        // `plan` mirrors the stored subscription plan only — the RLS policy
        // rejects any self-reported plan that differs from the real one.
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

      return parsed;
    } catch (err) {
      await releaseReservation();
      throw err;
    }
  });
