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
    const next: SocialPost = { ...p, caption: appendLabels(p.caption, labels), hashtags: [...p.hashtags] };
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
  return labels.length ? { ...out, social: labelSocial(out.social, labels) } : out;
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
  if (out.emailBlast && !/please note:/i.test(out.emailBlast.body)) miss.push("the Email Blast body");
  for (const p of out.social)
    if ((p.platform === "Instagram" || p.platform === "Facebook") && !/please note:/i.test(p.caption))
      miss.push(`the ${p.platform} caption`);
  return miss;
}

export function bannedReminder(phrases: string[]): string {
  return `\n\nIMPORTANT: Your previous answer used banned phrases: ${phrases.map((p) => `"${p}"`).join(", ")}. Rewrite without them.`;
}

export function pleaseNoteReminder(where: string[]): string {
  return `\n\nIMPORTANT: there are known issues or Part C items answered Yes, but ${where.join(", ")} had no "Please note:" sentence. Add one sentence starting "Please note:" that states them plainly.`;
}
