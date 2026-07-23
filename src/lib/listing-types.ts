import type { VoiceId } from "./voices";
import type { MarketId } from "./config";

export interface ListingInput {
  /** Target market — controls language, vocabulary and compliance. */
  market: MarketId;
  voice: VoiceId;
  voiceNotes: string;
  address: string;
  areaHighlights: string;
  propertyType: string;
  tenure: string;
  leaseYears: string;
  price: string;
  priceQualifier: string;
  bedrooms: string;
  bathrooms: string;
  receptions: string;
  keyFeatures: string;
  dimensions: string;
  epc: string;
  councilTaxBand: string;
  outsideSpace: string;
  parking: string;
  heating: string;
  utilities: string;
  nearby: string;
  periodFeatures: string;
  targetAudience: string;
  /** Year the property was built (US MLS core fact). */
  yearBuilt: string;
  /** Disclosures / condition notes — only surfaced factually when provided. */
  disclosures: string;
  /** Showing / access notes — private-only; never surfaced in generated public copy. */
  showingNotes: string;
  /** Media / photo / floor-plan notes. */
  mediaNotes: string;
}

export interface SocialPost {
  platform: string;
  caption: string;
  hashtags: string[];
}

/**
 * Structured Email Blast copy — plain-text campaign copy an agent can paste
 * into Mailchimp, Outlook, or their CRM. Quill never sends emails, manages
 * contacts, or invents personal / contact / URL / date details.
 */
export interface EmailBlast {
  /** Exactly 3 unique subject-line options. */
  subjectLines: string[];
  /** Short preheader / preview text. */
  previewText: string;
  /** Campaign headline (short). */
  headline: string;
  /** Plain-text email body, 2–4 short paragraphs. */
  body: string;
  /** Short CTA label e.g. "View property details" / "Arrange a viewing". */
  callToAction: string;
}

export interface ListingOutput {
  headline: string;
  listing: string;
  summary: string;
  /** Portal/MLS-style bullet points generated strictly from supplied facts. */
  keyFeatures: string[];
  /** Structured email campaign copy. Null on legacy saved rows only. */
  emailBlast: EmailBlast | null;
  social: SocialPost[];
}

// Sensible per-field length caps for the Email Blast.
const EMAIL_SUBJECT_MAX = 90;
const EMAIL_PREVIEW_MAX = 160;
const EMAIL_HEADLINE_MAX = 140;
const EMAIL_BODY_MAX = 3000;
const EMAIL_CTA_MAX = 60;

/**
 * Editable placeholders appended to the copied/rendered Email Blast. Quill
 * never invents agent contact info, property URLs, availability or dates —
 * these lines are surfaced verbatim so the user fills them in before sending.
 */
export const EMAIL_BLAST_PLACEHOLDERS = [
  "Property link: [Add property URL]",
  "Agent contact: [Add name, phone and email]",
  "Sending note: Add the sender details and unsubscribe controls required by your email platform.",
] as const;

/**
 * Tolerant normaliser — used for LEGACY saved rows and best-effort parsing.
 * Never throws on missing keyFeatures/social; older DB rows may lack those.
 * Strips leading bullet chars and trailing terminal punctuation from
 * feature phrases and deduplicates hashtags case-insensitively.
 */
