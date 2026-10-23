import type { ListingInput } from "./listing-types";
import { normaliseForField, stripTrailing } from "./dictation-normalise";

export type DictateMode = "replace" | "append-comma" | "append-semicolon" | "append-space";

/** Every string ListingInput key shown on the form. */
export type TextFieldKey = Exclude<
  keyof ListingInput,
  "voice" | "market" | "sellerApproved" | "utilities"
>;

export type SectionId =
  "voice" | "basics" | "price" | "rooms" | "material" | "location" | "internal";

export const SECTIONS: { id: Exclude<SectionId, "voice">; title: string; mobileOpen: boolean }[] = [
  { id: "basics", title: "The basics", mobileOpen: true },
  { id: "price", title: "Price, tenure & sale", mobileOpen: true },
  { id: "rooms", title: "Rooms", mobileOpen: false },
  { id: "material", title: "Material information", mobileOpen: false },
  { id: "location", title: "Location & lifestyle", mobileOpen: false },
  { id: "internal", title: "Internal notes (never published)", mobileOpen: false },
];

export type FieldKind = "input" | "textarea" | "select" | "tri" | "chips";

export interface FieldDef {
  key: TextFieldKey;
  label: string;
  placeholder: string;
  kind: FieldKind;
  rows?: number;
  section: SectionId;
  dictateMode: DictateMode;
  /** Included in "Fill the form from my voice note". */
  extractable: boolean;
  /** Consecutive defs sharing a group render side by side in one grid row. */
  group?: string;
  /** Allowed values for select / chips. */
  options?: string[];
  /** Hide the field unless this returns true. */
  showIf?: (input: ListingInput) => boolean;
  /** Short hint for the extraction model. */
  hint?: string;
}

export const PRICE_QUALIFIERS = [
  "Guide Price",
  "Offers in Excess of",
  "Offers in the Region of",
  "Offers Over",
  "Fixed Price",
  "From",
  "Shared Ownership",
];
export const TENURES = ["Freehold", "Leasehold", "Share of freehold", "Commonhold"];
export const PROPERTY_NATIONS = ["England", "Wales", "Scotland", "Northern Ireland"];
export const isNorthernIreland = (i: ListingInput) => i.propertyNation === "Northern Ireland";
export const isScotland = (i: ListingInput) => i.propertyNation === "Scotland";
export const councilTaxOptions = (i: ListingInput) =>
  COUNCIL_TAX_BANDS.filter((b) => b !== "I" || i.propertyNation === "Wales");
export const COUNCIL_TAX_BANDS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "Exempt",
  "Not yet banded",
];
export const EPC_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "Exempt", "Commissioned"];
export const CHAIN_OPTIONS = ["No onward chain", "Chain involved", "Not known"];
export const CONSTRUCTION_OPTIONS = ["Standard", "Non-standard"];
export const SEWERAGE_OPTIONS = ["Mains", "Septic tank", "Cesspit", "Treatment plant"];
export const BROADBAND_OPTIONS = ["FTTP", "FTTC", "Cable", "ADSL", "Other"];
export const YES_NO = ["Yes", "No"];
export const SALE_METHODS = ["Private treaty", "Traditional auction", "Modern Method of Auction"];
export const SALE_STATUSES = [
  "Available",
  "Under offer – still marketing",
  "Sold subject to contract",
];
export const LIKELY_BUYERS = [
  "First-time buyer",
  "Growing family",
  "Downsizer",
  "Investor",
  "Commuter",
  "Chain-free buyer",
];

export const isLeasehold = (i: ListingInput) => /leasehold|share of freehold/i.test(i.tenure ?? "");
export const isSharedOwnership = (i: ListingInput) =>
  /shared ownership/i.test(i.priceQualifier ?? "") || !!(i.sharePercent ?? "").trim();
export const isAuction = (i: ListingInput) => /auction/i.test(i.saleMethod ?? "");
export const isYes = (v: string | undefined) => /^yes$/i.test((v ?? "").trim());

const TRI_HINT = 'Exactly "None known", or "Yes – <details>" when the agent describes one.';

