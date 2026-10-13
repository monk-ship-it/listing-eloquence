import { EXTRACTABLE_FIELDS, FIELD_BY_KEY } from "./listing-fields";
import { normaliseForField } from "./dictation-normalise";

export interface ExtractResult {
  fields: Record<string, string>;
  evidence: Record<string, string>;
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
    out.fields[d.key] =
      FIELD_BY_KEY[d.key].dictateMode === "replace" ? normaliseForField(d.key, value) : value;
    out.evidence[d.key] = quote;
  }
  return out;
}
