import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EXTRACTABLE_FIELDS, FIELD_BY_KEY } from "./listing-fields";
import { normaliseForField } from "./dictation-normalise";

const MAX_NOTES = 8000;
const DAILY_LIMIT = 40;
const TOOL = "fill_listing_fields";

export interface ExtractResult {
  fields: Record<string, string>;
  evidence: Record<string, string>;
}

const SYSTEM = `You extract property facts that a UK estate agent explicitly stated in dictated notes, to pre-fill a listing form.

RULES:
- Return ONLY values the agent explicitly stated. Never infer, guess or assume. If something isn't said, omit the field entirely.
- Do not derive one field from another: e.g. never set tenure from the word "flat" or "house"; never guess council tax band, EPC, lease length, year built or price.
- Normalise: bedrooms/bathrooms/receptions/lease years as digits ("four" → "4", "two and a half" → "2.5"); EPC and council tax as a single capital letter ("EPC C" → "C", "band d" → "D"); price as digits with commas, no £ ("one point four five million" → "1,450,000", "three fifty" said as a price → "350,000", "350k" → "350,000"); tenure capitalised ("Freehold", "Leasehold", "Share of freehold").
- priceQualifier only when a qualifier is said, written in title case, e.g. "Guide Price", "Offers in Excess of", "Offers Over".
- For descriptive fields (key features, outside space, parking, heating, nearby etc.) keep the agent's own wording, tidied into a short comma-separated phrase. Don't add adjectives.
- Viewing/access instructions go only in showingNotes.
- For every field you return, add an "evidence" entry: a short VERBATIM quote (max 80 characters) copied exactly from the notes that states it.

Return the result by calling the ${TOOL} tool.`;

function buildSchema() {
  const props: Record<string, unknown> = {};
  const evidence: Record<string, unknown> = {};
  for (const d of EXTRACTABLE_FIELDS) {
    props[d.key] = { type: "string", description: d.label };
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

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9£'%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pure server-side filter: whitelist keys, strings only, length caps, and
 * drop any field whose evidence quote isn't found in the notes.
 */
export function filterExtraction(raw: unknown, notes: string): ExtractResult {
  const out: ExtractResult = { fields: {}, evidence: {} };
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  const ev = (r.evidence && typeof r.evidence === "object" ? r.evidence : {}) as Record<
    string,
    unknown
  >;
  const haystack = norm(notes);
  for (const d of EXTRACTABLE_FIELDS) {
    const v = r[d.key];
    const q = ev[d.key];
    if (typeof v !== "string" || typeof q !== "string") continue;
    const value = v.trim();
    const quote = q.trim().slice(0, 80);
    const max = d.kind === "input" ? 300 : 1500;
    if (!value || value.length > max || !quote) continue;
    const nq = norm(quote);
    if (!nq || !haystack.includes(nq)) continue;
    out.fields[d.key] = FIELD_BY_KEY[d.key].dictateMode === "replace" ? normaliseForField(d.key, value) : value;
    out.evidence[d.key] = quote;
  }
  return out;
}

/** "Fill the form from my voice note". Free (no listing credit), 40/day. */
export const extractListingFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { voiceNotes: string }) => {
    const notes = typeof input?.voiceNotes === "string" ? input.voiceNotes.trim() : "";
    if (notes.length < 10) throw new Error("Add a few details to your voice notes first.");
    if (notes.length > MAX_NOTES) throw new Error("Your voice notes are too long to read in one go.");
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

    const { callClaudeTool } = await import("./ai-gateway.server");
    let raw: unknown;
    try {
      raw = await callClaudeTool({
        system: SYSTEM,
        user: `AGENT VOICE NOTES:\n${data.voiceNotes}`,
        toolName: TOOL,
        toolDescription: "Submit only the fields the agent explicitly stated.",
        inputSchema: buildSchema(),
        maxTokens: 1500,
        timeoutMs: 30_000,
        temperature: 0,
      });
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

    const result = filterExtraction(raw, data.voiceNotes);
    const { error: usageErr } = await supabaseAdmin
      .from("regen_usage")
      .insert({ user_id: userId, kind: "extract" });
    if (usageErr) console.error("regen_usage insert failed", usageErr);
    return result;
  });
