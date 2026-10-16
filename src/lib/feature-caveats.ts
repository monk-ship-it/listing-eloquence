/**
 * Deterministic planning / building-regulations caveats for key features.
 *
 * When the agent's planning or disclosure facts say a structure (lean-to,
 * conservatory, extension…) has no known approval, every key feature that
 * names that structure — including synonyms and compound bullets — must carry
 * the caveat. The caveat wording is derived from the supplied clause only:
 * a negative must sit in the same clause as the approval it governs, generic
 * "approval" stays generic, and positive approvals add nothing. When the
 * supplied wording can't be tied to one structure, no caveat is asserted —
 * the structure is taken out of the bullets and flagged for human review.
 * Material Information always keeps the verbatim disclosures.
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

const NEGATIVE_RE =
  /\b(no|not|none|unaware|unknown|without|lacks?|lacking|never|unapproved|retrospective|unclear|uncertain|unconfirmed)\b/i;
const PLANNING_RE = /\bplanning\b/i;
const REGS_RE = /\bbuilding reg(ulation)?s?\b|\bbuilding control\b|\bcompletion certificate\b/i;
const GENERIC_RE = /\b(approv\w*|consent|permission)\b/i;

type Kind = "planning" | "regs" | "both" | "generic";

const KIND_TEXT: Record<Kind, string> = {
  planning: "no known planning approval",
  regs: "no known building regulations approval",
  both: "no known planning or building regulations approval",
  generic: "no known approval",
};

/** Kept for callers that only need "does this bullet mention approval at all". */
export const CAVEAT_RE = /approv|building reg|planning|consent|regularis|indemnity/i;

