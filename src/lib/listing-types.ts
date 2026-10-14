import type { VoiceId } from "./voices";
import type { MarketId } from "./config";

export interface ListingInput {
  /** Always "uk". Optional; legacy rows may still carry "us". */
  market?: MarketId | "us";
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
  /** LEGACY combined supplies field — retired from the form; old rows still use it. */
  utilities?: string;
  groundRent: string;
  groundRentReview: string;
  serviceCharge: string;
  serviceChargePeriod: string;
  reserveFund: string;
  sharePercent: string;
  rent: string;
  fullMarketValue: string;
  /** Private treaty / Traditional auction / Modern Method of Auction. */
  saleMethod: string;
  auctionTerms: string;
  reservationFee: string;
  buyerFees: string;
  /** Available / Under offer – still marketing / Sold subject to contract. */
  saleStatus: string;
  /** "Yes" when marketed pre-market / coming soon. */
  preMarket: string;
  /** "Yes" for a new home ("From" qualifier allowed). */
  newBuild: string;
  incentives: string;
  /** Estate / management charge, £ per year (any tenure). */
  estateCharge: string;
  /** "Yes" when the EPC rating is a predicted (SAP) rating. */
  epcPredicted: string;
  ageRestriction: string;
  eventFees: string;
  localAuthority: string;
  chainStatus: string;
  construction: string;
  constructionDetails: string;
  electricity: string;
  water: string;
  waterMetered: string;
  sewerage: string;
  broadband: string;
  broadbandSpeed: string;
  mobileSignal: string;
  buildingSafety: string;
  restrictions: string;
  rightsEasements: string;
  flooding: string;
  coastalErosion: string;
  planning: string;
  accessibility: string;
  coalfieldMining: string;
  nearby: string;
  periodFeatures: string;
  targetAudience: string;
  /** Year the property was built . */
  yearBuilt: string;
  /** Disclosures / condition notes — only surfaced factually when provided. */
  disclosures: string;
  /** Viewing / access notes — private-only; never surfaced in generated public copy. */
  showingNotes: string;
  /** Media / photo / floor-plan notes. */
  mediaNotes: string;
  /** Seller has approved the particulars (TPO Code 7j). */
  sellerApproved?: boolean;
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
  /** 40–80 words for the CRM property-alert message box. Missing on older rows. */
  personalMessage?: string;
}

export interface SellerEmail {
  subject: string;
  body: string;
}

export interface ListingOutput {
  headline: string;
  listing: string;
  summary: string;
  /** Portal-style bullet points generated strictly from supplied facts. */
  keyFeatures: string[];
  /** Structured email campaign copy. Null on legacy saved rows only. */
  emailBlast: EmailBlast | null;
  social: SocialPost[];
  /** Seller approval email (draft particulars check). Null on older rows. */
  sellerEmail?: SellerEmail | null;
  /** "failed" when the email/social call failed; can be generated free later. */
  marketingStatus?: "failed";
  /** Prompt version + model that produced this pack (set from Prompt Lab 1 on). */
  meta?: { promptVersion: string; model: string };
}

// Sensible per-field length caps for the Email Blast.
const EMAIL_SUBJECT_MAX = 120;
const EMAIL_PREVIEW_MAX = 200;
const EMAIL_HEADLINE_MAX = 160;
const EMAIL_BODY_MAX = 4000;
const EMAIL_CTA_MAX = 80;

/**
 * Editable placeholders appended to the copied/rendered Email Blast. Quill
 * never invents agent contact info, property URLs, availability or dates —
 * these lines are surfaced verbatim so the user fills them in before sending.
 */
export const EMAIL_LINK_PLACEHOLDER = "[Add property link]";
export const EMAIL_SIGNOFF_PLACEHOLDER = "[Your name, branch, phone]";
export const EMAIL_BLAST_PLACEHOLDERS = [
  `Property link: ${EMAIL_LINK_PLACEHOLDER}`,
  `Sign-off: ${EMAIL_SIGNOFF_PLACEHOLDER}`,
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
  const personalMessage = typeof e.personalMessage === "string" ? e.personalMessage.trim() : "";
  if (subjectLines.length === 0 && !previewText && !headline && !body && !callToAction) {
    return null;
  }
  return {
    subjectLines,
    previewText,
    headline,
    body,
    callToAction,
    ...(personalMessage ? { personalMessage } : {}),
  };
}

/** Canonical platform labels, in output order. */
const CANONICAL_PLATFORMS = ["Instagram", "Facebook", "X"] as const;
type CanonicalPlatform = (typeof CANONICAL_PLATFORMS)[number];