function tri(key: TextFieldKey, label: string, placeholder: string): FieldDef {
  return {
    key,
    label,
    placeholder,
    kind: "tri",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    hint: TRI_HINT,
  };
}

/**
 * Single source of truth for the generator form: order, labels, placeholders,
 * dictation insert mode and extraction eligibility. New fields added here
 * automatically get a mic and are offered to extraction.
 */
export const FIELD_DEFS: FieldDef[] = [
  {
    key: "voiceNotes",
    label: "Dictated property notes",
    placeholder:
      "Example: Four-bedroom semi-detached house on Brenzett Close, open-plan kitchen, heated marble flooring, log burner in the main living room, two bathrooms, leasehold, guide price…",
    kind: "textarea",
    rows: 5,
    section: "voice",
    dictateMode: "append-space",
    extractable: false,
  },
  // The basics
  {
    key: "propertyNation",
    label: "Property nation",
    placeholder: "Choose the property's UK nation…",
    kind: "select",
    options: PROPERTY_NATIONS,
    section: "basics",
    dictateMode: "replace",
    extractable: true,
    hint: "Only when explicitly stated; never infer the nation from the address or town.",
  },
  {
    key: "address",
    label: "Address / location",
    placeholder: "12 Park Avenue, Harrogate, HG1",
    kind: "input",
    section: "basics",
    dictateMode: "replace",
    extractable: true,
  },
  {
    key: "propertyType",
    label: "Property type",
    placeholder: "Victorian semi-detached house",
    kind: "input",
    section: "basics",
    dictateMode: "replace",
    extractable: true,
    group: "type",
  },
  {
    key: "yearBuilt",
    label: "Year built / approx. age",
    placeholder: "1901",
    kind: "input",
    section: "basics",
    dictateMode: "replace",
    extractable: true,
    group: "type",
  },
  {
    key: "keyFeatures",
    label: "Key features",
    placeholder: "Open-plan kitchen, log burner, south-facing garden…",
    kind: "textarea",
    rows: 2,
    section: "basics",
    dictateMode: "append-semicolon",
    extractable: true,
  },
  {
    key: "targetAudience",
    label: "Likely buyer",
    placeholder: "Steers emphasis only — never excludes anyone",
    kind: "chips",
    options: LIKELY_BUYERS,
    section: "basics",
    dictateMode: "replace",
    extractable: true,
    hint: `Comma-separated, only from: ${LIKELY_BUYERS.join(", ")}.`,
  },
  // Price & tenure
  {
    key: "price",
    label: "Asking price (£)",
    placeholder: "525,000",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "price",
  },
  {
    key: "priceQualifier",
    label: "Price qualifier",
    placeholder: "Choose…",
    kind: "select",
    options: PRICE_QUALIFIERS,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "price",
  },
  {
    key: "tenure",
    label: "Tenure / ownership",
    placeholder: "Choose…",
    kind: "select",
    options: TENURES,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "tenure",
  },
  {
    key: "chainStatus",
    label: "Chain",
    placeholder: "Choose…",
    kind: "select",
    options: CHAIN_OPTIONS,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "tenure",
  },
  {
    key: "leaseYears",
    label: "Lease remaining (yrs)",
    placeholder: "112",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "lease1",
    showIf: isLeasehold,
  },
  {
    key: "groundRent",
    label: "Ground rent (£ per year)",
    placeholder: "250",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "lease1",
    showIf: isLeasehold,
  },
  {
    key: "groundRentReview",
    label: "Ground rent review",
    placeholder: "Reviewed every 25 years / next review 2031 / RPI-linked",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    showIf: isLeasehold,
  },
  {
    key: "serviceCharge",
    label: "Service charge (£ per year)",
    placeholder: "1,840",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "lease2",
    showIf: isLeasehold,
  },
  {
    key: "serviceChargePeriod",
    label: "Service charge period",
    placeholder: "y/e Mar 2026",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "lease2",
    showIf: isLeasehold,
  },
  {
    key: "reserveFund",
    label: "Reserve fund / event fees",
    placeholder: "Reserve fund contribution included; no event fees",
    kind: "input",
    section: "price",
    dictateMode: "append-comma",
    extractable: true,
    showIf: isLeasehold,
  },
  {
    key: "sharePercent",
    label: "Share offered (%)",
    placeholder: "40",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "shared",
    showIf: isSharedOwnership,
  },
  {
    key: "rent",
    label: "Rent on unsold share (£/month)",
    placeholder: "520",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "shared",
    showIf: isSharedOwnership,
  },
  {
    key: "fullMarketValue",
    label: "Full market value (£)",
    placeholder: "325,000",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    showIf: isSharedOwnership,
  },
  // Sale & status
  {
    key: "saleMethod",
    label: "Sale method",
    placeholder: "Choose…",
    kind: "select",
    options: SALE_METHODS,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "sale",
    hint: 'Only when stated; "MMoA" / "modern method" → "Modern Method of Auction".',
  },
  {
    key: "saleStatus",
    label: "Sale status",
    placeholder: "Choose…",
    kind: "select",
    options: SALE_STATUSES,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "sale",
  },
  {
    key: "auctionTerms",
    label: "Auction terms",
    placeholder: "Reservation period, reserve, how the guide relates to the reserve…",
    kind: "textarea",
    rows: 2,
    section: "price",
    dictateMode: "append-space",
    extractable: true,
    showIf: isAuction,
  },
  {
    key: "reservationFee",
    label: "Reservation fee",
    placeholder: "4.2% inc. VAT (min £6,000), non-refundable, in addition to the price",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
  },
  {
    key: "buyerFees",
    label: "Buyer's fees",
    placeholder: "Buyer's premium / admin fee, amount and VAT",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
  },
  {
    key: "preMarket",
    label: "Pre-market / coming soon?",
    placeholder: "Choose…",
    kind: "select",
    options: YES_NO,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "toggles",
  },
  {
    key: "newBuild",
    label: "New home?",
    placeholder: "Choose…",
    kind: "select",
    options: YES_NO,
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "toggles",
    hint: "Yes only when the agent says it is a new build / new home.",
  },
  {
    key: "incentives",
    label: "Incentives (with end date)",
    placeholder: "£5,000 towards flooring for reservations by 30 November 2026",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
  },
  {
    key: "estateCharge",
    label: "Estate / management charge (£ per year)",
    placeholder: "295",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "retire",
  },
  {
    key: "ageRestriction",
    label: "Age / occupancy restriction",
    placeholder: "Over-60s only",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    group: "retire",
  },
  {
    key: "eventFees",
    label: "Event fees (retirement)",
    placeholder: "1% of sale price on resale, payable to the management company",
    kind: "input",
    section: "price",
    dictateMode: "replace",
    extractable: true,
    showIf: (i) => !!(i.ageRestriction ?? "").trim() || !!(i.eventFees ?? "").trim(),
  },
  // Rooms
  {
    key: "bedrooms",
    label: "Bedrooms",
    placeholder: "4",
    kind: "input",
    section: "rooms",
    dictateMode: "replace",
    extractable: true,
    group: "rooms",
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    placeholder: "2",
    kind: "input",
    section: "rooms",
    dictateMode: "replace",
    extractable: true,
    group: "rooms",
  },
  {
    key: "receptions",
    label: "Receptions",
    placeholder: "2",
    kind: "input",
    section: "rooms",
    dictateMode: "replace",
    extractable: true,
    group: "rooms",
  },
  {
    key: "dimensions",
    label: "Room dimensions",
    placeholder: "Living room 5.2m x 4.1m…",
    kind: "textarea",
    rows: 2,
    section: "rooms",
    dictateMode: "append-semicolon",
    extractable: true,
  },
  {
    key: "periodFeatures",
    label: "Period / character features",
    placeholder: "Original cornicing, sash windows…",
    kind: "textarea",
    rows: 2,
    section: "rooms",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "outsideSpace",
    label: "Outside space / garden",
    placeholder: "Landscaped rear garden, patio",
    kind: "input",
    section: "rooms",
    dictateMode: "append-comma",
    extractable: true,
  },
  // Material information (Parts A & B)
  {
    key: "councilTaxBand",
    label: "Council Tax band",
    placeholder: "Choose…",
    kind: "select",
    options: COUNCIL_TAX_BANDS,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "ctax",
    showIf: (i) => !isNorthernIreland(i),
  },
  {
    key: "domesticRates",
    label: "Domestic rates (£ per year)",
    placeholder: "1,240",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "rates",
    showIf: isNorthernIreland,
  },
  {
    key: "domesticRatesYear",
    label: "Rates year",
    placeholder: "2026/27",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "rates",
    showIf: isNorthernIreland,
  },
  {
    key: "homeReportStatus",
    label: "Home Report status",
    placeholder: "Choose…",
    kind: "select",
    options: ["Available", "Awaiting", "Exemption claimed", "Exemption confirmed by agent"],
    section: "material",
    dictateMode: "replace",
    extractable: true,
    showIf: isScotland,
  },
  {
    key: "homeReportDetails",
    label: "Home Report date / reference or exemption reason",
    placeholder: "Report date and reference; or the claimed exemption and evidence",
    kind: "textarea",
    rows: 2,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    showIf: isScotland,
  },
  {
    key: "localAuthority",
    label: "Local authority",
    placeholder: "Medway Council",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "ctax",
  },
  {
    key: "epc",
    label: "EPC rating or status",
    placeholder: "Choose…",
    kind: "select",
    options: EPC_OPTIONS,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "epc",
  },
  {
    key: "epcExemptionReason",
    label: "Claimed EPC exemption — reason / evidence",
    placeholder: "State the claimed exemption and evidence checked",
    kind: "textarea",
    rows: 2,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    showIf: (i) => i.epc === "Exempt",
  },
  {
    key: "epcPredicted",
    label: "EPC predicted?",
    placeholder: "Choose…",
    kind: "select",
    options: YES_NO,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "epc",
    hint: "Yes only when the agent says the EPC is predicted (SAP / new build).",
  },
  {
    key: "construction",
    label: "Construction",
    placeholder: "Choose…",
    kind: "select",
    options: CONSTRUCTION_OPTIONS,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "epc",
  },
  {
    key: "constructionDetails",
    label: "Construction details",
    placeholder: "Brick under a tiled roof / timber frame…",
    kind: "input",
    section: "material",
    dictateMode: "append-comma",
    extractable: true,
  },
  {
    key: "electricity",
    label: "Electricity",
    placeholder: "Mains / solar panels…",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "supply1",
  },
  {
    key: "water",
    label: "Water",
    placeholder: "Mains / private supply",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "supply1",
  },
  {
    key: "waterMetered",
    label: "Water metered?",
    placeholder: "Choose…",
    kind: "select",
    options: YES_NO,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "supply2",
  },
  {
    key: "sewerage",
    label: "Sewerage",
    placeholder: "Choose…",
    kind: "select",
    options: SEWERAGE_OPTIONS,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "supply2",
  },
  {
    key: "heating",
    label: "Heating",
    placeholder: "Gas central heating",
    kind: "input",
    section: "material",
    dictateMode: "append-comma",
    extractable: true,
  },
  {
    key: "broadband",
    label: "Broadband",
    placeholder: "Choose…",
    kind: "select",
    options: BROADBAND_OPTIONS,
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "bb",
  },
  {
    key: "broadbandSpeed",
    label: "Broadband speed (if known)",
    placeholder: "Ultrafast up to 1,000Mbps",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
    group: "bb",
  },
  {
    key: "mobileSignal",
    label: "Mobile signal",
    placeholder: "Good outdoor coverage on major networks",
    kind: "input",
    section: "material",
    dictateMode: "replace",
    extractable: true,
  },
  {
    key: "parking",
    label: "Parking",
    placeholder: "Driveway, garage",
    kind: "input",
    section: "material",
    dictateMode: "append-comma",
    extractable: true,
  },
  // Part C
  tri("buildingSafety", "Building safety", "Cladding, EWS1, unsafe materials…"),
  tri("restrictions", "Restrictions", "Listed, conservation area, TPOs, covenants…"),
  tri("rightsEasements", "Rights & easements", "Rights of way, shared access…"),
  tri("flooding", "Flooding", "Flood risk zone, past flooding…"),
  tri("coastalErosion", "Coastal erosion", "Erosion risk…"),
  tri("planning", "Planning", "Permissions for the property or immediate area…"),
  tri("accessibility", "Accessibility", "Step-free access, ramp, lift…"),
  tri("coalfieldMining", "Coalfield / mining", "Coalfield or mining area…"),
  {
    key: "disclosures",
    label: "Known issues (always disclosed)",
    placeholder: "Recent rewire; damp report available…",
    kind: "textarea",
    rows: 2,
    section: "material",
    dictateMode: "append-space",
    extractable: true,
  },
  // Location & lifestyle
  {
    key: "nearby",
    label: "Nearby (schools, transport, amenities)",
    placeholder: "Primary school, station 0.5 miles…",
    kind: "textarea",
    rows: 2,
    section: "location",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "areaHighlights",
    label: "Area highlights",
    placeholder: "Market town, riverside walks",
    kind: "input",
    section: "location",
    dictateMode: "append-comma",
    extractable: true,
  },
  // Internal
  {
    key: "showingNotes",
    label: "Viewing notes (private)",
    placeholder: "By appointment; key with branch…",
    kind: "textarea",
    rows: 2,
    section: "internal",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "mediaNotes",
    label: "Photo & floorplan notes (private)",
    placeholder: "Photos + floor plan booked; virtual staging in lounge…",
    kind: "textarea",
    rows: 2,
    section: "internal",
    dictateMode: "append-space",
    extractable: true,
  },
];

