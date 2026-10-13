import type { ListingInput } from "./listing-types";

export type DictateMode = "replace" | "append-comma" | "append-semicolon" | "append-space";

/** Every free-text ListingInput key (everything except voice/market). */
export type TextFieldKey = Exclude<keyof ListingInput, "voice" | "market">;

export interface FieldDef {
  key: TextFieldKey;
  label: string;
  placeholder: string;
  kind: "input" | "textarea";
  rows?: number;
  section: "voice" | "details";
  dictateMode: DictateMode;
  /** Included in "Fill the form from my voice note". */
  extractable: boolean;
  /** Consecutive defs sharing a group render side by side in one grid row. */
  group?: string;
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
  {
    key: "address",
    label: "Address / location",
    placeholder: "12 Park Avenue, Harrogate, HG1",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
  },
  {
    key: "propertyType",
    label: "Property type",
    placeholder: "Victorian semi-detached house",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "type",
  },
  {
    key: "yearBuilt",
    label: "Year built",
    placeholder: "1901",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "type",
  },
  {
    key: "bedrooms",
    label: "Bedrooms",
    placeholder: "4",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "rooms",
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    placeholder: "2",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "rooms",
  },
  {
    key: "receptions",
    label: "Receptions",
    placeholder: "2",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "rooms",
  },
  {
    key: "tenure",
    label: "Tenure",
    placeholder: "Freehold",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "tenure",
  },
  {
    key: "price",
    label: "Asking price (£)",
    placeholder: "525,000",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "tenure",
  },
  {
    key: "priceQualifier",
    label: "Price qualifier",
    placeholder: "Guide Price / OIEO",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "qualifier",
  },
  {
    key: "leaseYears",
    label: "Lease remaining (yrs)",
    placeholder: "If leasehold",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "qualifier",
  },
  {
    key: "keyFeatures",
    label: "Key features",
    placeholder: "Open-plan kitchen, log burner, south-facing garden…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-semicolon",
    extractable: true,
  },
  {
    key: "dimensions",
    label: "Room dimensions",
    placeholder: "Living room 5.2m x 4.1m…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-semicolon",
    extractable: true,
  },
  {
    key: "epc",
    label: "EPC rating",
    placeholder: "C",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "energy",
  },
  {
    key: "councilTaxBand",
    label: "Council Tax band",
    placeholder: "D",
    kind: "input",
    section: "details",
    dictateMode: "replace",
    extractable: true,
    group: "energy",
  },
  {
    key: "outsideSpace",
    label: "Outside space / garden",
    placeholder: "Landscaped rear garden, patio",
    kind: "input",
    section: "details",
    dictateMode: "append-comma",
    extractable: true,
  },
  {
    key: "parking",
    label: "Parking",
    placeholder: "Driveway, garage",
    kind: "input",
    section: "details",
    dictateMode: "append-comma",
    extractable: true,
    group: "services",
  },
  {
    key: "heating",
    label: "Heating",
    placeholder: "Gas central heating",
    kind: "input",
    section: "details",
    dictateMode: "append-comma",
    extractable: true,
    group: "services",
  },
  {
    key: "utilities",
    label: "Utilities / broadband",
    placeholder: "Mains services, Ultrafast broadband",
    kind: "input",
    section: "details",
    dictateMode: "append-comma",
    extractable: true,
  },
  {
    key: "nearby",
    label: "Nearby (schools, transport, amenities)",
    placeholder: "Outstanding primary, station 0.5 miles…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "periodFeatures",
    label: "Period / character features",
    placeholder: "Original cornicing, sash windows…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "areaHighlights",
    label: "Area highlights",
    placeholder: "Vibrant market town, riverside walks",
    kind: "input",
    section: "details",
    dictateMode: "append-comma",
    extractable: true,
  },
  {
    key: "disclosures",
    label: "Disclosures / condition notes",
    placeholder: "Recent rewire; survey available…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "showingNotes",
    label: "Viewing / access notes (kept out of the listing)",
    placeholder: "By appointment; key with branch…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "mediaNotes",
    label: "Media / photo / floor-plan notes",
    placeholder: "Photos + floor plan booked…",
    kind: "textarea",
    rows: 2,
    section: "details",
    dictateMode: "append-space",
    extractable: true,
  },
  {
    key: "targetAudience",
    label: "Target audience",
    placeholder: "Growing families, professionals",
    kind: "input",
    section: "details",
    dictateMode: "append-comma",
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
