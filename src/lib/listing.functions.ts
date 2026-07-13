import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "./ai-gateway.server";
import { VOICE_PROMPTS, type VoiceId } from "./voices";
import { MASTER_LISTING_SYSTEM_PROMPT } from "./master-listing-prompt";
import type { ListingInput, ListingOutput } from "./listing-types";

function field(label: string, value: string) {
  return value && value.trim() ? `- ${label}: ${value.trim()}\n` : "";
}

function buildUserPrompt(input: ListingInput): string {
  let details = "";
  details += field("Address / location", input.address);
  details += field("Area highlights", input.areaHighlights);
  details += field("Property type", input.propertyType);
  details += field("Tenure", input.tenure);
  details += field("Lease remaining (years)", input.leaseYears);
  details += field("Asking price (GBP)", input.price);
  details += field("Price qualifier", input.priceQualifier);
  details += field("Bedrooms", input.bedrooms);
  details += field("Bathrooms", input.bathrooms);
  details += field("Reception rooms", input.receptions);
  details += field("Key features", input.keyFeatures);
  details += field("Room dimensions", input.dimensions);
  details += field("EPC rating", input.epc);
  details += field("Council Tax band", input.councilTaxBand);
  details += field("Outside space / garden", input.outsideSpace);
  details += field("Parking", input.parking);
  details += field("Heating", input.heating);
  details += field("Utilities / broadband", input.utilities);
  details += field("Nearby (schools, transport, amenities)", input.nearby);
  details += field("Period / character features", input.periodFeatures);
  details += field("Target audience", input.targetAudience);

  const voiceNotes = input.voiceNotes?.trim()
    ? `\nAGENT VOICE NOTES (raw, dictated or pasted — treat as supplementary context only):\n${input.voiceNotes.trim()}\n`
    : "";

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
- Use British English and spelling throughout.
- Where Material Information is provided (tenure, price, council tax band, EPC, parking, utilities) weave the key facts in naturally.
- The full listing should be portal-ready (Rightmove / OnTheMarket style): an opening hook, then well-organised paragraphs covering the property, accommodation, outside space and location.
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

    const voice = (data.voice ?? "professional") as VoiceId;
    const systemPrompt =
      VOICE_PROMPTS[voice] ??
      VOICE_PROMPTS.professional;

    const content = await callLovableAiJson([
      {
        role: "system",
        content: `You are an expert UK estate agency copywriter who follows National Trading Standards "Material Information" guidance. ${systemPrompt} Always return valid JSON only.`,
      },
      { role: "user", content: buildUserPrompt(data) },
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
