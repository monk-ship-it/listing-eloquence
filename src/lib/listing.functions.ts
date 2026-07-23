import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "./ai-gateway.server";
import { VOICE_PROMPTS, type VoiceId } from "./voices";
import {
  MASTER_LISTING_SYSTEM_PROMPT,
  US_MASTER_LISTING_SYSTEM_PROMPT,
} from "./master-listing-prompt";
import { resolveMarketId, type MarketId } from "./config";
import type { ListingInput, ListingOutput } from "./listing-types";
import { validateNewListingOutput } from "./listing-types";
import { VOICES } from "./voices";

/** Max characters accepted per free-text field to keep payloads sane. */
const MAX_FIELD_LEN = 4000;
const MAX_VOICE_NOTES_LEN = 8000;

const VALID_MARKETS = new Set(["uk", "us"]);
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
  if (!VALID_MARKETS.has(input.market)) {
    throw new Error("Please choose a valid market (UK or US).");
  }
  if (!VALID_VOICES.has(input.voice)) {
    throw new Error("Please choose a valid brand voice.");
  }
  const out = { ...input } as ListingInput;
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

/** Market-aware labels so the model interprets each structured field correctly. */
function fieldLabels(market: MarketId) {
  if (market === "us") {
    return {
      tenure: "Ownership (e.g. fee simple / condo)",
      lease: "HOA / monthly dues",
      price: "Asking price (USD)",
      receptions: "Additional living spaces",
      dimensions: "Square footage / lot size / room dimensions",
      epc: "Energy rating",
      tax: "Property taxes",
      outside: "Outdoor space / lot",
      utilities: "Utilities / internet",
      nearby: "Nearby (school district, transit, amenities)",
      periodFeatures: "Architectural / notable features",
      yearBuilt: "Year built",
      disclosures: "Disclosures / condition notes",
      showingNotes: "Showing / access notes",
      mediaNotes: "Media / photo / floor-plan notes",
    };
  }
  return {
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
}

function buildUserPrompt(input: ListingInput, market: MarketId): string {
  const L = fieldLabels(market);
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

  const isUs = market === "us";

  const languageLine = isUs
    ? "- Use US English spelling and US real estate vocabulary throughout (home, property, square feet, HOA, property taxes, listing, showing). Prices in US dollars."
    : "- Use British English and spelling throughout.";

  const materialLine = isUs
    ? "- Where provided, weave key facts (ownership, price, property taxes, HOA, square footage, lot size, parking, utilities) in naturally. Only use school district, HOA, tax or square footage facts if given."
    : "- Where Material Information is provided (tenure, price, council tax band, EPC, parking, utilities) weave the key facts in naturally.";

  const portalLine = isUs
    ? "- The full listing should be MLS-ready: an opening hook, then well-organised paragraphs covering the home, layout, outdoor space and location. Describe the property, not the ideal buyer — follow Fair Housing (no protected-class references; no school/safety overclaims)."
    : "- The full listing should be portal-ready (Rightmove / OnTheMarket style): an opening hook, then well-organised paragraphs covering the property, accommodation, outside space and location.";

  const factHandlingLine = isUs
    ? "- Only reference disclosures, condition, year built or media notes when those facts are explicitly provided. State disclosure/condition facts factually and never speculate. Do NOT include showing/access notes in the public MLS remarks, teaser or social captions — treat those as internal-only."
    : "- Only reference disclosures, condition, year built or media notes when those facts are explicitly provided. Do NOT include viewing/access notes in the portal description, teaser or social captions — treat those as internal-only.";

  return `Create a ${isUs ? "US real estate" : "UK property"} sales listing from the details below.

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
- Provide 6–10 concise, factual, portal/MLS-ready "keyFeatures" bullets drawn STRICTLY from the supplied facts. Each bullet must be a short phrase (no sentences, no trailing full stops), non-duplicative, and safe for compliance. NEVER invent, upgrade or infer facts. Bullets should highlight the property's strongest, most factual selling points (property type, bedrooms/bathrooms, tenure/ownership, key features, outside space, parking, energy/tax band, notable features, location advantages) in the order most useful to a buyer.
- Provide three social media posts (Instagram, Facebook, X) — each an engaging caption appropriate to that platform, plus a list of relevant hashtags (no '#' symbol in the array, just the words).

Respond ONLY with a JSON object in exactly this shape:
{
  "headline": "string — a compelling listing headline",
  "listing": "string — the full listing body, paragraphs separated by \\n\\n",
  "summary": "string — short teaser",
  "keyFeatures": ["string — short factual bullet", "..."],
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

    // Subscription gate (server-side enforcement)
    const { data: sub } = await supabase
      .from("subscribers")
      .select("status, email, plan, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    const { isCompedEmail, getPlan } = await import("./config");
    const { hasActiveAccess, computeUsage } = await import("./subscription.functions");
    const comped = isCompedEmail(sub?.email);
    const status = sub?.status ?? "none";
    const hasAccess = comped || hasActiveAccess(status, sub?.current_period_end ?? null);
    if (!hasAccess) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    // Monthly listing allowance (per calendar month). Comped accounts are unlimited.
    if (!comped) {
      const usage = await computeUsage(supabase, userId, getPlan(sub?.plan).id, comped);
      if (usage.remaining <= 0) {
        throw new Error("LISTING_LIMIT_REACHED");
      }
    }

    const market = resolveMarketId(data.market);
    const voice = (data.voice ?? "professional") as VoiceId;
    const voicePrompt = VOICE_PROMPTS[voice] ?? VOICE_PROMPTS.professional;
    const masterPrompt =
      market === "us" ? US_MASTER_LISTING_SYSTEM_PROMPT : MASTER_LISTING_SYSTEM_PROMPT;

    // The brand-voice prompts are written for UK English; in US mode the master
    // prompt's US English + vocabulary rules take precedence over any UK phrasing.
    const languageOverride =
      market === "us"
        ? "\n\nLANGUAGE OVERRIDE FOR THIS LISTING: Ignore any instruction in the brand voice to use British English. Write in US English with US real estate vocabulary and follow the US Fair Housing rules above."
        : "";

    const content = await callLovableAiJson([
      {
        role: "system",
        content: `${masterPrompt}\n\nBRAND VOICE FOR THIS LISTING:\n${voicePrompt}${languageOverride}`,
      },
      { role: "user", content: buildUserPrompt(data, market) },
    ]);

    let parsed: ListingOutput;
    try {
      const raw = JSON.parse(content);
      parsed = validateNewListingOutput(raw);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("MALFORMED_AI_OUTPUT");
      try {
        parsed = validateNewListingOutput(JSON.parse(match[0]));
      } catch {
        throw new Error("MALFORMED_AI_OUTPUT");
      }
    }

    // Persist to history — abort before recording usage if the save fails,
    // so the user isn't charged a listing they can't retrieve.
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
    const savedGenId = savedGen.id;

    // Record durable usage independently of the deletable history row.
    // Deleting history must never reduce monthly usage. If this write fails,
    // best-effort delete the just-created generation so the user isn't left
    // with a saved listing that didn't consume quota, then surface a
    // retryable error.
    const { error: usageError } = await supabase.from("generation_usage").insert({
      user_id: userId,
      generation_id: savedGenId,
      plan: getPlan(sub?.plan).id,
    });
    if (usageError) {
      await supabase.from("generations").delete().eq("id", savedGenId).eq("user_id", userId);
      throw new Error("Couldn't record listing usage. Please try again.");
    }

    return parsed;
  });
