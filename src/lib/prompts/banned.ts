/**
 * The ONE banned-phrase list. Rendered into the master system prompt and used
 * by the deterministic fact check, so the two can never diverge.
 *
 * - `alt`: rendered in the prompt as `"a"/"b"` and checked.
 * - `variants`: checked only (spelling variants the prompt doesn't spell out).
 * - `note`: rendered in brackets after the phrase in the prompt.
 */
export interface BannedEntry {
  phrase: string;
  alt?: string[];
  variants?: string[];
  note?: string;
}

export const BANNED_ENTRIES: BannedEntry[] = [
  { phrase: "the kind of" },
  { phrase: "nestled" },
  { phrase: "boasts" },
  { phrase: "must be viewed" },
  { phrase: "book your viewing today" },
  { phrase: "stunning" },
  { phrase: "charming" },
  { phrase: "rare opportunity" },
  { phrase: "dream home" },
  { phrase: "perfect for" },
  { phrase: "ideal for" },
  { phrase: "deceptively spacious" },
  { phrase: "viewing highly recommended" },
  { phrase: "early viewing advised" },
  { phrase: "sought-after" },
  { phrase: "sought after" },
  { phrase: "hidden gem" },
  { phrase: "forever home" },
  { phrase: "a stone's throw" },
  { phrase: "close to all amenities" },
  { phrase: "within easy reach" },
  { phrase: "benefits from" },
  { phrase: "wealth of" },
  { phrase: "abundance of" },
  { phrase: "bursting with" },
  { phrase: "immaculate" },
  { phrase: "superb" },
  { phrase: "fabulous" },
  { phrase: "delightful" },
  { phrase: "exceptional" },
  { phrase: "unique" },
  { phrase: "one of a kind" },
  { phrase: "rarely available" },
  { phrase: "prestigious" },
  { phrase: "executive" },
  { phrase: "luxury", alt: ["luxurious"], note: "unless part of a supplied specification" },
  { phrase: "TLC" },
  { phrase: "investment opportunity" },
  { phrase: "won't last" },
  { phrase: "act fast" },
  { phrase: "priced to sell" },
  { phrase: "realistically priced" },
  { phrase: "beautifully presented" },
  { phrase: "chocolate-box" },
  { phrase: "picture-postcard" },
  { phrase: "breathtaking" },
  { phrase: "exclusive" },
];

/** Lower-case phrases checked in generated copy (includes alt + variants). */
export const BANNED_PHRASES: string[] = BANNED_ENTRIES.flatMap((e) => [
  e.phrase,
  ...(e.alt ?? []),
  ...(e.variants ?? []),
]).map((p) => p.toLowerCase());

/** Prompt rendering, e.g. `"stunning", "luxury"/"luxurious" (unless …), …`. */
export function renderBannedList(): string {
  return BANNED_ENTRIES.map((e) => {
    const quoted = [e.phrase, ...(e.alt ?? [])].map((p) => `"${p}"`).join("/");
    return e.note ? `${quoted} (${e.note})` : quoted;
  }).join(", ");
}