export function normaliseListingOutput(raw: unknown): ListingOutput {
  if (!raw || typeof raw !== "object") throw new Error("MALFORMED_AI_OUTPUT");
  const r = raw as Record<string, unknown>;
  const headline = typeof r.headline === "string" ? r.headline.trim() : "";
  const listing = typeof r.listing === "string" ? r.listing.trim() : "";
  const summary = typeof r.summary === "string" ? r.summary.trim() : "";
  if (!headline || !listing) throw new Error("MALFORMED_AI_OUTPUT");

  const rawFeatures = Array.isArray(r.keyFeatures) ? r.keyFeatures : [];
  const seenF = new Set<string>();
  const keyFeatures = rawFeatures
    .map((f) =>
      typeof f === "string"
        ? f
            .trim()
            .replace(/^[-•*·\s]+/, "")
            .replace(/[.!?;,]+$/g, "")
            .trim()
        : "",
    )
    .filter((f) => f.length > 0 && f.length <= 240)
    .filter((f) => {
      const k = f.toLowerCase();
      if (seenF.has(k)) return false;
      seenF.add(k);
      return true;
    })
    .slice(0, 10);

  const rawSocial = Array.isArray(r.social) ? r.social : [];
  const social: SocialPost[] = rawSocial
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const post = p as Record<string, unknown>;
      const platform = typeof post.platform === "string" ? post.platform.trim() : "";
      const caption = typeof post.caption === "string" ? post.caption.trim() : "";
      const seenH = new Set<string>();
      const hashtags = Array.isArray(post.hashtags)
        ? (post.hashtags as unknown[])
            .map((h) => (typeof h === "string" ? h.replace(/^#/, "").trim() : ""))
            .filter((h) => h.length > 0 && h.length <= 60)
            .filter((h) => {
              const k = h.toLowerCase();
              if (seenH.has(k)) return false;
              seenH.add(k);
              return true;
            })
            .slice(0, 20)
        : [];
      if (!platform || !caption) return null;
      return { platform, caption, hashtags } as SocialPost;
    })
    .filter((p): p is SocialPost => p !== null);

  const emailBlast = coerceLegacyEmailBlast(r.emailBlast);
  return { headline, listing, summary, keyFeatures, emailBlast, social };
}

/**
 * Tolerant email-blast coercion for legacy rows or partial payloads. Never
 * throws. Returns null when the payload is missing or unusable.
 */
export function coerceLegacyEmailBlast(raw: unknown): EmailBlast | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const rawSubjects = Array.isArray(e.subjectLines) ? (e.subjectLines as unknown[]) : [];
  const seenS = new Set<string>();
  const subjectLines = rawSubjects
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)
    .filter((s) => {
      const k = s.toLowerCase();
      if (seenS.has(k)) return false;
      seenS.add(k);
      return true;
    });
  const previewText = typeof e.previewText === "string" ? e.previewText.trim() : "";
  const headline = typeof e.headline === "string" ? e.headline.trim() : "";
  const body = typeof e.body === "string" ? e.body.trim() : "";
  const callToAction = typeof e.callToAction === "string" ? e.callToAction.trim() : "";
  if (
    subjectLines.length === 0 &&
    !previewText &&
    !headline &&
    !body &&
    !callToAction
  ) {
    return null;
  }
  return { subjectLines, previewText, headline, body, callToAction };
}

/**
 * Canonical platform labels emitted by strict validation.
 * Order here IS the order returned to callers.
 */
const CANONICAL_PLATFORMS = ["Instagram", "Facebook", "X"] as const;
type CanonicalPlatform = (typeof CANONICAL_PLATFORMS)[number];

/**
 * Map a raw platform string from the model to a canonical platform.
 * Accepts common aliases (IG/Instagram, FB/Facebook, X/Twitter/Twitter-X in
 * either order/case). Returns null for anything unrecognised — the caller
 * treats unexpected platforms as invalid rather than silently dropping them.
 */
function canonicalisePlatform(raw: string): CanonicalPlatform | null {
  const k = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (k === "instagram" || k === "ig" || k === "insta") return "Instagram";
  if (k === "facebook" || k === "fb" || k === "meta") return "Facebook";
  if (
    k === "x" ||
    k === "twitter" ||
    k === "x (twitter)" ||
    k === "twitter (x)" ||
    k === "x/twitter" ||
    k === "twitter/x" ||
    k === "twitter-x" ||
    k === "x-twitter"
  ) {
    return "X";
  }
  return null;
}

/**
 * Strict validator for NEW AI responses. Enforces the raw shape BEFORE tolerant
 * normalisation would silently trim/dedupe/slice, so a model response with
 * e.g. 11 keyFeatures or an extra social entry is rejected rather than being
 * quietly reduced. Requires 6–10 unique cleaned Key Features and exactly
 * three social posts — one each for Instagram, Facebook and X — with
 * canonical platform labels in that order.
 */
