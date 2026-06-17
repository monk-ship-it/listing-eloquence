import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "./ai-gateway.server";
import { VOICE_PROMPTS, type VoiceId } from "./voices";
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

  return `Create a UK property sales listing from the details below.

PROPERTY DETAILS:
${details}

REQUIREMENTS:
- Write only from the facts provided; never invent figures, names or features that are not given.
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
      .select("status, email")
      .eq("user_id", userId)
      .maybeSingle();

    const { isCompedEmail } = await import("./config");
    const status = sub?.status ?? "none";
    const hasAccess =
      isCompedEmail(sub?.email) || status === "trialing" || status === "active";
    if (!hasAccess) {
      throw new Error("SUBSCRIPTION_REQUIRED");
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
    await supabase.from("generations").insert({
      user_id: userId,
      voice,
      property_title: data.address || data.propertyType || "Untitled property",
      inputs: JSON.parse(JSON.stringify(data)),
      output: JSON.parse(JSON.stringify(parsed)),
    });

    return parsed;
  });
