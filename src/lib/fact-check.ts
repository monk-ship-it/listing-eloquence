/**
 * Deterministic fact check of generated copy against the agent's inputs.
 * Flags numbers, £ amounts, measurements, storey/floor counts, era words and
 * capitalised names that don't appear anywhere in the inputs, plus banned
 * phrases and contact details in portal copy. Guidance only.
 */
import { wordsToNumber } from "./dictation-normalise";
import { BANNED_PHRASES } from "./prompts/banned";

export type FlagKind = "not-in-notes" | "banned" | "contact" | "private-leak";

/** What triggered a not-in-notes flag (graders treat names as softer). */
export type FlagRule = "number" | "storey" | "era" | "name";

export interface FactFlag {
  term: string;
  kind: FlagKind;
  section: string;
  rule?: FlagRule;
}

export { BANNED_PHRASES };

const NUMBER_WORDS = [
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "hundred",
];

const ERA_RE =
  /\b(georgian|victorian|edwardian|tudor|regency|elizabethan|jacobean|stuart|queen anne|art deco|arts and crafts|mid-century|medieval|inter-war|post-war|\d{2}(?:st|nd|rd|th)[- ]century|1[5-9]\d0s|20[0-2]0s)\b/gi;
const STOREY_RE =
  /\b(?:(single|one|two|three|four|five|six|\d+)[- ](?:storey|story|floor|level)s?|(?:over|across|on|arranged over)\s+(two|three|four|five|six|\d+)\s+(?:floors|storeys|stories|levels))\b/gi;
const CONTACT_RE =
  /(\b[\w.+-]+@[\w-]+\.[\w.]+\b|\bhttps?:\/\/\S+|\bwww\.\S+|\b\S+\.(?:co\.uk|com|uk|net|org)\b|(?:\+44\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b)/gi;

/** Capitalised words that are fine without appearing in the notes. */
const CAP_STOPWORDS = new Set(
  (
    "i a an the this that these those it its in on at by for from with of and or but to as is are be " +
    "monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december " +
    "epc council tax band guide price offers excess region over fixed freehold leasehold share commonhold ownership " +
    "instagram facebook x rightmove zoopla onthemarket full material information listing property details subject " +
    "ground rent service charge mains electricity water sewerage heating broadband mobile signal parking construction " +
    "flooding planning accessibility none known yes no restrictions rights easements building safety coastal erosion coalfield mining " +
    "kitchen living room bedroom bedrooms bathroom bathrooms reception receptions garden view book arrange viewing " +
    "your name branch phone add link dear hello hi thanks thank kind regards approval please here there we you our"
  ).split(" "),
);

export function normaliseText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ");
}

/** Numbers present in the inputs: digits, number words and imperial conversions of metric sizes. */
function inputNumbers(haystack: string): Set<string> {
  const nums = new Set<string>();
  for (const m of haystack.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const raw = m[0].replace(/,/g, "");
    nums.add(raw);
    const n = Number(raw);
    if (Number.isFinite(n)) {
      nums.add(String(n));
      // metric → imperial conversions the copy is told to add
      if (n > 0 && n < 100 && /\./.test(raw)) {
        const inches = Math.round(n / 0.0254);
        nums.add(String(Math.floor(inches / 12)));
        nums.add(String(inches % 12));
      }
      if (n >= 1000) nums.add(String(n / 1_000_000));
    }
  }
  for (const w of haystack.split(/[^a-z]+/)) {
    const v = wordsToNumber(w);
    if (v !== null) nums.add(String(v));
  }
  // multi-word prices such as "one point four five million"
  for (const m of haystack.matchAll(/\b(?:[a-z]+ ){1,6}(?:million|thousand)\b/g)) {
    const v = wordsToNumber(
      m[0].replace(/^.*?\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/, "$1"),
    );
    if (v !== null) nums.add(String(v));
  }
  return nums;
}

function numberKnown(term: string, nums: Set<string>): boolean {
  const raw = term.replace(/[£,]/g, "").replace(/(st|nd|rd|th)$/i, "");
  if (nums.has(raw)) return true;
  const n = Number(raw);
  if (Number.isFinite(n) && nums.has(String(n))) return true;
  const w = wordsToNumber(term);
  return w !== null && nums.has(String(w));
}