export function validateNewListingOutput(raw: unknown): ListingOutput {
  if (!raw || typeof raw !== "object") throw new Error("MALFORMED_AI_OUTPUT");
  const r = raw as Record<string, unknown>;

  // Strict raw keyFeatures shape check — count, type, cleaned length, uniqueness.
  if (!Array.isArray(r.keyFeatures)) throw new Error("MALFORMED_AI_OUTPUT");
  if (r.keyFeatures.length < 6 || r.keyFeatures.length > 10) {
    throw new Error("MALFORMED_AI_OUTPUT");
  }
  const seenFeatures = new Set<string>();
  for (const f of r.keyFeatures) {
    if (typeof f !== "string") throw new Error("MALFORMED_AI_OUTPUT");
    const cleaned = f
      .trim()
      .replace(/^[-•*·\s]+/, "")
      .replace(/[.!?;,]+$/g, "")
      .trim();
    if (!cleaned || cleaned.length > 240) throw new Error("MALFORMED_AI_OUTPUT");
    const key = cleaned.toLowerCase();
    if (seenFeatures.has(key)) throw new Error("MALFORMED_AI_OUTPUT");
    seenFeatures.add(key);
  }

  // Strict raw social shape check — exactly 3 entries, each a well-formed object.
  if (!Array.isArray(r.social) || r.social.length !== 3) {
    throw new Error("MALFORMED_AI_OUTPUT");
  }
  for (const p of r.social) {
    if (!p || typeof p !== "object") throw new Error("MALFORMED_AI_OUTPUT");
    const post = p as Record<string, unknown>;
    if (typeof post.platform !== "string" || !post.platform.trim()) {
      throw new Error("MALFORMED_AI_OUTPUT");
    }
    if (typeof post.caption !== "string" || !post.caption.trim()) {
      throw new Error("MALFORMED_AI_OUTPUT");
    }
  }

  // Tolerant normalisation now safe: raw shape already validated.
  const out = normaliseListingOutput(raw);
  if (!out.summary) throw new Error("MALFORMED_AI_OUTPUT");
  if (out.keyFeatures.length < 6 || out.keyFeatures.length > 10) {
    throw new Error("MALFORMED_AI_OUTPUT");
  }

  const byPlatform = new Map<CanonicalPlatform, SocialPost>();
  for (const p of out.social) {
    const canonical = canonicalisePlatform(p.platform);
    if (!canonical) throw new Error("MALFORMED_AI_OUTPUT"); // unexpected platform
    if (byPlatform.has(canonical)) throw new Error("MALFORMED_AI_OUTPUT"); // duplicate
    if (!p.caption) throw new Error("MALFORMED_AI_OUTPUT");
    byPlatform.set(canonical, { ...p, platform: canonical });
  }
  if (byPlatform.size !== 3) throw new Error("MALFORMED_AI_OUTPUT");
  const ordered: SocialPost[] = [];
  for (const platform of CANONICAL_PLATFORMS) {
    const post = byPlatform.get(platform);
    if (!post) throw new Error("MALFORMED_AI_OUTPUT");
    ordered.push(post);
  }

  return { ...out, social: ordered };
}

/**
 * Safely coerce a value read from a legacy DB row into a full ListingOutput
 * shape without throwing, defaulting missing arrays. Does not rewrite the row.
 */
export function coerceLegacyOutput(raw: unknown): ListingOutput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawSocial = Array.isArray(r.social) ? (r.social as unknown[]) : [];
  const social: SocialPost[] = rawSocial
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const post = p as Record<string, unknown>;
      const platform = typeof post.platform === "string" ? post.platform : "";
      const caption = typeof post.caption === "string" ? post.caption : "";
      const hashtags = Array.isArray(post.hashtags)
        ? (post.hashtags as unknown[]).filter((h): h is string => typeof h === "string")
        : [];
      if (!platform || !caption) return null;
      return { platform, caption, hashtags };
    })
    .filter((p): p is SocialPost => p !== null);
  return {
    headline: typeof r.headline === "string" ? r.headline : "",
    listing: typeof r.listing === "string" ? r.listing : "",
    summary: typeof r.summary === "string" ? r.summary : "",
    keyFeatures: Array.isArray(r.keyFeatures)
      ? (r.keyFeatures as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    social,
  };
}

export const EMPTY_INPUT: ListingInput = {
  market: "uk",
  voice: "professional",
  voiceNotes: "",
  address: "",
  areaHighlights: "",
  propertyType: "",
  tenure: "",
  leaseYears: "",
  price: "",
  priceQualifier: "",
  bedrooms: "",
  bathrooms: "",
  receptions: "",
  keyFeatures: "",
  dimensions: "",
  epc: "",
  councilTaxBand: "",
  outsideSpace: "",
  parking: "",
  heating: "",
  utilities: "",
  nearby: "",
  periodFeatures: "",
  targetAudience: "",
  yearBuilt: "",
  disclosures: "",
  showingNotes: "",
  mediaNotes: "",
};