export interface RequiredCaveat {
  key: string;
  re: RegExp;
  kind: Kind;
  caveat: string;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Clauses: split on commas, "but", "however", "whereas" and on "and" unless it joins approval types. */
function clauses(s: string): string[] {
  return s
    .split(/\s*[,;:()]\s*|\s+(?:but|however|whereas|although|though)\s+|\s+and\s+(?!(?:building|planning)\b)/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Negated approval kinds stated in one clause, or null. */
function negatedKind(c: string): Kind | null {
  if (!NEGATIVE_RE.test(c)) return null;
  const p = PLANNING_RE.test(c);
  const r = REGS_RE.test(c);
  if (p && r) return "both";
  if (p) return "planning";
  if (r) return "regs";
  if (GENERIC_RE.test(c)) return "generic";
  return null;
}

const merge = (a: Kind, b: Kind): Kind => {
  if (a === b) return a;
  if (a === "generic") return b;
  if (b === "generic") return a;
  return "both";
};

const structuresIn = (t: string) => STRUCTURES.filter((st) => st.re.test(t));

interface Analysis {
  required: RequiredCaveat[];
  review: string[];
}

function analyse(input: Pick<ListingInput, "planning" | "disclosures">): Analysis {
  const src = [input.planning ?? "", input.disclosures ?? ""].join("\n");
  const found = new Map<string, { st: Structure; kind: Kind }>();
  const review = new Set<string>();
  for (const s of sentences(src)) {
    const sentStructs = structuresIn(s);
    for (const c of clauses(s)) {
      const kind = negatedKind(c);
      if (!kind) continue;
      let targets = structuresIn(c);
      if (!targets.length) {
        if (sentStructs.length === 1) targets = sentStructs;
        else {
          // Negative approval can't be tied to one structure: assert nothing, flag.
          for (const st of sentStructs) review.add(st.key);
          continue;
        }
      }
      for (const st of targets) {
        const prev = found.get(st.key);
        found.set(st.key, { st, kind: prev ? merge(prev.kind, kind) : kind });
      }
    }
  }
  const required = [...found.values()].map(({ st, kind }) => ({
    key: st.key,
    re: st.re,
    kind,
    caveat: KIND_TEXT[kind],
  }));
  return { required, review: [...review].filter((k) => !found.has(k)) };
}

/** Structures whose supplied facts say approval is missing/unknown. */
export function requiredCaveats(input: Pick<ListingInput, "planning" | "disclosures">): RequiredCaveat[] {
  return analyse(input).required;
}

/** Structures with ambiguous approval wording — needs a human to check. */
export function caveatsForReview(input: Pick<ListingInput, "planning" | "disclosures">): string[] {
  return analyse(input).review;
}

/** Does the bullet's own caveat state the required negative substance? */
function satisfies(f: string, kind: Kind): boolean {
  let have: Kind | null = null;
  for (const c of clauses(f)) {
    const k = negatedKind(c);
    if (k) have = have ? merge(have, k) : k;
  }
  if (!have) return false;
  if (kind === "generic") return true;
  if (have === "both") return true;
  return have === kind;
}

/** A bullet is safe for a structure only if it names that one structure and carries its caveat. */
function bulletOk(f: string, r: RequiredCaveat, all: Structure[]): boolean {
  const named = all.filter((st) => st.re.test(f));
  return named.length === 1 && satisfies(f, r.kind);
}

/** Bullets that name a caveated (or review-flagged) structure without the right caveat. */
export function missingCaveats(
  features: string[],
  input: Pick<ListingInput, "planning" | "disclosures">,
): { feature: string; key: string }[] {
  const { required, review } = analyse(input);
  const flagged = STRUCTURES.filter((st) => review.includes(st.key));
  const all = [...required.map((r) => STRUCTURES.find((s) => s.key === r.key)!), ...flagged];
  const out: { feature: string; key: string }[] = [];
  for (const f of features) {
    for (const r of required) if (r.re.test(f) && !bulletOk(f, r, all)) out.push({ feature: f, key: r.key });
    for (const st of flagged) if (st.re.test(f)) out.push({ feature: f, key: st.key });
  }
  return out;
}

const MAX = 80;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const stripParen = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();

/**
 * Every bullet naming a caveated structure ends up with exactly one structure
 * and the correct caveat. Compound bullets are split; parts that can't be
 * caveated within 80 characters (or at 10 bullets), or that name a
 * review-flagged structure, are dropped from the bullets — the description and
 * Material Information still disclose them verbatim.
 */
export function applyFeatureCaveats(
  features: string[],
  input: Pick<ListingInput, "planning" | "disclosures">,
): string[] {
  const { required, review } = analyse(input);
  if (!required.length && !review.length) return features;
  const flagged = STRUCTURES.filter((st) => review.includes(st.key));
  const all = [...required.map((r) => STRUCTURES.find((s) => s.key === r.key)!), ...flagged];
  const hit = (t: string) => all.filter((st) => st.re.test(t));

  const out: string[] = [];
  const extra: string[] = [];
  for (const f of features) {
    const named = hit(f);
    if (!named.length) {
      out.push(f);
      continue;
    }
    if (named.length === 1) {
      const r = required.find((x) => x.key === named[0].key);
      if (r && satisfies(f, r.kind)) {
        out.push(f);
        continue;
      }
      if (r) {
        const whole = `${stripParen(f)} (${r.caveat})`;
        if (whole.length <= MAX) {
          out.push(whole);
          continue;
        }
      }
    }
    // Split: keep unaffected parts, give each single-structure part its own caveat.
    const parts = stripParen(f)
      .split(/\s*,\s*|\s*;\s*|\s+and\s+|\s+with\s+|\s+&\s+|\s+plus\s+/i)
      .filter(Boolean);
    const rest = parts.filter((p) => !hit(p).length);
    if (rest.length) out.push(cap(rest.join(" and ")));
    for (const p of parts) {
      const ns = hit(p);
      if (ns.length !== 1) continue; // several structures in one fragment → drop
      const r = required.find((x) => x.key === ns[0].key);
      if (!r) continue; // review-flagged → no legal assertion; drop
      const own = `${cap(p)} (${r.caveat})`;
      if (own.length <= MAX) extra.push(own);
    }
  }
  for (const e of extra) if (out.length < 10 && !out.includes(e)) out.push(e);
  return out;
}