export const FIELD_BY_KEY: Record<string, FieldDef> = Object.fromEntries(
  FIELD_DEFS.map((d) => [d.key, d]),
);

export const EXTRACTABLE_FIELDS = FIELD_DEFS.filter((d) => d.extractable);

/** Groups consecutive defs with the same `group` into rows for layout. */
export function fieldRows(defs: FieldDef[]): FieldDef[][] {
  const rows: FieldDef[][] = [];
  for (const d of defs) {
    const prev = rows[rows.length - 1];
    if (d.group && prev && prev[0].group === d.group) prev.push(d);
    else rows.push([d]);
  }
  return rows;
}

/** Combine existing text with a new dictated phrase for the given mode. */
export function applyDictation(mode: DictateMode, current: string, phrase: string): string {
  const text = phrase.trim();
  const cur = current.trim();
  if (!text) return current;
  if (mode === "replace" || !cur) {
    return mode === "append-comma" || mode === "append-semicolon"
      ? text.replace(/[.!?]+$/, "")
      : text;
  }
  if (mode === "append-space") return `${cur} ${text}`;
  const sep = mode === "append-semicolon" ? ";" : ",";
  const clean = text.replace(/[.!?]+$/, "");
  const base = cur.replace(/[;,]\s*$/, "");
  return `${base}${sep} ${clean}`;
}

