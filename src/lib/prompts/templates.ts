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
Where the voice notes conflict with a structured field, ALWAYS use the structured field. Never take a material-information figure from the voice notes.
Seller approval of particulars: {{SELLER_APPROVAL}} (for the app only — never mention it in the copy).`;

export const CORE_USER_TEMPLATE = `Create the core copy for a UK property sales listing from the details below.

${FACTS_SECTION}

PRODUCE:
- "headline": brochure / email headline, max 70 characters.
- "listing": the portal description — plain-text paragraphs separated by one blank line, in the paragraph order set by the brand voice and within its word range. Paragraph 1 gives the property type, bedroom count and location as supplied, plus the two most decision-relevant facts. For leasehold, give years remaining, ground rent with its review terms, and service charge in the same sentence as the tenure. Mention parking in words when a parking fact is supplied. The final paragraph restates Part A, every known issue and every Part C item answered Yes, copying figures exactly. Don't repeat the key features word for word.
- "summary": the strapline (portal summary), max 250 characters; the first 160 characters must stand alone; don't open with the bedroom count or property type.
- "keyFeatures": 6–10 bullets, max 80 characters each, one fact per bullet, no full stops; the first three are the most decision-relevant facts.

Return the result by calling the submit_listing_core tool.{{LIMIT_REMINDER}}`;

export const MARKETING_USER_TEMPLATE = `Create the marketing copy (applicant email, seller approval email and social posts) for a new UK sales instruction from the details below.

${FACTS_SECTION}

EMAIL BLAST (new-instruction email to the agent's registered applicants):
- "subjectLines": exactly 3, max 60 characters. Each contains the area, the property type with bedrooms, and the price with its qualifier, e.g. "New instruction: 3-bed semi, Lordswood – Guide £285,000". Vary the lead ("New instruction:", "Just listed:", or the standout supplied fact). Never a price without its qualifier. Never "exclusive", "don't miss", "hurry" or emojis.
- "previewText": max 90 characters — the next facts not in the subject, e.g. "Freehold · No onward chain · EPC C".
- "headline": max 70 characters.
- "body": 3–4 short plain-text paragraphs separated by a blank line, no bullet list, greeting name or sign-off. Paragraph 1: the price exactly as in the facts, the tenure, and where they apply the sale method, share %, under-offer status and any reservation or buyer's fee. Paragraph 2: the three strongest specifics. Paragraph 3: council tax band, EPC rating and, for leasehold or shared ownership, years remaining, ground rent, service charge and rent, copied exactly from the MATERIAL INFORMATION block. If there are known issues or Part C items answered Yes, add one sentence starting "Please note:" that states them plainly. End with "Full material information is on the property listing."
- "personalMessage": 40–80 words for the CRM property-alert message box — what it is, where, price with qualifier, the standout fact, and an invitation to book a viewing. No greeting name, no sign-off.
- "callToAction": "Book a viewing".

SELLER APPROVAL EMAIL ("sellerEmail.body"): to the SELLER, written as their negotiator — warm, plain, brief, not salesy, no exclamation marks, 150–250 words.
- Open exactly "Dear [Seller name]," and keep this placeholder even if a name appears in the notes.
- Thank them and explain that the draft details are below for checking before anything goes live.
- Then a numbered list with one supplied fact per line in the form "Tenure: Freehold – is this correct?": price and qualifier, tenure and lease figures, council tax, EPC, room counts, parking, supplies, chain status, every known issue and each answered Part C item. Only facts supplied — nothing from the voice notes or private notes.
- Then "To complete the particulars, could you let us know:" followed by every one of these questions, word for word:
{{GAP_QUESTIONS}}
- Close: "Please reply \"Approved\" or send any corrections — nothing will be published until you confirm." then "[Your name, branch, phone]". Never mention law, Trading Standards or penalties.

SOCIAL: exactly three posts — platform "Instagram", "Facebook" and "X". Every caption states the price exactly as in the facts, the tenure and the EPC rating (shared ownership adds "<n>% share"; auction or MMoA adds the sale method and "reservation fee applies"), then "Full material information on the listing."
- Instagram: 80–150 words. Line 1 max 125 characters (area, type, price with qualifier). Then 3–5 short lines, one supplied fact each. Then "Tenure · EPC X · Council tax band X". A "Please note:" sentence for any known issue or Part C Yes item. Max 2 emojis, none in line 1. 5–10 hashtags (town, county, property type, newinstruction).
- Facebook: 100–180 words in plain sentences, including tenure, EPC and council tax band, plus the "Please note:" sentence where relevant. Max 3 hashtags, max 2 emojis.
- X: caption max 200 characters, at most 2 hashtags, no emojis, required items first; caption plus hashtags 280 characters or fewer.
- Hashtags are words only, no '#'.

Return the result by calling the submit_listing_marketing tool.`;

/** Appended (as {{LIMIT_REMINDER}}) on the one retry after a limit breach. */
export const LIMIT_REMINDER =
  "\n\nIMPORTANT: your previous answer broke the output limits. The strapline must be 250 characters or fewer, and every key feature 80 characters or fewer.";

export const EXTRACT_SYSTEM = `You extract property facts that a UK estate agent explicitly stated in dictated notes, to pre-fill a listing form.

RULES:
- Return ONLY values the agent explicitly stated. Never infer, guess or assume. If something isn't said, omit the field entirely.
- Do not derive one field from another: e.g. never set tenure from the word "flat" or "house"; never guess council tax band, EPC, lease length, year built or price. "Vacant" or "probate" does not mean "No onward chain" unless the agent says "no chain".
- Hedged figures are not facts: if a price, ground rent, service charge, lease length or other figure is hedged ("about 300 I think", "not sure", "roughly", "TBC"), leave that field out.
- If the agent corrects themselves, use only the final corrected value; if two values still conflict, omit the field.
- Normalise: bedrooms/bathrooms/receptions/lease years as digits ("four" → "4", "two and a half" → "2.5"); EPC and council tax as a single capital letter ("EPC C" → "C", "band d" → "D"); price as digits with commas, no £ ("one point four five million" → "1,450,000", "three fifty" said as a price → "350,000", "350k" → "350,000"); tenure capitalised ("Freehold", "Leasehold", "Share of freehold").
- priceQualifier only when a qualifier is said, written in title case, e.g. "Guide Price", "Offers in Excess of" (also "OIEO"), "Offers Over".
- For descriptive fields (key features, outside space, parking, heating, nearby etc.) keep the agent's own wording, tidied into a short comma-separated phrase. Don't add adjectives, and drop the agent's opinions ("stunning", "investor's dream").
- Defects, survey findings, knotweed, subsidence, damp, movement, insurance claims or disputes go in disclosures, verbatim.
- Viewing/access instructions (keys, lockboxes, alarm codes, pets, occupiers' availability) go only in showingNotes; photo/floorplan notes only in mediaNotes. Never put the seller's personal circumstances or the price they would accept in any field.
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
