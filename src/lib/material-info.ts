/**
 * Deterministic Material Information — no AI. Builds the plain-text block
 * agents paste under a description, and the pre-publish checklist.
 * Structure follows the (withdrawn, still used) NTSELAT Parts A/B/C checklist;
 * the legal duty is the DMCC Act 2024 (no omitting material information).
 */
import type { ListingInput } from "./listing-types";
import { FIELD_BY_KEY, isLeasehold, isSharedOwnership, type TextFieldKey } from "./listing-fields";

const BANNED_VALUES =
  /^(ask agent|tbc|tba|to be confirmed|poa|price on application|n\/a|unknown)$/i;

function val(input: ListingInput, key: keyof ListingInput): string {
  const v = input[key];
  if (typeof v !== "string") return "";
  const t = v.trim();
  return BANNED_VALUES.test(t) ? "" : t;
}

/** "250" → "£250"; leaves text that already has £ or words alone. */
export function money(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (/^£/.test(t)) return t;
  if (/^\d[\d,]*(\.\d+)?$/.test(t)) {
    const n = Number(t.replace(/,/g, ""));
    return `£${Number.isInteger(n) ? n.toLocaleString("en-GB") : n.toFixed(2)}`;
  }
  return t;
}

function noCapped(s: string): string {
  return s
    .replace(/\b(is\s+)?capped\b(\s+at\s+[^,;)]*)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}

/** Part C answer → printable text ("None known" / details). */
function partC(v: string): string {
  if (!v) return "";
  if (/^none known$/i.test(v)) return "None known";
  const d = v.replace(/^yes\s*[–\-:]?\s*/i, "").trim();
  return d || "Yes – details to follow";
}

export const PART_C_KEYS: TextFieldKey[] = [
  "buildingSafety",
  "restrictions",
  "rightsEasements",
  "flooding",
  "coastalErosion",
  "planning",
  "accessibility",
  "coalfieldMining",
];

/** Compact block, one line per supplied item. Never prints placeholders. */
export function buildMaterialInfoBlock(input: ListingInput): string {
  const lines: string[] = [];
  const price = val(input, "price");
  const qualifier = val(input, "priceQualifier");
  if (price) lines.push(`Price: ${[qualifier, money(price)].filter(Boolean).join(" ")}`);

  if (isSharedOwnership(input)) {
    const share = val(input, "sharePercent").replace(/%$/, "");
    const rent = val(input, "rent");
    const fmv = val(input, "fullMarketValue");
    const parts = [
      share ? `${share}% share` : "",
      rent ? `rent ${money(rent)} per month on the unsold share` : "",
      fmv ? `full market value ${money(fmv)}` : "",
    ].filter(Boolean);
    if (parts.length) lines.push(`Shared ownership: ${parts.join(" · ")}`);
  }

  const tenure = val(input, "tenure");
  if (tenure) {
    const years = val(input, "leaseYears");
    lines.push(
      `Tenure: ${tenure}${isLeasehold(input) && years ? ` · ${years.replace(/\s*years?$/i, "")} years remaining` : ""}`,
    );
  }
  if (isLeasehold(input)) {
    const gr = val(input, "groundRent");
    const review = noCapped(val(input, "groundRentReview"));
    if (gr)
      lines.push(`Ground rent: ${noCapped(money(gr))} per year${review ? ` (${review})` : ""}`);
    const sc = val(input, "serviceCharge");
    const period = val(input, "serviceChargePeriod");
    if (sc) lines.push(`Service charge: ${money(sc)} per year${period ? ` (${period})` : ""}`);
    const reserve = val(input, "reserveFund");
    if (reserve) lines.push(`Reserve fund / event fees: ${reserve}`);
  }

  const band = val(input, "councilTaxBand");
  const la = val(input, "localAuthority");
  if (band) {
    const label = /^[A-I]$/.test(band) ? `Band ${band}` : band;
    lines.push(`Council Tax: ${label}${la ? ` (${la})` : ""}`);
  }
  const epc = val(input, "epc");
  if (epc) lines.push(`EPC rating: ${epc}`);

  const construction = val(input, "construction");
  const cDetails = val(input, "constructionDetails");
  if (construction || cDetails) {
    lines.push(`Construction: ${[construction, cDetails].filter(Boolean).join(" – ")}`);
  }

  const water = val(input, "water");
  const metered = val(input, "waterMetered");
  const supplies = [
    val(input, "electricity") && `Electricity: ${val(input, "electricity")}`,
    water &&
      `Water: ${water}${metered === "Yes" ? " (metered)" : metered === "No" ? " (not metered)" : ""}`,
    val(input, "sewerage") && `Sewerage: ${val(input, "sewerage")}`,
    val(input, "heating") && `Heating: ${val(input, "heating")}`,
  ].filter(Boolean);
  if (supplies.length) lines.push(supplies.join(" · "));

  const bb = val(input, "broadband");
  const speed = val(input, "broadbandSpeed");
  const comms = [
    (bb || speed) && `Broadband: ${[bb, speed].filter(Boolean).join(", ")}`,
    val(input, "mobileSignal") && `Mobile signal: ${val(input, "mobileSignal")}`,
  ].filter(Boolean);
  if (comms.length) lines.push(comms.join(" · "));
  else if (val(input, "utilities")) lines.push(`Utilities: ${val(input, "utilities")}`);

  const parking = val(input, "parking");
  if (parking) lines.push(`Parking: ${parking}`);

  for (const k of PART_C_KEYS) {
    const v = partC(val(input, k));
    if (v) lines.push(`${FIELD_BY_KEY[k].label}: ${v}`);
  }
  const issues = val(input, "disclosures");
  if (issues) lines.push(`Known issues: ${issues}`);
  return lines.join("\n");
}