const OPTION_SYNONYMS: Record<string, [RegExp, string][]> = {
  priceQualifier: [
    [/\b(oieo|offers? in excess( of)?|in excess of)\b/i, "Offers in Excess of"],
    [/\b(oiro|offers? in the region( of)?|in the region of)\b/i, "Offers in the Region of"],
    [/\b(offers? over|oo)\b/i, "Offers Over"],
    [/\bfixed\b/i, "Fixed Price"],
    [/\bshared ownership\b/i, "Shared Ownership"],
    [/\bguide\b/i, "Guide Price"],
    [/^from$/i, "From"],
  ],
  tenure: [
    [/share of (the )?freehold/i, "Share of freehold"],
    [/leasehold/i, "Leasehold"],
    [/commonhold/i, "Commonhold"],
    [/freehold/i, "Freehold"],
  ],
  chainStatus: [
    [/\b(no (onward )?chain|chain[- ]free)\b/i, "No onward chain"],
    [/\bnot known|unknown|don'?t know\b/i, "Not known"],
    [/\bchain\b/i, "Chain involved"],
  ],
  construction: [
    [/non[- ]?standard|timber frame|prefab|steel frame/i, "Non-standard"],
    [/standard|brick|stone/i, "Standard"],
  ],
  sewerage: [
    [/septic/i, "Septic tank"],
    [/cesspit|cesspool/i, "Cesspit"],
    [/treatment plant|package plant/i, "Treatment plant"],
    [/mains/i, "Mains"],
  ],
  broadband: [
    [/fttp|full fibre|fibre to the (premises|home)/i, "FTTP"],
    [/fttc|fibre to the cabinet|superfast/i, "FTTC"],
    [/cable|virgin/i, "Cable"],
    [/adsl|copper/i, "ADSL"],
  ],
  saleMethod: [
    [/\b(mmoa|modern method)\b/i, "Modern Method of Auction"],
    [/\bauction\b/i, "Traditional auction"],
    [/\bprivate treaty\b/i, "Private treaty"],
  ],
  saleStatus: [
    [/\bunder offer\b/i, "Under offer – still marketing"],
    [/\b(sold stc|sold subject to contract|stc)\b/i, "Sold subject to contract"],
    [/\bavailable\b/i, "Available"],
  ],
  newBuild: [
    [/\b(yes|new build|new home)\b/i, "Yes"],
    [/\bno\b/i, "No"],
  ],
  epcPredicted: [
    [/\b(yes|predicted|sap)\b/i, "Yes"],
    [/\bno\b/i, "No"],
  ],
  preMarket: [
    [/\b(yes|pre-?market|coming soon)\b/i, "Yes"],
    [/\bno\b/i, "No"],
  ],
  waterMetered: [
    [/\b(not metered|unmetered|no)\b/i, "No"],
    [/\b(metered|yes)\b/i, "Yes"],
  ],
  councilTaxBand: [
    [/exempt/i, "Exempt"],
    [/not (yet )?banded/i, "Not yet banded"],
  ],
  epc: [
    [/exempt/i, "Exempt"],
    [/commissioned|ordered|booked|awaited/i, "Commissioned"],
  ],
};

/**
 * Normalise a spoken or extracted value for a field. Selects map to one of
 * their options (null when nothing matches — the caller ignores it); Part C
 * fields become "None known" or "Yes – details"; chips keep only known
 * options. Other fields use the light normalisers.
 */
export function normaliseFieldValue(key: string, raw: string): string | null {
  const def = FIELD_BY_KEY[key];
  const text = stripTrailing(raw);
  if (!text) return null;
  if (!def) return normaliseForField(key, text);

  if (def.kind === "tri") {
    if (/^(none( known)?|no|nothing( known)?|n\/a|not that i know)\b/i.test(text)) {
      return "None known";
    }
    const details = text.replace(/^yes\s*[–\-:,]?\s*/i, "").trim();
    return details ? `Yes – ${details}` : "Yes";
  }

  if (def.kind === "chips") {
    const picked = (def.options ?? []).filter((o) => {
      const stem = o
        .toLowerCase()
        .replace(/ buyer$/, "")
        .replace(/-/g, "[- ]?");
      return new RegExp(stem.replace(/s$/, "s?"), "i").test(text);
    });
    return picked.length ? picked.join(", ") : null;
  }

  if (def.kind === "select") {
    const options = def.options ?? [];
    const exact = options.find((o) => o.toLowerCase() === text.toLowerCase());
    if (exact) return exact;
    for (const [re, value] of OPTION_SYNONYMS[key] ?? []) if (re.test(text)) return value;
    if (key === "councilTaxBand" || key === "epc") {
      const letter = normaliseForField(key, text);
      const hit = options.find((o) => o === letter);
      if (hit) return hit;
    }
    return null;
  }

  return normaliseForField(key, text);
}