/** Removes numbered-list markers at the start of a line (^\s*\d+[.):]\s). */
export function stripListMarkers(text: string): string {
  return text.replace(/^(\s*)\d+[.):](?=\s)/gm, "$1");
}

/**
 * Check one block of generated text. `portal` adds the contact-details rule.
 */
export function checkText(
  text: string,
  section: string,
  inputsText: string,
  opts: { portal?: boolean; checkNames?: boolean } = {},
): FactFlag[] {
  if (!text) return [];
  const flags: FactFlag[] = [];
  const hay = normaliseText(inputsText);
  const nums = inputNumbers(hay);
  const seen = new Set<string>();
  const push = (term: string, kind: FlagKind, rule?: FlagRule) => {
    const k = `${kind}:${term.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    flags.push(rule ? { term, kind, section, rule } : { term, kind, section });
  };

  // £ amounts and digits — numbered-list markers ("6. ", "14) ") at the start
  // of a line are formatting, not facts.
  const numberScan = stripListMarkers(text);
  for (const m of numberScan.matchAll(/£?\d[\d,]*(?:\.\d+)?(?:st|nd|rd|th)?/g)) {
    const term = m[0].replace(/[.,]$/, "");
    if (!numberKnown(term, nums)) push(term, "not-in-notes", "number");
  }
  // number words (skip "one", too common in prose)
  for (const m of text.matchAll(new RegExp(`\\b(${NUMBER_WORDS.join("|")})\\b`, "gi"))) {
    if (!numberKnown(m[0].toLowerCase(), nums)) push(m[0], "not-in-notes", "number");
  }
  // storey / floor counts — only allowed when the inputs mention floors or storeys with that number
  for (const m of text.matchAll(STOREY_RE)) {
    const phrase = normaliseText(m[0]);
    if (!hay.includes(phrase)) push(m[0], "not-in-notes", "storey");
  }
  // era words
  for (const m of text.matchAll(ERA_RE)) {
    if (!hay.includes(normaliseText(m[0]))) push(m[0], "not-in-notes", "era");
  }
  // capitalised names not at sentence start
  if (opts.checkNames !== false) {
    const re = /(^|[.!?\n:]\s*|\s)([A-Z][a-zA-Z'’-]+)/g;
    for (const m of text.matchAll(re)) {
      const sentenceStart = m[1] === "" || /[.!?\n:]/.test(m[1]);
      const word = m[2];
      const lower = normaliseText(word).replace(/['’]s$/, "");
      if (sentenceStart) continue;
      if (CAP_STOPWORDS.has(lower) || lower.length < 3) continue;
      if (!hay.includes(lower)) push(word, "not-in-notes", "name");
    }
  }
  // banned phrases
  const lowerText = normaliseText(text);
  for (const p of BANNED_PHRASES) {
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lowerText) && !hay.includes(p)) push(p, "banned");
  }
  if (opts.portal) {
    for (const m of text.matchAll(CONTACT_RE)) push(m[0], "contact");
  }
  return flags;
}

export interface PackLike {
  headline?: string;
  listing?: string;
  summary?: string;
  keyFeatures?: string[];
  emailBlast?: {
    subjectLines?: string[];
    previewText?: string;
    headline?: string;
    body?: string;
  } | null;
  social?: { platform: string; caption: string; hashtags?: string[] }[];
  sellerEmail?: { body?: string } | null;
}

/** Flags across the whole pack, keyed by section. */
export function factCheckPack(pack: PackLike, inputsText: string): FactFlag[] {
  const out: FactFlag[] = [];
  out.push(
    ...checkText(pack.headline ?? "", "headline", inputsText, { portal: true, checkNames: false }),
  );
  out.push(...checkText(pack.listing ?? "", "description", inputsText, { portal: true }));
  out.push(...checkText(pack.summary ?? "", "strapline", inputsText, { portal: true }));
  for (const f of pack.keyFeatures ?? []) {
    out.push(...checkText(f, "keyFeatures", inputsText, { portal: true, checkNames: false }));
  }
  const e = pack.emailBlast;
  if (e) {
    for (const s of e.subjectLines ?? []) {
      out.push(...checkText(s, "email", inputsText, { checkNames: false }));
    }
    out.push(...checkText(e.previewText ?? "", "email", inputsText));
    out.push(...checkText(e.headline ?? "", "email", inputsText, { checkNames: false }));
    out.push(...checkText(e.body ?? "", "email", inputsText));
  }
  for (const p of pack.social ?? []) out.push(...checkText(p.caption, "social", inputsText));
  if (pack.sellerEmail?.body) {
    // Placeholders like [Seller name] are fine; contact details aren't checked here.
    out.push(...checkText(pack.sellerEmail.body, "seller email", inputsText));
  }
  return out;
}

/** All input text as one string for checks. */
export function inputsToText(input: object): string {
  return Object.values(input)
    .filter((v) => typeof v === "string")
    .join(" \n ");
}

/** Keys that are private to the agent and must never appear in public copy. */
export const PRIVATE_INPUT_KEYS = ["showingNotes", "mediaNotes"] as const;

/**
 * Input text the copy may legitimately draw on — everything except the
 * private viewing / photo notes, so a private fact in the copy is flagged.
 */
export function publicInputsToText(input: object): string {
  const r = input as Record<string, unknown>;
  return Object.entries(r)
    .filter(
      ([k, v]) => typeof v === "string" && !(PRIVATE_INPUT_KEYS as readonly string[]).includes(k),
    )
    .map(([, v]) => v as string)
    .join(" \n ");
}

const LEAK_STOPWORDS = new Set(
  (
    "about above after again against all also always and any are around back because been before being below between both but " +
    "can could did does doing down during each few for from further had has have having her here hers him his how into its just " +
    "more most must not now off once only other our out over own same she should some such than that the their them then there " +
    "these they this those through too under until very was were what when where which while who whom why will with would you your " +
    "please note notes viewing viewings photo photos floorplan agent vendor seller property house home flat room rooms "
  ).split(" "),
);

function leakTokens(s: string): string[] {
  return normaliseText(s)
    .replace(/[^a-z0-9£' -]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Distinctive words (≥5 letters, or containing a digit) and 3-word phrases
 * from the private notes that appear in public copy but nowhere in the public
 * inputs. Guidance only.
 */
export function privateLeakFlags(pack: PackLike, input: object): FactFlag[] {
  const r = input as Record<string, unknown>;
  const priv = PRIVATE_INPUT_KEYS.map((k) => (typeof r[k] === "string" ? (r[k] as string) : ""))
    .join(" \n ")
    .trim();
  if (!priv) return [];
  const publicHay = ` ${leakTokens(publicInputsToText(input)).join(" ")} `;
  const toks = leakTokens(priv);
  const terms = new Set<string>();
  for (const t of toks) {
    const bare = t.replace(/^['-]+|['-]+$/g, "");
    if (LEAK_STOPWORDS.has(bare)) continue;
    if ((bare.length >= 5 || /\d/.test(bare)) && !publicHay.includes(` ${bare} `)) terms.add(bare);
  }
  for (let i = 0; i + 2 < toks.length; i++) {
    const tri = toks.slice(i, i + 3);
    if (tri.every((w) => LEAK_STOPWORDS.has(w) || w.length < 3)) continue;
    const phrase = tri.join(" ");
    if (!publicHay.includes(` ${phrase} `)) terms.add(phrase);
  }
  const sections: [string, string][] = [
    ["headline", pack.headline ?? ""],
    ["description", pack.listing ?? ""],
    ["strapline", pack.summary ?? ""],
    ...(pack.keyFeatures ?? []).map((f): [string, string] => ["keyFeatures", f]),
  ];
  const e = pack.emailBlast;
  if (e) {
    for (const s of e.subjectLines ?? []) sections.push(["email", s]);
    sections.push(
      ["email", e.previewText ?? ""],
      ["email", e.headline ?? ""],
      ["email", e.body ?? ""],
    );
  }
  for (const p of pack.social ?? [])
    sections.push(["social", `${p.caption} ${(p.hashtags ?? []).join(" ")}`]);
  const out: FactFlag[] = [];
  const seen = new Set<string>();
  for (const [section, text] of sections) {
    if (!text) continue;
    const hay = ` ${leakTokens(text).join(" ")} `;
    for (const term of terms) {
      if (hay.includes(` ${term} `) && !seen.has(term)) {
        seen.add(term);
        out.push({ term, kind: "private-leak", section });
      }
    }
  }
  return out;
}
