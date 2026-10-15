/**
 * Deterministic post-processing and retry triggers for generated copy.
 * Pure module (relative imports only) so the app and the eval harness share it.
 * - Image labels: appended by the app from the private photo notes, never by the model.
 * - Banned phrases / missing "Please note:" sentence: trigger one merged retry.
 */
import { BANNED_PHRASES } from "./prompts/banned";
import type { CoreOutput, ListingInput, MarketingOutput, SocialPost } from "./listing-types";

/** Fixed label wording, one per trigger. */
export const IMAGE_LABEL_RULES: [RegExp, string][] = [
  [
    /virtual(ly)?[- ]?stag/i,
    "Some images have been virtually staged to show how rooms could be furnished.",
  ],
  [/\bCGI\b|computer[- ]generated/i, "Images are computer-generated (CGI) and indicative only."],
  [/show ?home/i, "Images show the show home; specification may differ."],
  [/digitally (enhanced|altered)/i, "Some images have been digitally enhanced."],
];
export const IMAGE_LABELS = IMAGE_LABEL_RULES.map(([, l]) => l);

/** Labels triggered by the photo notes, in fixed order. */
export function imageLabelsFor(mediaNotes: string | undefined): string[] {
  const m = mediaNotes ?? "";
  return IMAGE_LABEL_RULES.filter(([re]) => re.test(m)).map(([, l]) => l);
}

/** Append missing labels as the final line(s). */
export function appendLabels(text: string, labels: string[]): string {
  const missing = labels.filter((l) => !text.includes(l));
  if (!missing.length) return text;
  return `${text.replace(/\s+$/, "")}\n\n${missing.join("\n")}`;
}

function xLen(p: SocialPost): number {
  const tags = p.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return `${p.caption}${tags ? `\n\n${tags}` : ""}`.length;
}

/** Label every caption; on X drop trailing hashtags until caption+tags ≤ 280. */
export function labelSocial(posts: SocialPost[], labels: string[]): SocialPost[] {
  if (!labels.length) return posts;
  return posts.map((p) => {
    const next: SocialPost = {
      ...p,
      caption: appendLabels(p.caption, labels),
      hashtags: [...p.hashtags],
    };
    if (p.platform === "X") while (next.hashtags.length && xLen(next) > 280) next.hashtags.pop();
    return next;
  });
}

export function labelCore(out: CoreOutput, input: ListingInput): CoreOutput {
  const labels = imageLabelsFor(input.mediaNotes);
  return labels.length ? { ...out, listing: appendLabels(out.listing, labels) } : out;
}

export function labelMarketing(out: MarketingOutput, input: ListingInput): MarketingOutput {
  const labels = imageLabelsFor(input.mediaNotes);
  const social = withSaleMethodLine(normaliseCaptions(out.social), input);
  // Always run labelSocialFor: it also applies the X ≤ 280 fallback.
  return { ...out, social: labelSocialFor(social, labels, input) };
}

/** "For sale by …. " opener for auction / MMoA sales; null for private treaty. */
export function saleMethodLine(input: Pick<ListingInput, "saleMethod">): string | null {
  const m = (input as { saleMethod?: string }).saleMethod ?? "";
  if (!/auction/i.test(m)) return null;
  return /modern/i.test(m)
    ? "For sale by Modern Method of Auction. "
    : "For sale by traditional auction. ";
}

/** Prepend the sale-method line to captions that lack "For sale by …". */
export function withSaleMethodLine(posts: SocialPost[], input: ListingInput): SocialPost[] {
  const line = saleMethodLine(input);
  if (!line) return posts;
  return posts.map((p) =>
    /for sale by/i.test(p.caption) ? p : { ...p, caption: `${line}${p.caption.trimStart()}` },
  );
}

// ---------------------------------------------------------------------------
// Deterministic banned-phrase swaps (no retry needed for these)
// ---------------------------------------------------------------------------