export type Severity = "block" | "warn" | "confirm";

export interface CheckItem {
  id: string;
  /** Field to jump to. */
  field: TextFieldKey | "sellerApproved";
  label: string;
  severity: Severity;
  message: string;
  ok: boolean;
  /** Plain-English question for the seller (WARN/CONFIRM only). */
  question?: string;
}

const SELLER_QUESTIONS: Partial<Record<TextFieldKey, string>> = {
  construction:
    "Is the property of standard construction (e.g. brick or stone under a tiled or slate roof), or something else such as timber frame?",
  electricity:
    "Is the electricity supply from the mains? Are there solar panels or any other source?",
  water: "Is the water supply from the mains, and is it on a meter?",
  sewerage: "Is the property on mains drainage, or a septic tank, cesspit or treatment plant?",
  heating:
    "How is the property heated (for example gas central heating, oil, heat pump or electric)?",
  broadband: "What broadband is connected (for example full fibre, fibre to the cabinet or cable)?",
  mobileSignal: "How is the mobile signal at the property, indoors and outdoors?",
  parking: "What parking is there — driveway, garage, allocated space, permit or on-street?",
  buildingSafety:
    "Are you aware of any building safety issues, such as cladding or unsafe materials?",
  restrictions:
    "Is the property listed or in a conservation area, or subject to tree preservation orders or restrictive covenants?",
  rightsEasements:
    "Are there any rights of way, shared accesses or other rights and easements over the property?",
  flooding: "Has the property ever flooded, or are you aware of any flood risk?",
  coastalErosion: "Are you aware of any coastal erosion risk?",
  planning:
    "Are there any planning permissions or applications for the property or the immediate area?",
  accessibility:
    "Does the property have any accessibility features, such as step-free access, a ramp or a lift?",
  coalfieldMining: "Is the property in a coalfield or mining area, as far as you know?",
};

/** Pre-publish checklist. BLOCK = must fix; WARN = Part B blank; CONFIRM = Part C unanswered. */
export function checkMaterialInfo(input: ListingInput): CheckItem[] {
  const items: CheckItem[] = [];
  const add = (
    field: CheckItem["field"],
    severity: Severity,
    ok: boolean,
    message: string,
    label?: string,
  ) =>
    items.push({
      id: `${severity}-${field}`,
      field,
      label: label ?? (field === "sellerApproved" ? "Seller approval" : FIELD_BY_KEY[field].label),
      severity,
      ok,
      message,
      question: field !== "sellerApproved" ? SELLER_QUESTIONS[field] : undefined,
    });

  add(
    "price",
    "block",
    !!val(input, "price") && !!val(input, "priceQualifier"),
    "Add the price and its qualifier — never POA.",
    "Price & qualifier",
  );
  add("tenure", "block", !!val(input, "tenure"), "Add the tenure.");
  add("councilTaxBand", "block", !!val(input, "councilTaxBand"), "Add the Council Tax band.");
  add("epc", "block", !!val(input, "epc"), "Add the EPC rating (or Exempt / Commissioned).");
  if (isLeasehold(input)) {
    add("leaseYears", "block", !!val(input, "leaseYears"), "Add the years remaining on the lease.");
    add("groundRent", "block", !!val(input, "groundRent"), "Add the ground rent (£ per year).");
    add(
      "serviceCharge",
      "block",
      !!val(input, "serviceCharge"),
      "Add the service charge (£ per year).",
    );
  }
  if (isSharedOwnership(input)) {
    add("sharePercent", "block", !!val(input, "sharePercent"), "Add the share percentage offered.");
    add("rent", "block", !!val(input, "rent"), "Add the rent on the unsold share.");
  }
  add(
    "sellerApproved",
    "block",
    input.sellerApproved === true,
    "Particulars must be agreed with the seller or marked draft — TPO Code 7j.",
  );

  const legacyUtilities = !!val(input, "utilities");
  for (const k of [
    "construction",
    "electricity",
    "water",
    "sewerage",
    "heating",
    "broadband",
    "mobileSignal",
    "parking",
  ] as TextFieldKey[]) {
    const filled =
      !!val(input, k) ||
      (k === "construction" && !!val(input, "constructionDetails")) ||
      (k === "broadband" && !!val(input, "broadbandSpeed"));
    add(
      k,
      "warn",
      filled || (legacyUtilities && ["electricity", "water", "broadband"].includes(k)),
      "Not stated — buyers expect this.",
    );
  }

  for (const k of PART_C_KEYS) {
    add(k, "confirm", !!val(input, k), 'Unanswered — choose "None known" or add details.');
  }
  return items;
}

export function summariseChecks(items: CheckItem[]) {
  const done = items.filter((i) => i.ok).length;
  const open = items.filter((i) => !i.ok);
  return {
    done,
    total: items.length,
    mustFix: open.filter((i) => i.severity === "block").length,
    open: [
      ...open.filter((i) => i.severity === "block"),
      ...open.filter((i) => i.severity === "warn"),
      ...open.filter((i) => i.severity === "confirm"),
    ],
  };
}
