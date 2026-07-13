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
  social: SocialPost[];
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
  // US-specific facts surfaced via structured fields:
  // square footage ~3,200 sq ft, HOA ~$90/mo, property taxes ~$9,000/yr, lot 0.25 acre.
};
