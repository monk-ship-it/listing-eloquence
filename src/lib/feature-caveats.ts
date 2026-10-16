/**
 * Deterministic planning / building-regulations caveats for key features.
 *
 * When the agent's planning or disclosure facts say a structure (lean-to,
 * conservatory, extension…) has no known approval, every key feature that
 * names that structure — including synonyms and compound bullets — must carry
 * the caveat. The caveat wording is derived from the supplied sentence only
 * (planning / building regulations / both); nothing is invented.
 */
import type { ListingInput } from "./listing-types";

interface Structure {
  key: string;
  re: RegExp;
}

const STRUCTURES: Structure[] = [
  { key: "lean-to", re: /\blean[\s-]?to\b/i },
  { key: "conservatory", re: /\b(conservatory|orangery|sun ?room)\b/i },
  { key: "loft conversion", re: /\bloft (conversion|room)\b|\bconverted loft\b/i },
  { key: "garage conversion", re: /\bgarage conversion\b|\bconverted garage\b/i },
  { key: "extension", re: /\b(extension|extended)\b/i },
  { key: "outbuilding", re: /\b(outbuilding|outhouse|garden (room|office|studio)|cabin|annexe|annex)\b/i },
  { key: "porch", re: /\bporch\b/i },
  { key: "dormer", re: /\bdormer\b/i },
];

/** A caveat already present in a bullet. */
export const CAVEAT_RE = /approv|building reg|planning|consent|regularis|indemnity/i;
const NEGATIVE_RE =
  /\b(no|not|none|unaware|unknown|without|lacks?|never|unapproved|retrospective|unclear|uncertain)\b/i;
const PLANNING_RE = /\bplanning\b/i;
const REGS_RE = /\bbuilding reg(ulation)?s?\b|\bbuilding control\b|\bcompletion certificate\b/i;

export interface RequiredCaveat {
  key: string;
  re: RegExp;
  caveat: string;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Structures whose supplied facts say approval is missing/unknown. */
export function requiredCaveats(input: Pick<ListingInput, "planning" | "disclosures">): RequiredCaveat[] {
  const src = [input.planning ?? "", input.disclosures ?? ""].join("\n");
  const out: RequiredCaveat[] = [];
  for (const s of sentences(src)) {
    const planning = PLANNING_RE.test(s);
    const regs = REGS_RE.test(s) || /\bapproval\b/i.test(s);
    if (!(planning || regs) || !NEGATIVE_RE.test(s)) continue;
    const kind =
      planning && REGS_RE.test(s)
        ? "planning or building regulations approval"
        : planning
          ? "planning approval"
          : "building regulations approval";
    for (const st of STRUCTURES) {
      if (st.re.test(s) && !out.some((o) => o.key === st.key))
        out.push({ key: st.key, re: st.re, caveat: `no known ${kind}` });
    }
  }
  return out;
}

/** Bullets that name a caveated structure without any caveat. */
export function missingCaveats(
  features: string[],
  input: Pick<ListingInput, "planning" | "disclosures">,
): { feature: string; key: string }[] {
  const req = requiredCaveats(input);
  const out: { feature: string; key: string }[] = [];
  for (const f of features)
    for (const r of req) if (r.re.test(f) && !CAVEAT_RE.test(f)) out.push({ feature: f, key: r.key });
  return out;
}

const MAX = 80;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Add the caveat to every uncaveated bullet that names the structure. If the
 * bullet would exceed 80 characters, split a compound bullet so the structure
 * gets its own caveated bullet (or, at 10 bullets, is dropped from the bullet
 * — the description and Material Information still disclose it).
 */
export function applyFeatureCaveats(
  features: string[],
  input: Pick<ListingInput, "planning" | "disclosures">,
): string[] {
  const req = requiredCaveats(input);
  if (!req.length) return features;
  let out = [...features];
  for (const r of req) {
    const next: string[] = [];
    const extra: string[] = [];
    for (const f of out) {
      if (!r.re.test(f) || CAVEAT_RE.test(f)) {
        next.push(f);
        continue;
      }
      const whole = `${f} (${r.caveat})`;
      if (whole.length <= MAX) {
        next.push(whole);
        continue;
      }
      const parts = f.split(/\s*,\s*|\s*;\s*|\s+and\s+|\s+with\s+|\s+&\s+/).filter(Boolean);
      const mine = parts.filter((p) => r.re.test(p));
      const rest = parts.filter((p) => !r.re.test(p));
      if (rest.length) next.push(cap(rest.join(" and ")));
      const own = `${cap(mine.join(" and ") || r.key)} (${r.caveat})`;
      if (own.length <= MAX) extra.push(own);
    }
    out = next;
    for (const e of extra) if (out.length < 10 && !out.some((x) => x === e)) out.push(e);
  }
  return out;
}