const SWAPS: [RegExp, string][] = [
  [/\bbenefits from\b/gi, "has"],
  [/\bbenefit from\b/gi, "have"],
  [/\bboasts\b/gi, "has"],
  [/\bboast\b/gi, "have"],
];

/** Swap the four verb-only banned phrases, keeping a capital at sentence start. */
export function swapSoftBanned(text: string): string {
  let t = text;
  for (const [re, rep] of SWAPS)
    t = t.replace(re, (m) => (/^[A-Z]/.test(m) ? rep[0].toUpperCase() + rep.slice(1) : rep));
  return t;
}

export function swapCore(o: CoreOutput): CoreOutput {
  return {
    ...o,
    headline: swapSoftBanned(o.headline),
    listing: swapSoftBanned(o.listing),
    summary: swapSoftBanned(o.summary),
    keyFeatures: o.keyFeatures.map(swapSoftBanned),
  };
}

export function swapMarketing(o: MarketingOutput): MarketingOutput {
  const e = o.emailBlast;
  return {
    ...o,
    emailBlast: e
      ? {
          ...e,
          subjectLines: e.subjectLines.map(swapSoftBanned),
          previewText: swapSoftBanned(e.previewText),
          headline: swapSoftBanned(e.headline),
          body: swapSoftBanned(e.body),
          ...(e.personalMessage !== undefined
            ? { personalMessage: swapSoftBanned(e.personalMessage) }
            : {}),
        }
      : e,
    sellerEmail: o.sellerEmail
      ? { ...o.sellerEmail, body: swapSoftBanned(o.sellerEmail.body) }
      : o.sellerEmail,
    social: o.social.map((p) => ({ ...p, caption: swapSoftBanned(p.caption) })),
  };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Banned phrases in `texts` that aren't in the supplied inputs (same rule as the fact check). */
export function bannedIn(texts: string[], inputsText: string): string[] {
  const hay = norm(inputsText);
  const t = norm(texts.join("\n"));
  return BANNED_PHRASES.filter(
    (p) => !hay.includes(p) && new RegExp(`\\b${esc(p)}\\b`, "i").test(t),
  );
}

export const coreTexts = (o: CoreOutput) => [o.headline, o.listing, o.summary, ...o.keyFeatures];
export const marketingTexts = (o: MarketingOutput) => [
  ...(o.emailBlast
    ? [
        ...o.emailBlast.subjectLines,
        o.emailBlast.previewText,
        o.emailBlast.headline,
        o.emailBlast.body,
        o.emailBlast.personalMessage ?? "",
      ]
    : []),
  ...o.social.flatMap((p) => [p.caption, p.hashtags.join(" ")]),
];

const PART_C = [
  "buildingSafety",
  "restrictions",
  "rightsEasements",
  "flooding",
  "coastalErosion",
  "planning",
  "accessibility",
  "coalfieldMining",
] as const;

export function hasKnownIssues(input: ListingInput): boolean {
  const r = input as unknown as Record<string, string | undefined>;
  return !!input.disclosures?.trim() || PART_C.some((k) => /^yes/i.test((r[k] ?? "").trim()));
}

/** Where a "Please note:" sentence is required but missing. */
export function missingPleaseNote(out: MarketingOutput, input: ListingInput): string[] {
  if (!hasKnownIssues(input)) return [];
  const miss: string[] = [];
  if (out.emailBlast && !/please note:/i.test(out.emailBlast.body))
    miss.push("the Email Blast body");
  for (const p of out.social)
    if (
      (p.platform === "Instagram" || p.platform === "Facebook") &&
      !/please note:/i.test(p.caption)
    )
      miss.push(`the ${p.platform} caption`);
  return miss;
}

export function bannedReminder(phrases: string[]): string {
  return `\n\nIMPORTANT: Your previous answer used banned phrases: ${phrases.map((p) => `"${p}"`).join(", ")}. Rewrite without them.`;
}

export function pleaseNoteReminder(where: string[]): string {
  return `\n\nIMPORTANT: there are known issues or Part C items answered Yes, but ${where.join(", ")} had no "Please note:" sentence. Add one sentence starting "Please note:" that states them plainly.`;
}

// ---------------------------------------------------------------------------
// X budget, inline hashtags, preview trim
// ---------------------------------------------------------------------------

/** Characters the appended labels take on a caption ("\n\n" + lines). */
export function labelsLength(labels: string[]): number {
  return labels.length ? labels.join("\n").length + 2 : 0;
}

/** Max X caption + hashtags the model may write when labels will be appended. */
export function xBudget(labels: string[]): number {
  return 280 - labelsLength(labels);
}

/** {{IMAGE_LABELS}} for the marketing template ("" when no label applies). */
export function renderImageLabelsLine(mediaNotes: string | undefined): string {
  const labels = imageLabelsFor(mediaNotes);
  if (!labels.length) return "";
  return `\nIMAGE LABELS — the app adds these exact lines to the end of every caption after you answer; don't write them yourself: ${labels.map((l) => `"${l}"`).join(" ")}. So your X caption plus hashtags must be at most ${xBudget(labels)} characters.\n`;
}

const TRAILING_TAGS = /(?:\s*#[\p{L}\p{N}_]+)+\s*$/u;

/** Move trailing inline hashtags from captions into the hashtags array (deduped, case-insensitive). */
export function normaliseCaptions(posts: SocialPost[]): SocialPost[] {
  return posts.map((p) => {
    const tags = p.hashtags.map((h) => h.replace(/^#/, ""));
    const m = p.caption.match(TRAILING_TAGS);
    if (!m) return { ...p, hashtags: tags };
    const inline = [...m[0].matchAll(/#([\p{L}\p{N}_]+)/gu)].map((x) => x[1]);
    const seen = new Set(tags.map((t) => t.toLowerCase()));
    for (const t of inline)
      if (!seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        tags.push(t);
      }
    return { ...p, caption: p.caption.slice(0, m.index).replace(/\s+$/, ""), hashtags: tags };
  });
}

/** True when the model's X post (before labels) exceeds the label-aware budget. */
export function xOverBudget(posts: SocialPost[], labels: string[]): boolean {
  const x = posts.find((p) => p.platform === "X");
  return !!x && xLen(x) > xBudget(labels);
}

/** Terms that make a caption sentence undroppable. */
export function protectedTerms(input: ListingInput): string[] {
  const r = input as unknown as Record<string, string | undefined>;
  const terms = ["please note", "under offer", "full material information", "epc"];
  const amt = (input.price ?? "").replace(/[^\d]/g, "");
  if (amt) terms.push(`£${Number(amt).toLocaleString("en-GB")}`.toLowerCase());
  if (input.tenure?.trim()) terms.push(input.tenure.trim().toLowerCase());
  if (r.saleMethod?.trim() && !/private/i.test(r.saleMethod))
    terms.push(r.saleMethod.trim().toLowerCase(), "auction");
  return terms;
}

/** Drop whole non-protected sentences (latest first) until `fits`. */
function dropSentences(body: string, protect: string[], fits: (b: string) => boolean): string {
  const parts = body.match(/[^.!?\n]+(?:[.!?]+|$)\s*|\n+/g) ?? [body];
  for (let i = parts.length - 1; i >= 0 && !fits(parts.join("").trim()); i--) {
    const s = parts[i].toLowerCase();
    if (!s.trim() || protect.some((t) => s.includes(t))) continue;
    parts.splice(i, 1);
  }
  return parts
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Label every caption; X: drop hashtags, then whole droppable sentences, to stay ≤ 280. */
export function labelSocialFor(
  posts: SocialPost[],
  labels: string[],
  input?: ListingInput,
): SocialPost[] {
  const protect = input ? protectedTerms(input) : ["please note", "epc"];
  return posts.map((p) => {
    const next: SocialPost = {
      ...p,
      caption: appendLabels(p.caption, labels),
      hashtags: [...p.hashtags],
    };
    if (p.platform !== "X") return next;
    while (next.hashtags.length && xLen(next) > 280) next.hashtags.pop();
    if (xLen(next) > 280) {
      const body = p.caption;
      const tail = labels.filter((l) => !body.includes(l));
      const extra = labelsLength(tail);
      const trimmed = dropSentences(body, protect, (b) => b.length + extra <= 280);
      next.caption = appendLabels(trimmed, labels);
    }
    return next;
  });
}

/** Trim preview text to `max` at the last separator, else the last word boundary. No ellipsis. */
export function trimPreview(s: string, max = 90): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max + 1);
  let cut = -1;
  for (const sep of [" · ", " | ", ", ", " – "]) {
    const i = head.lastIndexOf(sep);
    if (i > 0 && i <= max && i > cut) cut = i;
  }
  let out = cut > 0 ? t.slice(0, cut) : t.slice(0, Math.max(t.lastIndexOf(" ", max), 1));
  out = out.replace(/[\s·|,–-]+$/, "");
  return out;
}

// ---------------------------------------------------------------------------
// Price qualifier
// ---------------------------------------------------------------------------

const QUALIFIERS: [RegExp, string][] = [
  [/offers in excess of|\boieo\b|\boie\b/i, "oieo"],
  [/offers in the region of|\boiro\b/i, "oiro"],
  [/offers over/i, "over"],
  [/guide price|\bguide\b/i, "guide"],
  [/fixed price/i, "fixed"],
  [/\bfrom\b/i, "from"],
];
const QUAL_ANY =
  /offers in excess of|offers in the region of|offers over|guide price|fixed price|\boieo\b|\boiro\b|\boie\b|\bguide\b|\bfrom\b/gi;

function canonical(q: string | undefined): string | null {
  if (!q?.trim()) return null;
  return QUALIFIERS.find(([re]) => re.test(q))?.[1] ?? null;
}

export interface PriceProblem {
  where: string;
  /** What was written; empty when the exact form is missing. */
  wrote: string;
  missing?: boolean;
}

/** Texts that must contain "<qualifier> <amount>" at least once. */
export const EXACT_PRICE_REQUIRED = ["the description", "the Email Blast body"];

/** Exact "<qualifier>[:] <amount>" form, case-insensitive, whitespace collapsed. */
export function hasExactPrice(
  text: string,
  input: Pick<ListingInput, "price" | "priceQualifier">,
): boolean {
  const digits = (input.price ?? "").replace(/[^\d]/g, "");
  if (!digits) return true;
  const amt = `£${Number(digits).toLocaleString("en-GB")}`;
  const q = (input.priceQualifier ?? "").trim().replace(/\s+/g, " ");
  const e = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  const re = new RegExp(`${q ? `${e(q)}\\s*:?\\s*` : ""}${e(amt)}(?!,?\\d)`, "i");
  return re.test(text.replace(/\s+/g, " "));
}

/** Places where a different qualifier sits directly before the supplied amount. */
export function priceQualifierProblems(
  texts: [string, string][],
  input: Pick<ListingInput, "price" | "priceQualifier">,
): PriceProblem[] {
  const digits = (input.price ?? "").replace(/[^\d]/g, "");
  if (!digits) return [];
  const n = Number(digits);
  const forms = [`£${n.toLocaleString("en-GB")}`];
  if (n % 1000 === 0) forms.push(`£${n / 1000}k`);
  const amountRe = new RegExp(
    `(${forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?!,?\\d)`,
    "gi",
  );
  const want = canonical(input.priceQualifier);
  const out: PriceProblem[] = [];
  for (const [where, text] of texts) {
    for (const m of text.matchAll(amountRe)) {
      const i = m.index ?? 0;
      const win = text.slice(Math.max(0, i - 25), i);
      const quals = [...win.matchAll(QUAL_ANY)];
      const last = quals[quals.length - 1];
      if (!last) continue;
      const got = canonical(last[0]);
      if (got && got !== want)
        out.push({ where, wrote: `${last[0]} ${m[0]}`.replace(/\s+/g, " ") });
    }
  }
  // A missing exact "<qualifier> <amount>" form is NOT a retry trigger (it fixed
  // nothing and doubled latency); the eval grader reports it as a warning.
  return out;
}

export function priceReminder(
  probs: PriceProblem[],
  input: Pick<ListingInput, "price" | "priceQualifier">,
): string {
  const n = Number((input.price ?? "").replace(/[^\d]/g, ""));
  const exact = `${input.priceQualifier?.trim() ? `${input.priceQualifier.trim()} ` : ""}£${n.toLocaleString("en-GB")}`;
  const swapped = probs.filter((p) => !p.missing);
  const missing = probs.filter((p) => p.missing).map((p) => p.where);
  const parts: string[] = [];
  if (swapped.length)
    parts.push(
      `you wrote ${swapped.map((p) => `'${p.wrote}' in ${p.where}`).join(", ")}. Never change or swap the qualifier`,
    );
  if (missing.length)
    parts.push(
      `${missing.join(" and ")} must state it at least once in exactly this form: '${exact}' (in the description's final paragraph and in paragraph 1 of the Email Blast body)`,
    );
  return `\n\nIMPORTANT: The price must read exactly '${exact}' — ${parts.join("; ")}.`;
}

export const coreTextsLabelled = (o: CoreOutput): [string, string][] => [
  ["the headline", o.headline],
  ["the description", o.listing],
  ["the strapline", o.summary],
  ...o.keyFeatures.map((f): [string, string] => ["a key feature", f]),
];
export const marketingTextsLabelled = (o: MarketingOutput): [string, string][] => [
  ...(o.emailBlast
    ? ([
        ...o.emailBlast.subjectLines.map((s): [string, string] => ["a subject line", s]),
        ["the Email Blast body", o.emailBlast.body],
        ["the personal message", o.emailBlast.personalMessage ?? ""],
      ] as [string, string][])
    : []),
  ["the seller email", o.sellerEmail?.body ?? ""],
  ...o.social.map((p): [string, string] => [`the ${p.platform} caption`, p.caption]),
];

// ---------------------------------------------------------------------------
// Seller email + personal message
// ---------------------------------------------------------------------------

const wc = (s: string) => (s.match(/\S+/g) ?? []).length;

/** Prose = lines that aren't numbered/bulleted and don't end with "?". */
export function sellerEmailShape(body: string): { proseWords: number; longLines: string[] } {
  let prose = 0;
  const longLines: string[] = [];
  for (const line of body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)) {
    const numbered = /^(\d+[.)]|[-•*])\s/.test(line);
    if (numbered) {
      if (wc(line) > 35) longLines.push(line);
    } else if (!line.endsWith("?")) prose += wc(line);
  }
  return { proseWords: prose, longLines };
}

export const personalMessageWords = (o: MarketingOutput) => wc(o.emailBlast?.personalMessage ?? "");

export function marketingShapeProblems(o: MarketingOutput): string[] {
  const p: string[] = [];
  if (o.sellerEmail && sellerEmailShape(o.sellerEmail.body).proseWords > 120)
    p.push("seller-prose");
  const n = personalMessageWords(o);
  if (o.emailBlast && (n < 30 || n > 100)) p.push("personal-message");
  return p;
}

export function shapeReminder(probs: string[]): string {
  const parts: string[] = [];
  if (probs.includes("seller-prose"))
    parts.push(
      "the seller email's greeting, opening and sign-off must be under 100 words in total (the numbered lines don't count)",
    );
  if (probs.includes("personal-message")) parts.push('"personalMessage" must be 40–80 words');
  return parts.length ? `\n\nIMPORTANT: ${parts.join("; ")}.` : "";
}