export const EXAMPLE_INPUT: ListingInput = {
  market: "uk",
  voice: "heritage",
  voiceNotes:
    "This is the Old Rectory on Church Lane in Burford. Lovely characterful period rectory, Grade II listed, five bedrooms, three bathrooms, inglenook fireplace and flagstone floors. Walled garden about half an acre with an orchard. Guide price one point four five million, freehold.",
  address: "The Old Rectory, Church Lane, Burford, Oxfordshire OX18",
  areaHighlights:
    "Sought-after Cotswold market town, honey-stone high street, independent shops and the River Windrush nearby",
  propertyType: "Grade II listed detached period rectory",
  tenure: "Freehold",
  leaseYears: "",
  price: "1,450,000",
  priceQualifier: "Guide Price",
  bedrooms: "5",
  bathrooms: "3",
  receptions: "3",
  keyFeatures:
    "Inglenook fireplace, flagstone floors, exposed beams, bespoke shaker kitchen, cellar, original sash windows",
  dimensions: "Drawing room 6.8m x 5.1m; Kitchen/breakfast room 7.2m x 4.4m",
  epc: "E",
  councilTaxBand: "G",
  outsideSpace:
    "Walled garden of around half an acre, mature herbaceous borders, orchard and a stone terrace",
  parking: "Gravel driveway and detached double cart shed",
  heating: "Oil-fired central heating",
  utilities: "Mains water and electricity, private drainage, Ultrafast broadband available",
  nearby:
    "Burford Primary (Ofsted Good), The Burford School, Charlbury station (London Paddington ~80 mins), A40 for Oxford and Cheltenham",
  periodFeatures:
    "Early 18th-century origins, later Georgian additions, retains much original joinery and fireplaces",
  targetAudience:
    "Families and downsizers seeking a characterful country home within a vibrant town",
  yearBuilt: "",
  disclosures: "",
  showingNotes: "",
  mediaNotes: "",
};

export const US_EXAMPLE_INPUT: ListingInput = {
  market: "us",
  voice: "premium",
  voiceNotes:
    "Okay this is 148 Magnolia Court over in Winter Park, single-family, built 2016, four beds three and a half baths, about 3,200 square feet on a quarter-acre lot. Chef's kitchen with quartz counters, primary suite down, screened lanai and a heated pool. HOA runs about ninety a month, taxes were around nine grand last year. Asking eight ninety-five.",
  address: "148 Magnolia Court, Winter Park, FL 32789",
  areaHighlights:
    "Established Winter Park neighborhood, tree-lined streets, close to Park Avenue shops and dining",
  propertyType: "Single-family home",
  tenure: "Fee simple",
  leaseYears: "$90 / month",
  price: "895,000",
  priceQualifier: "",
  bedrooms: "4",
  bathrooms: "3.5",
  receptions: "",
  keyFeatures:
    "Chef's kitchen with quartz countertops, first-floor primary suite, screened lanai, heated saltwater pool, three-car garage",
  dimensions:
    "Approx. 3,200 sq ft on a 0.25-acre lot. Great room 22ft x 18ft; Primary suite 18ft x 15ft",
  epc: "",
  councilTaxBand: "Approx. $9,000 / year",
  outsideSpace: "Quarter-acre lot, fenced backyard, covered lanai and heated pool",
  parking: "Three-car attached garage plus paver driveway",
  heating: "Central heating and air conditioning",
  utilities: "City water and sewer, fiber internet available",
  nearby: "Winter Park school district; near Park Avenue, Rollins College and I-4",
  periodFeatures: "",
  targetAudience: "",
  yearBuilt: "2016",
  disclosures:
    "Roof replaced 2021; seller's property disclosure available. No known material defects.",
  showingNotes:
    "Showings by appointment via ShowingTime; 24 hours' notice preferred. Pets on site.",
  mediaNotes: "Professional photos and drone shots scheduled; interactive floor plan to follow.",
  // US-specific facts surfaced via structured fields:
  // square footage ~3,200 sq ft, HOA ~$90/mo, property taxes ~$9,000/yr, lot 0.25 acre.
};
