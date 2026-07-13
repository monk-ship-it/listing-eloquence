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
    ? "- Only reference disclosures, condition, year built or media notes when those facts are explicitly provided. State disclosure/condition facts factually and never speculate. Keep showing/access notes OUT of the public MLS remarks and social captions — use them only in the buyer email where scheduling is appropriate."
    : "- Only reference disclosures, condition, year built or media notes when those facts are explicitly provided. Keep viewing/access notes out of the portal description and social captions — use them only in the buyer email.";

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
- Provide a short punchy teaser summary (1–2 sentences).
- Provide three social media posts (Instagram, Facebook, X) — each an engaging caption appropriate to that platform, plus a list of relevant hashtags (no '#' symbol in the array, just the words).

Respond ONLY with a JSON object in exactly this shape:
{
  "headline": "string — a compelling listing headline",
  "listing": "string — the full listing body, paragraphs separated by \\n\\n",
  "summary": "string — short teaser",
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
    if (!input.address?.trim() && !input.propertyType?.trim() && !input.keyFeatures?.trim()) {
      throw new Error("Please provide some property details before generating.");
    }
    return input;
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
    const hasAccess =
      comped || hasActiveAccess(status, sub?.current_period_end ?? null);
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
      parsed = JSON.parse(content);
    } catch {
      // Attempt to salvage JSON from any wrapping text
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("The AI returned an unexpected response. Please try again.");
      parsed = JSON.parse(match[0]);
    }

    // Persist to history
    const { data: savedGen } = await supabase
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

    // Record durable usage independently of the deletable history row.
    // Deleting history must never reduce monthly usage.
    await supabase.from("generation_usage").insert({
      user_id: userId,
      generation_id: savedGen?.id ?? null,
      plan: getPlan(sub?.plan).id,
    });

    return parsed;
  });