/**
 * Map a raw platform label to a canonical platform. Labels are compared with
 * spaces and punctuation stripped, so "Twitter / X", "X (formerly Twitter)"
 * and "x-twitter" all resolve to X. Returns null when unrecognised.
 */
export function canonicalisePlatform(raw: string): CanonicalPlatform | null {
  const k = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (k === "instagram" || k === "ig" || k === "insta") return "Instagram";
  if (k === "facebook" || k === "fb" || k === "meta") return "Facebook";
  if (
    k === "x" ||
    k === "twitter" ||
    k === "twitterx" ||
    k === "xtwitter" ||
    k === "xformerlytwitter" ||
    k === "twitterformerlyx" ||
    k === "xtwitterformerly"
  ) {
    return "X";
  }
  return null;
}

function cleanFeature(f: unknown): string {
  return typeof f === "string"
    ? f
        .trim()
        .replace(/^[-•*·\s]+/, "")
        .replace(/[.!?;,]+$/g, "")
        .trim()
    : "";
}

export type CoreOutput = Pick<ListingOutput, "headline" | "listing" | "summary" | "keyFeatures">;
export type MarketingOutput = Pick<ListingOutput, "emailBlast" | "social" | "sellerEmail">;

/**
 * Tolerant-but-safe validator for the CORE call. Cleans and dedupes key
 * features, slices to 10, and fails only when fewer than 6 remain or a
 * required text field is empty.
 */
