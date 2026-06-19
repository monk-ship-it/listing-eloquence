import type { VoiceId } from "./voices";

export interface ListingInput {
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
  voice: "professional",
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
};

export const EXAMPLE_INPUT: ListingInput = {
  voice: "heritage",
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
