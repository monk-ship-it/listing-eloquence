import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EXTRACTABLE_FIELDS } from "./listing-fields";
import { filterExtraction, type ExtractResult } from "./extract-filter";

const MAX_NOTES = 8000;
const DAILY_LIMIT = 40;
const TOOL = "fill_listing_fields";

const SYSTEM = `You extract property facts that a UK estate agent explicitly stated in dictated notes, to pre-fill a listing form.

RULES:
- Return ONLY values the agent explicitly stated. Never infer, guess or assume. If something isn't said, omit the field entirely.
- Do not derive one field from another: e.g. never set tenure from the word "flat" or "house"; never guess council tax band, EPC, lease length, year built or price.
- Normalise: bedrooms/bathrooms/receptions/lease years as digits ("four" → "4", "two and a half" → "2.5"); EPC and council tax as a single capital letter ("EPC C" → "C", "band d" → "D"); price as digits with commas, no £ ("one point four five million" → "1,450,000", "three fifty" said as a price → "350,000", "350k" → "350,000"); tenure capitalised ("Freehold", "Leasehold", "Share of freehold").
- priceQualifier only when a qualifier is said, written in title case, e.g. "Guide Price", "Offers in Excess of", "Offers Over".
- For descriptive fields (key features, outside space, parking, heating, nearby etc.) keep the agent's own wording, tidied into a short comma-separated phrase. Don't add adjectives.
- Viewing/access instructions go only in showingNotes; photo/floorplan notes only in mediaNotes.
- Select fields must use one of the listed options exactly. Part C items (building safety, restrictions, rights & easements, flooding, coastal erosion, planning, accessibility, coalfield/mining) only when the agent addresses them: "None known" if they say none/no, otherwise "Yes – <details>".
- Supplies: only what is said (e.g. "mains drainage" → sewerage "Mains"; don't assume mains for anything else).
- For every field you return, add an "evidence" entry: a short VERBATIM quote (max 80 characters) copied exactly from the notes that states it.

Return the result by calling the ${TOOL} tool.`;

function buildSchema() {
  const props: Record<string, unknown> = {};
  const evidence: Record<string, unknown> = {};
  for (const d of EXTRACTABLE_FIELDS) {
    props[d.key] = {
      type: "string",
      description: [
        d.label,
        d.kind === "select" && d.options ? `One of: ${d.options.join(" | ")}.` : "",
        d.hint ?? "",
      ]
        .filter(Boolean)
        .join(" "),
    };
    evidence[d.key] = { type: "string", maxLength: 80 };
  }
  return {
    type: "object",
    properties: {
      ...props,
      evidence: {
        type: "object",
        description: "Verbatim quote from the notes supporting each returned field",
        properties: evidence,
      },
    },
    required: ["evidence"],
  };
}

/** Model call + server-side evidence filter (server only). */
export async function runExtraction(notes: string): Promise<ExtractResult> {
  const { callClaudeTool } = await import("./ai-gateway.server");
  const raw = await callClaudeTool({
    system: SYSTEM,
    user: `AGENT VOICE NOTES:\n${notes}`,
    toolName: TOOL,
    toolDescription: "Submit only the fields the agent explicitly stated.",
    inputSchema: buildSchema(),
    maxTokens: 1500,
    timeoutMs: 30_000,
    temperature: 0,
  });
  return filterExtraction(raw, notes);
}

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
    const { isCompedEmail } = await import("./comped.server");
    const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
    const sub = await readReconciledSubscriber(supabase, userId);
    const comped = isCompedEmail(sub?.email);
    if (!comped && !hasActiveAccess(sub?.status ?? "none", sub?.current_period_end ?? null)) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabaseAdmin
      .from("regen_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "extract")
      .gte("created_at", since.toISOString());
    if (countError) {
      console.error("regen_usage count failed", countError);
      throw new Error("AI_UNAVAILABLE");
    }
    if ((count ?? 0) >= DAILY_LIMIT) throw new Error("EXTRACT_LIMIT_REACHED");

    let result: ExtractResult;
    try {
      result = await runExtraction(data.voiceNotes);
    } catch (err) {
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

    const { error: usageErr } = await supabaseAdmin
      .from("regen_usage")
      .insert({ user_id: userId, kind: "extract" });
    if (usageErr) console.error("regen_usage insert failed", usageErr);
    return result;
  });
