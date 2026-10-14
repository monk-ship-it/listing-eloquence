/**
 * Prompt templates — the exact text the app sends to Claude. Pure module
 * (relative imports only) so bun scripts, vitest and the Workbench export use
 * the same strings. {{VARIABLE}} placeholders are filled by fillTemplate()
 * with values from render.ts (promptVars). docs/workbench/ is generated from
 * this file: run `bun run prompts:export` after editing.
 */
import { MASTER_LISTING_SYSTEM_PROMPT } from "../master-listing-prompt";

export const SYSTEM_TEMPLATE = `${MASTER_LISTING_SYSTEM_PROMPT}\n\nBRAND VOICE FOR THIS LISTING:\n{{BRAND_VOICE}}\n\nReturn your answer only by calling the provided tool.`;

/** Shared facts block embedded in both user templates. */
export const FACTS_SECTION = `STRUCTURED PROPERTY DETAILS (authoritative — these always take priority):
{{PROPERTY_DETAILS}}
MATERIAL INFORMATION (verbatim facts — state these accurately; never contradict or soften):
{{MATERIAL_INFORMATION}}
{{PRIVATE_NOTES}}{{VOICE_NOTES}}
Where the voice notes conflict with a structured field, ALWAYS use the structured field. Never invent or upgrade figures from the notes.
Seller approval of particulars: {{SELLER_APPROVAL}}.`;

export const CORE_USER_TEMPLATE = `Create the core copy for a UK property sales listing from the details below.

${FACTS_SECTION}

PRODUCE:
- "headline": brochure / email headline, max 70 characters.
- "listing": the portal description — plain-text paragraphs separated by a blank line (opening, accommodation, outside space, location, then the material facts per your rules).
- "summary": the strapline (portal summary), max 250 characters; the first 160 characters must stand alone; don't open with the bedroom count or property type.
- "keyFeatures": 6–10 bullets, max 80 characters each, one fact per bullet, no full stops; the first three are the most decision-relevant facts.

Return the result by calling the submit_listing_core tool.{{LIMIT_REMINDER}}`;

export const MARKETING_USER_TEMPLATE = `Create the marketing copy (applicant email, seller approval email and social posts) for a new UK sales instruction from the details below.

${FACTS_SECTION}

EMAIL BLAST (new-instruction email to the agent's registered applicants) — follow your Email Blast limits:
- "subjectLines": exactly 3, max 60 characters, no urgency or clickbait. "previewText": max 90. "headline". "callToAction": e.g. "View full details" or "Book a viewing".
- "body": 2–4 short plain-text paragraphs separated by a blank line, no bullet list, greeting name or sign-off. Include price and qualifier, tenure, council tax band, EPC rating and (leasehold/shared ownership) the key costs. End with "Full material information is on the property listing."

SELLER APPROVAL EMAIL ("sellerEmail.body"): to the SELLER, asking them to check the draft particulars before they go live.
- 150–250 words, warm and professional, plain text. Open "Dear [Seller name]," — never invent a name.
- A numbered list of every key fact supplied above for them to confirm: price and qualifier, tenure, lease figures, council tax, EPC, room counts, parking, supplies and each answered Part C item. Only facts supplied — nothing else.
- Then ask these questions in plain English so the particulars are complete:
{{GAP_QUESTIONS}}
- End with "[Your name, branch, phone]".

SOCIAL: exactly three posts — platform "Instagram", "Facebook" and "X" — each caption includes price and qualifier and tenure; add "Full material information on the listing." where space runs out; relevant hashtags (words only, no '#').

Return the result by calling the submit_listing_marketing tool.`;

/** Appended (as {{LIMIT_REMINDER}}) on the one retry after a limit breach. */
export const LIMIT_REMINDER =
  "\n\nIMPORTANT: your previous answer broke the output limits. The strapline must be 250 characters or fewer, and every key feature 80 characters or fewer.";

export const EXTRACT_SYSTEM = `You extract property facts that a UK estate agent explicitly stated in dictated notes, to pre-fill a listing form.

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

Return the result by calling the fill_listing_fields tool.`;

export const EXTRACT_USER_TEMPLATE = `AGENT VOICE NOTES:\n{{NOTES}}`;

const PLACEHOLDER_RE = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

/** Placeholder names used in a template, in first-seen order. */
export function placeholdersOf(tpl: string): string[] {
  return [...new Set([...tpl.matchAll(PLACEHOLDER_RE)].map((m) => m[1]))];
}

/**
 * Strict single-pass fill: throws if the template uses a variable that isn't
 * supplied, or if a supplied variable isn't used. Values are inserted verbatim
 * (never re-scanned), so user text containing braces is safe.
 */
export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  const used = new Set(placeholdersOf(tpl));
  for (const name of used) {
    if (!(name in vars)) throw new Error(`fillTemplate: missing variable ${name}`);
  }
  for (const name of Object.keys(vars)) {
    if (!used.has(name)) throw new Error(`fillTemplate: unused variable ${name}`);
  }
  return tpl.replace(PLACEHOLDER_RE, (_m, name: string) => vars[name]);
}

/** Pick exactly the variables a template uses from a larger set (throws if one is missing). */
export function varsFor(tpl: string, all: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of placeholdersOf(tpl)) {
    if (!(name in all)) throw new Error(`varsFor: missing variable ${name}`);
    out[name] = all[name];
  }
  return out;
}
