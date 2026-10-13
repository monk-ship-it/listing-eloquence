/**
 * Deterministic fact check of generated copy against the agent's inputs.
 * Flags numbers, £ amounts, measurements, storey/floor counts, era words and
 * capitalised names that don't appear anywhere in the inputs, plus banned
 * phrases and contact details in portal copy. Guidance only.
 */
import { wordsToNumber } from "./dictation-normalise";

export type FlagKind = "not-in-notes" | "banned" | "contact";

export interface FactFlag {
  term: string;
  kind: FlagKind;
  section: string;
}

export const BANNED_PHRASES = [
  "the kind of",
  "nestled",
  "boasts",
  "must be viewed",
  "book your viewing today",
  "stunning",
  "charming",
  "rare opportunity",
  "dream home",
  "perfect for",
  "ideal for",
  "deceptively spacious",
  "viewing highly recommended",
  "early viewing advised",
  "sought-after",
  "sought after",
  "hidden gem",
  "forever home",
  "a stone's throw",
  "close to all amenities",
  "within easy reach",
  "benefits from",
  "wealth of",
  "abundance of",
  "bursting with",
  "immaculate",
  "superb",
  "fabulous",
  "delightful",
  "exceptional",
  "unique",
  "one of a kind",
  "rarely available",
  "prestigious",
  "executive",
  "luxury",
  "luxurious",
  "tlc",
  "investment opportunity",
  "won't last",
  "act fast",
  "priced to sell",
  "realistically priced",
];

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
  const push = (term: string, kind: FlagKind) => {
    const k = `${kind}:${term.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    flags.push({ term, kind, section });
  };

  // £ amounts and digits
  for (const m of text.matchAll(/£?\d[\d,]*(?:\.\d+)?(?:st|nd|rd|th)?/g)) {
    const term = m[0].replace(/[.,]$/, "");
    if (!numberKnown(term, nums)) push(term, "not-in-notes");
  }
  // number words (skip "one", too common in prose)
  for (const m of text.matchAll(new RegExp(`\\b(${NUMBER_WORDS.join("|")})\\b`, "gi"))) {
    if (!numberKnown(m[0].toLowerCase(), nums)) push(m[0], "not-in-notes");
  }
  // storey / floor counts — only allowed when the inputs mention floors or storeys with that number
  for (const m of text.matchAll(STOREY_RE)) {
    const phrase = normaliseText(m[0]);
    if (!hay.includes(phrase)) push(m[0], "not-in-notes");
  }
  // era words
  for (const m of text.matchAll(ERA_RE)) {
    if (!hay.includes(normaliseText(m[0]))) push(m[0], "not-in-notes");
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
      if (!hay.includes(lower)) push(word, "not-in-notes");
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
  social?: { platform: string; caption: string }[];
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
  return out;
}

/** All input text as one string for checks. */
export function inputsToText(input: object): string {
  return Object.values(input)
    .filter((v) => typeof v === "string")
    .join(" \n ");
}
