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
  /** Showing / access notes — kept out of public remarks; used for buyer emails. */
  showingNotes: string;
  /** Media / photo / floor-plan notes. */
  mediaNotes: string;
}

export interface SocialPost {
  platform: string;
  caption: string;
  hashtags: string[];
}

export interface ListingOutput {
  headline: string;
  listing: string;
  summary: string;
  /** Portal/MLS-style bullet points generated strictly from supplied facts. */
  keyFeatures: string[];
  social: SocialPost[];
}

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

  return { headline, listing, summary, keyFeatures, social };
}

/**
 * Strict validator for NEW AI responses. Requires 6–10 clean Key Features
 * and exactly one usable Instagram, Facebook and X post. Throws
 * MALFORMED_AI_OUTPUT on any failure so callers can retry.
 */
export function validateNewListingOutput(raw: unknown): ListingOutput {
  const out = normaliseListingOutput(raw);
  if (!out.summary) throw new Error("MALFORMED_AI_OUTPUT");
  if (out.keyFeatures.length < 6 || out.keyFeatures.length > 10) {
    throw new Error("MALFORMED_AI_OUTPUT");
  }
  const required = ["instagram", "facebook", "x"] as const;
  const byPlatform = new Map<string, SocialPost>();
  for (const p of out.social) {
    const key = p.platform.trim().toLowerCase();
    // Accept "Twitter/X" or "X (Twitter)" style as X
    const norm = key === "twitter" || key.includes("x (") || key === "x/twitter" ? "x" : key;
    if (!byPlatform.has(norm)) byPlatform.set(norm, { ...p, platform: p.platform });
  }
  for (const platform of required) {
    const post = byPlatform.get(platform);
    if (!post || !post.caption) throw new Error("MALFORMED_AI_OUTPUT");
  }
  return out;
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
  targetAudience: "Families and downsizers seeking a characterful country home within a vibrant town",
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
  dimensions: "Approx. 3,200 sq ft on a 0.25-acre lot. Great room 22ft x 18ft; Primary suite 18ft x 15ft",
  epc: "",
  councilTaxBand: "Approx. $9,000 / year",
  outsideSpace: "Quarter-acre lot, fenced backyard, covered lanai and heated pool",
  parking: "Three-car attached garage plus paver driveway",
  heating: "Central heating and air conditioning",
  utilities: "City water and sewer, fiber internet available",
  nearby:
    "Winter Park school district; near Park Avenue, Rollins College and I-4",
  periodFeatures: "",
  targetAudience: "",
  yearBuilt: "2016",
  disclosures: "Roof replaced 2021; seller's property disclosure available. No known material defects.",
  showingNotes: "Showings by appointment via ShowingTime; 24 hours' notice preferred. Pets on site.",
  mediaNotes: "Professional photos and drone shots scheduled; interactive floor plan to follow.",
  // US-specific facts surfaced via structured fields:
  // square footage ~3,200 sq ft, HOA ~$90/mo, property taxes ~$9,000/yr, lot 0.25 acre.
};