export function validateCoreOutput(raw: unknown): CoreOutput {
  if (!raw || typeof raw !== "object") throw new Error("MALFORMED_AI_OUTPUT");
  const r = raw as Record<string, unknown>;
  const headline = typeof r.headline === "string" ? r.headline.trim() : "";
  const listing = typeof r.listing === "string" ? r.listing.trim() : "";
  const summary = typeof r.summary === "string" ? r.summary.trim() : "";
  if (!headline || !listing || !summary) throw new Error("MALFORMED_AI_OUTPUT");
  const seen = new Set<string>();
  const keyFeatures = (Array.isArray(r.keyFeatures) ? r.keyFeatures : [])
    .map(cleanFeature)
    .filter((f) => f.length > 0 && f.length <= 240)
    .filter((f) => {
      const k = f.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 10);
  if (keyFeatures.length < 6) throw new Error("MALFORMED_AI_OUTPUT");
  return { headline, listing, summary, keyFeatures };
}

/**
 * Tolerant-but-safe validator for the MARKETING call (Email Blast + social).
 * Subject lines: dedupe, drop any over the cap, keep the first 3, fail only
 * if none remain. Other email fields must be present and within caps.
 * Social: platform labels normalised; unknown/duplicate platforms dropped;
 * fails only if no usable post remains.
 */
/** The model occasionally returns a nested object as a JSON string — unwrap it. */
function unwrapJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!/^[[{]/.test(s)) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

/**
 * sellerEmail sometimes arrives as a JSON-ish string with unescaped quotes
 * (e.g. reply "Approved"). Parse it, or pull the body out leniently.
 */
export function unwrapSellerEmail(v: unknown): unknown {
  const u = unwrapJson(v);
  if (typeof u !== "string") return u;
  const m = u.match(/^\s*\{\s*"body"\s*:\s*"([\s\S]*)"\s*\}\s*$/);
  if (!m) return u.trim() ? { body: u } : u;
  const body = m[1].replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return { body };
}

export function validateMarketingOutput(raw: unknown): MarketingOutput {
  if (!raw || typeof raw !== "object") throw new Error("MALFORMED_AI_OUTPUT");
  const r0 = raw as Record<string, unknown>;
  const r: Record<string, unknown> = {
    ...r0,
    emailBlast: unwrapJson(r0.emailBlast),
    sellerEmail: unwrapSellerEmail(r0.sellerEmail),
    social: unwrapJson(r0.social),
  };
  const e = (r.emailBlast ?? {}) as Record<string, unknown>;

  const seenS = new Set<string>();
  const subjectLines = (Array.isArray(e.subjectLines) ? e.subjectLines : [])
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0 && s.length <= EMAIL_SUBJECT_MAX)
    .filter((s) => {
      const k = s.toLowerCase();
      if (seenS.has(k)) return false;
      seenS.add(k);
      return true;
    })
    .slice(0, 3);
  if (subjectLines.length === 0) throw new Error("MALFORMED_AI_OUTPUT");

  const str = (v: unknown, max: number): string => {
    const t = typeof v === "string" ? v.trim() : "";
    if (!t || t.length > max) throw new Error("MALFORMED_AI_OUTPUT");
    return t;
  };
  const emailBlast: EmailBlast = {
    subjectLines,
    previewText: str(e.previewText, EMAIL_PREVIEW_MAX),
    headline: str(e.headline, EMAIL_HEADLINE_MAX),
    body: str(e.body, EMAIL_BODY_MAX),
    callToAction: str(e.callToAction, EMAIL_CTA_MAX),
  };
  const pm = typeof e.personalMessage === "string" ? e.personalMessage.trim() : "";
  if (pm && pm.length <= 1200) emailBlast.personalMessage = pm;

  const byPlatform = new Map<CanonicalPlatform, SocialPost>();
  for (const p of Array.isArray(r.social) ? r.social : []) {
    if (!p || typeof p !== "object") continue;
    const post = p as Record<string, unknown>;
    const platform = canonicalisePlatform(typeof post.platform === "string" ? post.platform : "");
    const caption = typeof post.caption === "string" ? post.caption.trim() : "";
    if (!platform || !caption || byPlatform.has(platform)) continue;
    const seenH = new Set<string>();
    const hashtags = (Array.isArray(post.hashtags) ? (post.hashtags as unknown[]) : [])
      .map((h) => (typeof h === "string" ? h.replace(/^#+/, "").replace(/\s+/g, "").trim() : ""))
      .filter((h) => h.length > 0 && h.length <= 60)
      .filter((h) => {
        const k = h.toLowerCase();
        if (seenH.has(k)) return false;
        seenH.add(k);
        return true;
      })
      .slice(0, 20);
    byPlatform.set(platform, { platform, caption, hashtags });
  }
  const social = CANONICAL_PLATFORMS.map((pl) => byPlatform.get(pl)).filter(
    (p): p is SocialPost => !!p,
  );
  if (social.length === 0) throw new Error("MALFORMED_AI_OUTPUT");

  // Email Blast must close with the material-information pointer.
  const MI_LINE = "Full material information is on the property listing.";
  // Always last: strip it wherever the model put it, then append.
  const stripped = emailBlast.body
    .split(MI_LINE)
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  emailBlast.body = `${stripped}\n\n${MI_LINE}`;

  // Seller approval email is optional — never fails the marketing call.
  let sellerEmail = coerceSellerEmail(r.sellerEmail);
  if (sellerEmail && sellerEmail.body.length > 6000) sellerEmail = null;
  if (sellerEmail && !sellerEmail.body.includes("[Your name, branch, phone]")) {
    sellerEmail.body = `${sellerEmail.body}\n\n[Your name, branch, phone]`;
  }
  return { emailBlast, social, sellerEmail };
}

/** X caption + "#tag #tag" length, as the agent would paste it. */
export function xPostLength(p: SocialPost): number {
  const tags = p.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return `${p.caption}${tags ? `\n\n${tags}` : ""}`.length;
}

const plainMoney = (v: string) => {
  const d = v.replace(/[£,\s]/g, "");
  return /^\d+(\.\d+)?$/.test(d) ? `£${Number(d).toLocaleString("en-GB")}` : v.trim();
};

/**
 * Social rule problems worth one marketing retry: X over 280 incl. hashtags,
 * or a caption without the price or the tenure. Empty array = fine.
 */
export function socialProblems(
  out: MarketingOutput,
  input: Pick<ListingInput, "price" | "tenure">,
): string[] {
  const probs: string[] = [];
  for (const p of out.social) {
    if (p.platform === "X" && xPostLength(p) > 280) probs.push("x-length");
    const text = `${p.caption} ${p.hashtags.join(" ")}`.toLowerCase();
    if (input.price?.trim() && !text.includes(plainMoney(input.price).toLowerCase()))
      probs.push(`${p.platform}:price`);
    if (input.tenure?.trim() && !text.includes(input.tenure.trim().toLowerCase()))
      probs.push(`${p.platform}:tenure`);
  }
  return probs;
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
    emailBlast: coerceLegacyEmailBlast(r.emailBlast),
    social,
    sellerEmail: coerceSellerEmail(r.sellerEmail),
    ...(r.marketingStatus === "failed" ? { marketingStatus: "failed" as const } : {}),
    ...(coerceMeta(r.meta) ? { meta: coerceMeta(r.meta)! } : {}),
  };
}

function coerceMeta(raw: unknown): { promptVersion: string; model: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  return typeof m.promptVersion === "string" && typeof m.model === "string"
    ? { promptVersion: m.promptVersion, model: m.model }
    : null;
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
  groundRent: "",
  groundRentReview: "",
  serviceCharge: "",
  serviceChargePeriod: "",
  reserveFund: "",
  sharePercent: "",
  rent: "",
  fullMarketValue: "",
  saleMethod: "",
  auctionTerms: "",
  reservationFee: "",
  buyerFees: "",
  saleStatus: "",
  preMarket: "",
  newBuild: "",
  incentives: "",
  estateCharge: "",
  epcPredicted: "",
  ageRestriction: "",
  eventFees: "",
  localAuthority: "",
  chainStatus: "",
  construction: "",
  constructionDetails: "",
  electricity: "",
  water: "",
  waterMetered: "",
  sewerage: "",
  broadband: "",
  broadbandSpeed: "",
  mobileSignal: "",
  buildingSafety: "",
  restrictions: "",
  rightsEasements: "",
  flooding: "",
  coastalErosion: "",
  planning: "",
  accessibility: "",
  coalfieldMining: "",
  nearby: "",
  periodFeatures: "",
  targetAudience: "",
  yearBuilt: "",
  disclosures: "",
  showingNotes: "",
  mediaNotes: "",
};

export const EXAMPLE_INPUT: ListingInput = {
  ...EMPTY_INPUT,
  voice: "heritage",
  voiceNotes:
    "This is the Old Rectory on Church Lane in Burford. Lovely characterful period rectory, Grade II listed, five bedrooms, three bathrooms, inglenook fireplace and flagstone floors. Walled garden about half an acre with an orchard. Guide price one point four five million, freehold.",
  address: "The Old Rectory, Church Lane, Burford, Oxfordshire OX18",
  areaHighlights:
    "Cotswold market town, honey-stone high street, independent shops and the River Windrush nearby",
  propertyType: "Grade II listed detached period rectory",
  tenure: "Freehold",
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
  localAuthority: "West Oxfordshire District Council",
  chainStatus: "No onward chain",
  construction: "Standard",
  constructionDetails: "Cotswold stone under a stone slate roof",
  electricity: "Mains",
  water: "Mains",
  waterMetered: "Yes",
  sewerage: "Septic tank",
  broadband: "FTTP",
  broadbandSpeed: "Ultrafast available",
  mobileSignal: "Good outdoor coverage on major networks",
  outsideSpace:
    "Walled garden of around half an acre, mature herbaceous borders, orchard and a stone terrace",
  parking: "Gravel driveway and detached double cart shed",
  heating: "Oil-fired central heating",
  nearby: "The Burford School, Charlbury station, A40 for Oxford and Cheltenham",
  periodFeatures:
    "Early 18th-century origins, later Georgian additions, retains much original joinery and fireplaces",
  targetAudience: "Growing family, Downsizer",
  buildingSafety: "None known",
  restrictions: "Yes – Grade II listed; within the Burford Conservation Area",
  rightsEasements: "None known",
  flooding: "None known",
  coastalErosion: "None known",
  planning: "None known",
  accessibility: "None known",
  coalfieldMining: "None known",
  sellerApproved: false,
};

/** A second-floor leasehold flat — used for testing leasehold handling. */
export const LEASEHOLD_EXAMPLE: ListingInput = {
  ...EMPTY_INPUT,
  voice: "plain",
  address: "Flat 12, Riverside Court, Chatham, Kent ME4",
  propertyType: "Second-floor apartment",
  tenure: "Leasehold",
  leaseYears: "112",
  groundRent: "250",
  groundRentReview: "reviewed every 25 years",
  serviceCharge: "1,840",
  serviceChargePeriod: "y/e Mar 2026",
  price: "235,000",
  priceQualifier: "Offers in Excess of",
  bedrooms: "2",
  bathrooms: "1",
  receptions: "1",
  keyFeatures: "Open-plan kitchen/living room, balcony with river views, lift, allocated parking",
  dimensions: "Kitchen/living room 6.10m x 4.20m; Bedroom 1 3.90m x 3.20m",
  epc: "C",
  councilTaxBand: "C",
  localAuthority: "Medway Council",
  chainStatus: "Chain involved",
  electricity: "Mains",
  water: "Mains",
  waterMetered: "Yes",
  sewerage: "Mains",
  heating: "Electric panel heaters",
  broadband: "FTTP",
  parking: "One allocated space",
  nearby: "Chatham station",
  targetAudience: "First-time buyer, Investor",
};

/** Fill any missing fields on a saved row's inputs so old listings still render. */
export function coerceLegacyInput(raw: unknown): ListingInput {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...EMPTY_INPUT };
  for (const k of Object.keys(EMPTY_INPUT)) {
    const v = r[k];
    if (typeof v === "string") out[k] = v;
  }
  if (typeof r.utilities === "string") out.utilities = r.utilities;
  out.sellerApproved = r.sellerApproved === true;
  out.market = "uk";
  return out as unknown as ListingInput;
}

export function coerceSellerEmail(raw: unknown): SellerEmail | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const subject = typeof e.subject === "string" ? e.subject.trim() : "";
  const body = typeof e.body === "string" ? e.body.trim() : "";
  return body ? { subject, body } : null;
}
