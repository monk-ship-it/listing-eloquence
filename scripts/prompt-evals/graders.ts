/** Deterministic graders for eval cases. Each returns Finding[]. */
import type { ListingInput, ListingOutput } from "../../src/lib/listing-types";
import { unwrapSellerEmail } from "../../src/lib/listing-types";
import { isLeasehold, isSharedOwnership, EXTRACTABLE_FIELDS } from "../../src/lib/listing-fields";
import {
  BANNED_PHRASES,
  factCheckPack,
  normaliseText,
  privateLeakFlags,
  publicInputsToText,
} from "../../src/lib/fact-check";
import { wordsToNumber } from "../../src/lib/dictation-normalise";
import type { ExtractResult } from "../../src/lib/extract-filter";
import type { EvalCase, Finding } from "./types";

export interface GradePack {
  headline: string;
  listing: string;
  summary: string;
  keyFeatures: string[];
  emailBlast: {
    subjectLines: string[];
    previewText: string;
    headline: string;
    body: string;
    callToAction?: string;
    personalMessage?: string;
  } | null;
  sellerEmail: { body: string } | null;
  social: { platform: string; caption: string; hashtags: string[] }[];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const strs = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Lenient view of raw tool output (before validate* patches it). */
export function packFromRaw(core: unknown, mkt: unknown): GradePack {
  const c = (core ?? {}) as Record<string, unknown>;
  const m0 = (mkt ?? {}) as Record<string, unknown>;
  const un = (v: unknown) => {
    if (typeof v !== "string" || !/^\s*[[{]/.test(v)) return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  };
  const m = {
    ...m0,
    emailBlast: un(m0.emailBlast),
    sellerEmail: unwrapSellerEmail(m0.sellerEmail),
    social: un(m0.social),
  };
  const e =
    m.emailBlast && typeof m.emailBlast === "object"
      ? (m.emailBlast as Record<string, unknown>)
      : null;
  const se =
    m.sellerEmail && typeof m.sellerEmail === "object"
      ? (m.sellerEmail as Record<string, unknown>)
      : null;
  return {
    headline: str(c.headline),
    listing: str(c.listing),
    summary: str(c.summary),
    keyFeatures: strs(c.keyFeatures),
    emailBlast: e
      ? {
          subjectLines: strs(e.subjectLines),
          previewText: str(e.previewText),
          headline: str(e.headline),
          body: str(e.body),
          callToAction: str(e.callToAction),
          personalMessage: str(e.personalMessage),
        }
      : null,
    sellerEmail: se ? { body: str(se.body) } : null,
    social: (Array.isArray(m.social) ? m.social : []).map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      return { platform: str(q.platform), caption: str(q.caption), hashtags: strs(q.hashtags) };
    }),
  };
}

export function packFromFinal(o: ListingOutput): GradePack {
  return {
    headline: o.headline,
    listing: o.listing,
    summary: o.summary,
    keyFeatures: o.keyFeatures,
    emailBlast: o.emailBlast,
    sellerEmail: o.sellerEmail ? { body: o.sellerEmail.body } : null,
    social: o.social.map((p) => ({ ...p, hashtags: p.hashtags ?? [] })),
  };
}

const socialText = (p: GradePack["social"][number]) => `${p.caption} ${p.hashtags.join(" ")}`;

/** Text blocks for a section path (see EvalCase docs). */
export function sectionTexts(pack: GradePack, path: string): string[] {
  const e = pack.emailBlast;
  switch (path) {
    case "headline":
      return [pack.headline];
    case "summary":
      return [pack.summary];
    case "listing":
      return [pack.listing];
    case "keyFeatures":
      return [pack.keyFeatures.join("\n")];
    case "emailBlast.subjectLines":
      return e ? [e.subjectLines.join("\n")] : [""];
    case "emailBlast.previewText":
      return [e?.previewText ?? ""];
    case "emailBlast.body":
      return [e?.body ?? ""];
    case "emailBlast.headline":
      return [e?.headline ?? ""];
    case "emailBlast.personalMessage":
      return [e?.personalMessage ?? ""];
    case "sellerEmail.body":
      return [pack.sellerEmail?.body ?? ""];
    case "social.*":
      return pack.social.length ? pack.social.map(socialText) : [""];
  }
  if (path.startsWith("social.")) {
    const p = pack.social.find((s) => s.platform.toLowerCase() === path.slice(7).toLowerCase());
    return [p ? socialText(p) : ""];
  }
  throw new Error(`Unknown section path: ${path}`);
}

/** All public outputs (everything except the seller email). */
export function publicBlocks(pack: GradePack): [string, string][] {
  const e = pack.emailBlast;
  return [
    ["headline", pack.headline],
    ["listing", pack.listing],
    ["summary", pack.summary],
    ...pack.keyFeatures.map((f): [string, string] => ["keyFeatures", f]),
    ...(e
      ? ([
          ...e.subjectLines.map((s): [string, string] => ["emailBlast.subjectLines", s]),
          ["emailBlast.previewText", e.previewText],
          ["emailBlast.headline", e.headline],
          ["emailBlast.body", e.body],
          ["emailBlast.callToAction", e.callToAction ?? ""],
          ["emailBlast.personalMessage", e.personalMessage ?? ""],
        ] as [string, string][])
      : []),
    ...pack.social.map((p): [string, string] => [`social.${p.platform}`, socialText(p)]),
  ];
}

const norm = (s: string) => normaliseText(s).replace(/[\u00a0]/g, " ");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Case-insensitive, word-boundary aware (no match inside a longer word or number). */
export function termRe(term: string): RegExp {
  return new RegExp(`(?<![\\w])${esc(norm(term))}(?![\\w])(?![,.]\\d)`, "i");
}
const has = (text: string, term: string) => norm(text).includes(norm(term));
const snippet = (text: string, term: string) => {
  const t = norm(text);
  const i = t.search(termRe(term));
  return i < 0
    ? undefined
    : `…${text.slice(Math.max(0, i - 50), i + term.length + 50).replace(/\n/g, " ")}…`;
};

// ---------- graders ----------

export function gradeFactCheck(pack: GradePack, input: ListingInput): Finding[] {
  const flags = factCheckPack(
    { ...pack, sellerEmail: pack.sellerEmail ?? undefined },
    publicInputsToText(input),
  );
  return flags
    .filter((f) => f.kind === "not-in-notes")
    .map((f) => ({
      grader: "factCheck",
      severity: f.rule === "name" ? ("warn" as const) : ("fail" as const),
      message: `"${f.term}" (${f.rule ?? "fact"}) in ${f.section} is not in the inputs`,
      text: f.term,
    }));
}

export function gradeBanned(pack: GradePack, input: ListingInput): Finding[] {
  const supplied = norm(publicInputsToText(input));
  const out: Finding[] = [];
  for (const [section, text] of publicBlocks(pack)) {
    for (const p of BANNED_PHRASES) {
      if (!termRe(p).test(norm(text))) continue;
      if ((p === "luxury" || p === "luxurious") && supplied.includes(p)) continue;
      out.push({
        grader: "banned",
        severity: "fail",
        message: `Banned phrase "${p}" in ${section}`,
        text: snippet(text, p),
      });
    }
  }
  return out;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const MI_LINE = "Full material information is on the property listing.";

export function gradeLimits(pack: GradePack, input: ListingInput): Finding[] {
  const out: Finding[] = [];
  const f = (message: string, text?: string, severity: "fail" | "warn" = "fail") =>
    out.push({ grader: "limits", severity, message, text });
  if (pack.headline.length > 70) f(`Headline ${pack.headline.length} > 70 chars`, pack.headline);
  if (!pack.headline) f("Headline missing");
  const s = pack.summary;
  if (s.length > 250) f(`Strapline ${s.length} > 250 chars`, s);
  const first = s.trim().split(/\s+/)[0] ?? "";
  if (/^\d/.test(s.trim())) f("Strapline opens with a digit", s.slice(0, 60));
  else if (
    input.bedrooms &&
    wordsToNumber(first.toLowerCase().replace(/[^a-z-]/g, "")) === Number(input.bedrooms)
  )
    f("Strapline opens with the bedroom count", s.slice(0, 60));
  const kf = pack.keyFeatures;
  if (kf.length < 6 || kf.length > 10) f(`${kf.length} key features (need 6–10)`);
  for (const b of kf) {
    if (b.length > 80) f(`Key feature ${b.length} > 80 chars`, b);
    if (/\.\s*$/.test(b)) f("Key feature ends with a full stop", b);
  }
  const e = pack.emailBlast;
  if (!e) f("Email Blast missing");
  else {
    if (e.subjectLines.length !== 3) f(`${e.subjectLines.length} subject lines (need 3)`);
    for (const sl of e.subjectLines)
      if (sl.length > 60) f(`Subject line ${sl.length} > 60 chars`, sl);
    if (e.previewText.length > 90)
      f(`Preview text ${e.previewText.length} > 90 chars`, e.previewText);
    const paras = e.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const counted = paras.filter((p) => p !== MI_LINE).length;
    if (counted < 2 || counted > 4) f(`Email body has ${counted} paragraphs (need 2–4)`);
    if (!e.body.trim().endsWith(MI_LINE))
      f("Email body doesn't end with the material-information line", e.body.slice(-120));
  }
  const se = pack.sellerEmail?.body ?? "";
  if (!se) f("Seller email missing");
  else {
    const n = words(se);
    if (n < 150 || n > 300) f(`Seller email ${n} words (need 150–300)`);
    if (!se.trim().startsWith("Dear [Seller name],"))
      f('Seller email doesn\'t start "Dear [Seller name],"', se.slice(0, 60));
    if (!se.trim().endsWith("[Your name, branch, phone]"))
      f('Seller email doesn\'t end with "[Your name, branch, phone]"', se.slice(-80));
  }
  if (pack.social.length !== 3) f(`${pack.social.length} social posts (need 3)`);
  const x = pack.social.find((p) => p.platform === "X");
  if (x) {
    const len =
      `${x.caption}\n\n${x.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`.trim().length;
    if (len > 280) f(`X post ${len} > 280 chars incl. hashtags`, x.caption);
  }
  return out;
}

const fmtMoney = (v: string) => {
  const d = v.replace(/[£,\s]/g, "");
  return /^\d+(\.\d+)?$/.test(d) ? `£${Number(d).toLocaleString("en-GB")}` : v.trim();
};

const STOP = new Set(
  "the and with that this from have been were which there their into only also when what over under about some".split(
    " ",
  ),
);
function clauseCovered(clause: string, text: string): boolean {
  const toks = norm(clause)
    .replace(/[^a-z0-9£% ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  if (!toks.length) return true;
  const hay = norm(text);
  return toks.filter((w) => hay.includes(w)).length / toks.length >= 0.6;
}

export function gradeMaterialInfo(pack: GradePack, input: ListingInput): Finding[] {
  const out: Finding[] = [];
  const f = (severity: "fail" | "warn", message: string, text?: string) =>
    out.push({ grader: "materialInfo", severity, message, text });
  const targets: [string, string][] = [
    ["listing", pack.listing],
    ["emailBlast.body", pack.emailBlast?.body ?? ""],
  ];
  const lease = isLeasehold(input);
  for (const [name, text] of targets) {
    if (input.price) {
      const phrase = `${input.priceQualifier ? `${input.priceQualifier} ` : ""}${fmtMoney(input.price)}`;
      if (!has(text, phrase)) f("fail", `${name}: missing "${phrase}"`);
    }
    if (input.tenure && !has(text, input.tenure))
      f("fail", `${name}: missing tenure "${input.tenure}"`);
    if (input.councilTaxBand) {
      const ok =
        /council tax/i.test(text) &&
        new RegExp(`\\bband\\s*${esc(input.councilTaxBand)}\\b`, "i").test(text);
      if (!ok && !has(text, input.councilTaxBand))
        f("fail", `${name}: missing council tax band ${input.councilTaxBand}`);
      else if (!ok)
        f(
          "warn",
          `${name}: council tax band ${input.councilTaxBand} not stated as "council tax band"`,
        );
    }
    if (input.epc) {
      const ok = new RegExp(`\\bEPC\\b[^.\\n]{0,30}\\b${esc(input.epc)}\\b`, "i").test(text);
      if (!ok) f("fail", `${name}: missing EPC ${input.epc}`);
    }
    if (lease) {
      const items: [string, string][] = [];
      if (input.leaseYears)
        items.push(["lease years", `${input.leaseYears.replace(/[^\d]/g, "")} years`]);
      if (input.groundRent) items.push(["ground rent", "ground rent"]);
      if (input.serviceCharge) items.push(["service charge", "service charge"]);
      const paras = text.split(/\n\s*\n/);
      const leasePara = paras.find((p) => /leasehold|share of freehold/i.test(p)) ?? "";
      for (const [label, term] of items) {
        if (!has(text, term)) f("fail", `${name}: missing ${label} ("${term}")`);
        else if (!has(leasePara, term))
          f("warn", `${name}: ${label} not in the same paragraph as the tenure`);
      }
      if (input.serviceCharge && !has(text, fmtMoney(input.serviceCharge)))
        f("fail", `${name}: service charge amount ${fmtMoney(input.serviceCharge)} missing`);
    }
    if (isSharedOwnership(input)) {
      if (input.sharePercent && !has(text, `${input.sharePercent}% share`))
        f("fail", `${name}: missing "${input.sharePercent}% share"`);
      if (input.rent && !has(text, fmtMoney(input.rent)))
        f("fail", `${name}: missing rent ${fmtMoney(input.rent)}`);
    }
  }
  // Known issues + Part C "Yes" items must be in the description.
  const clauses = (input.disclosures ?? "")
    .split(/[;\n]|\.\s/)
    .map((c) => c.trim())
    .filter((c) => c.length > 3);
  for (const c of clauses)
    if (!clauseCovered(c, pack.listing))
      f("fail", `Description doesn't disclose known issue: "${c}"`);
  const partC = [
    "buildingSafety",
    "restrictions",
    "rightsEasements",
    "flooding",
    "coastalErosion",
    "planning",
    "accessibility",
    "coalfieldMining",
  ] as const;
  for (const k of partC) {
    const v = (input[k] ?? "").trim();
    if (!/^yes/i.test(v)) continue;
    const detail = v.replace(/^yes\s*[–—:-]?\s*/i, "");
    if (detail && !clauseCovered(detail, pack.listing))
      f("fail", `Description doesn't cover Part C ${k}: "${detail}"`);
  }
  for (const p of pack.social) {
    const t = socialText(p);
    if (input.price && !has(t, fmtMoney(input.price))) f("warn", `social.${p.platform}: no price`);
    if (input.tenure && !has(t, input.tenure)) f("warn", `social.${p.platform}: no tenure`);
  }
  return out;
}

export function gradePrivateLeak(pack: GradePack, input: ListingInput): Finding[] {
  return privateLeakFlags(pack, input).map((fl) => ({
    grader: "privateLeak",
    severity: "fail" as const,
    message: `Private-note wording "${fl.term}" in ${fl.section}`,
    text: fl.term,
  }));
}

const CONTACT_RE =
  /(\b[\w.+-]+@[\w-]+\.[\w.]+\b|\bhttps?:\/\/\S+|\bwww\.\S+|\b\S+\.(?:co\.uk|com|uk|net|org)\b|(?:\+44\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b)/gi;
const PORTAL = new Set(["headline", "listing", "summary", "keyFeatures"]);

export function gradeContact(pack: GradePack): Finding[] {
  const out: Finding[] = [];
  for (const [section, text] of publicBlocks(pack)) {
    for (const m of text.matchAll(CONTACT_RE)) {
      out.push({
        grader: "contact",
        severity: PORTAL.has(section) ? "fail" : "warn",
        message: `Contact detail in ${section}`,
        text: m[0],
      });
    }
  }
  return out;
}

const PLACEHOLDERS = ["TBC", "Ask agent", "POA", "Price on application"];
export function gradePlaceholders(pack: GradePack): Finding[] {
  const out: Finding[] = [];
  for (const [section, text] of publicBlocks(pack))
    for (const p of PLACEHOLDERS)
      if (termRe(p).test(norm(text)))
        out.push({
          grader: "placeholders",
          severity: "fail",
          message: `"${p}" in ${section}`,
          text: snippet(text, p),
        });
  return out;
}

export function gradeMustInclude(pack: GradePack, c: EvalCase): Finding[] {
  const out: Finding[] = [];
  for (const m of c.mustInclude ?? []) {
    for (const sec of m.sections) {
      const texts = sectionTexts(pack, sec);
      texts.forEach((t, i) => {
        if (!has(t, m.text))
          out.push({
            grader: "mustInclude",
            severity: "fail",
            message: `"${m.text}" missing from ${sec}${texts.length > 1 ? ` #${i + 1}` : ""}`,
          });
      });
    }
  }
  for (const term of c.mustNotInclude ?? []) {
    for (const [section, text] of publicBlocks(pack)) {
      if (termRe(term).test(norm(text)))
        out.push({
          grader: "mustNotInclude",
          severity: "fail",
          message: `"${term}" in ${section}`,
          text: snippet(text, term),
        });
    }
  }
  return out;
}

const IMAGE_LABELS: [RegExp, string][] = [
  [
    /virtual(ly)?[- ]stag/i,
    "Some images have been virtually staged to show how rooms could be furnished.",
  ],
  [/\bCGI\b|computer[- ]generated/i, "Images are computer-generated (CGI) and indicative only."],
  [/show home/i, "Images show the show home; specification may differ."],
  [/digitally (enhanced|altered)/i, "Some images have been digitally enhanced."],
];

const PART_C = [
  "buildingSafety",
  "restrictions",
  "rightsEasements",
  "flooding",
  "coastalErosion",
  "planning",
  "accessibility",
  "coalfieldMining",
] as const;

/** v2 rules: EPC in captions, "Please note:", image labels, sale method, no draft wording, personal message. */
export function gradeV2(pack: GradePack, input: ListingInput): Finding[] {
  const out: Finding[] = [];
  const f = (message: string, text?: string, severity: "fail" | "warn" = "fail") =>
    out.push({ grader: "v2", severity, message, text });
  if (input.epc && /^[A-G]$/.test(input.epc.trim()))
    for (const p of pack.social)
      if (!new RegExp(`\\bEPC\\b[^.\\n]{0,30}\\b${esc(input.epc.trim())}\\b`, "i").test(p.caption))
        f(`social.${p.platform}: no EPC rating ${input.epc}`, p.caption.slice(0, 120));
  const hasIssues =
    !!input.disclosures?.trim() || PART_C.some((k) => /^yes/i.test((input[k] ?? "").trim()));
  if (hasIssues) {
    const targets: [string, string][] = [
      ["emailBlast.body", pack.emailBlast?.body ?? ""],
      ...pack.social
        .filter((p) => p.platform === "Instagram" || p.platform === "Facebook")
        .map((p): [string, string] => [`social.${p.platform}`, p.caption]),
    ];
    for (const [sec, text] of targets)
      if (!/please note:/i.test(text)) f(`${sec}: no "Please note:" sentence`);
  }
  // The prompt asks for exactly one label: any triggered label satisfies it.
  const media = input.mediaNotes ?? "";
  const triggered = IMAGE_LABELS.filter(([re]) => re.test(media)).map(([, l]) => l);
  if (triggered.length) {
    const blocks: [string, string][] = [
      ["listing", pack.listing],
      ...pack.social.map((p): [string, string] => [`social.${p.platform}`, p.caption]),
    ];
    for (const [sec, text] of blocks)
      if (!triggered.some((l) => has(text, l)))
        f(`${sec}: missing image label (${triggered.length} triggered)`);
  }
  if (/auction/i.test(input.saleMethod ?? "")) {
    const method = /modern/i.test(input.saleMethod ?? "") ? "Modern Method of Auction" : "auction";
    const re = new RegExp(`for sale by (traditional )?${method}`, "i");
    const blocks: [string, string][] = [
      ["summary", pack.summary],
      ["listing", pack.listing.split(/\n\s*\n/)[0] ?? ""],
      ["emailBlast.body", (pack.emailBlast?.body ?? "").split(/\n\s*\n/)[0] ?? ""],
      ...pack.social.map((p): [string, string] => [`social.${p.platform}`, p.caption]),
    ];
    for (const [sec, text] of blocks)
      if (!re.test(text)) f(`${sec}: no "For sale by ${method}" line`);
  }
  for (const [sec, text] of publicBlocks(pack)) {
    const m = text.match(
      /\bdraft\b|subject to (seller )?approval|\bapproval of (the )?particulars\b/i,
    );
    if (m) f(`Draft/approval wording in ${sec}`, m[0]);
  }
  if (pack.emailBlast) {
    const n = words(pack.emailBlast.personalMessage ?? "");
    if (!n) f("emailBlast.personalMessage missing");
    else if (n < 40 || n > 80) f(`personalMessage ${n} words (need 40–80)`);
  }
  return out;
}

/** Case-specific regex checks (EvalCase.patterns). */
export function gradePatterns(pack: GradePack, c: EvalCase): Finding[] {
  const out: Finding[] = [];
  for (const p of c.patterns ?? []) {
    const re = p.match ? new RegExp(p.match, "i") : null;
    const nre = p.notMatch ? new RegExp(p.notMatch, "i") : null;
    if (p.eachKeyFeature) {
      const cond = new RegExp(p.eachKeyFeature.if, "i");
      const then = new RegExp(p.eachKeyFeature.then, "i");
      for (const k of pack.keyFeatures)
        if (cond.test(k) && !then.test(k))
          out.push({
            grader: "patterns",
            severity: "fail",
            message: `keyFeature /${p.eachKeyFeature.if}/ lacks /${p.eachKeyFeature.then}/`,
            text: k,
          });
      continue;
    }
    for (const sec of p.sections ?? []) {
      const text = sectionTexts(pack, sec).join("\n");
      if (re && !re.test(text))
        out.push({
          grader: "patterns",
          severity: "fail",
          message: `${sec} doesn't match /${p.match}/`,
        });
      if (nre) {
        const m = text.match(nre);
        if (m)
          out.push({
            grader: "patterns",
            severity: "fail",
            message: `${sec} matches /${p.notMatch}/`,
            text: m[0],
          });
      }
    }
  }
  return out;
}

/** Run every pack grader; `prefix` labels raw-output findings. */
export function gradePack(
  pack: GradePack,
  input: ListingInput,
  c: EvalCase,
  prefix = "",
): Finding[] {
  const all = [
    ...gradeFactCheck(pack, input),
    ...gradeBanned(pack, input),
    ...gradeLimits(pack, input),
    ...gradeMaterialInfo(pack, input),
    ...gradePrivateLeak(pack, input),
    ...gradeContact(pack),
    ...gradePlaceholders(pack),
    ...gradeMustInclude(pack, c),
    ...gradeV2(pack, input),
    ...gradePatterns(pack, c),
  ];
  return prefix ? all.map((f) => ({ ...f, grader: `${prefix}${f.grader}` })) : all;
}

/** Raw output: only the checks validate* could hide (limits + banned). */
export function gradeRaw(pack: GradePack, input: ListingInput): Finding[] {
  return [...gradeLimits(pack, input), ...gradeBanned(pack, input)].map((f) => ({
    ...f,
    grader: `raw:${f.grader}`,
  }));
}

const normVal = (s: string) => s.toLowerCase().replace(/[£,\s]/g, "");

export function gradeExtraction(
  c: EvalCase,
  raw: unknown,
  result: ExtractResult,
): { findings: Finding[]; precision: number; recall: number } {
  const out: Finding[] = [];
  const r = (raw ?? {}) as Record<string, unknown>;
  const keys = new Set(EXTRACTABLE_FIELDS.map((d) => d.key as string));
  for (const k of Object.keys(r)) {
    if (k === "evidence" || !keys.has(k)) continue;
    if (typeof r[k] === "string" && (r[k] as string).trim() && !(k in result.fields))
      out.push({
        grader: "extraction",
        severity: "fail",
        message: `${k} dropped by filterExtraction (evidence not in notes)`,
        text: String(r[k]),
      });
  }
  const exp = c.expectFields ?? {};
  let correct = 0;
  // Precision is judged only on fields the case has an opinion about.
  const returned = Object.keys(result.fields).filter((k) => k in exp).length;
  const expectedNonNull = Object.values(exp).filter((v) => v !== null).length;
  for (const [k, v] of Object.entries(result.fields)) {
    if (!(k in exp)) {
      out.push({
        grader: "extraction",
        severity: "warn",
        message: `unexpected field ${k} (not in expectFields)`,
        text: v,
      });
      continue;
    }
    const e = exp[k];
    if (e === null)
      out.push({
        grader: "extraction",
        severity: "fail",
        message: `${k} should not be returned`,
        text: v,
      });
    else if (normVal(e) !== normVal(v))
      out.push({
        grader: "extraction",
        severity: "fail",
        message: `${k}: expected "${e}"`,
        text: v,
      });
    else correct++;
  }
  for (const [k, v] of Object.entries(exp))
    if (v !== null && !(k in result.fields))
      out.push({
        grader: "extraction",
        severity: "warn",
        message: `expected ${k} = "${v}" not returned`,
      });
  return {
    findings: out,
    precision: returned ? correct / returned : 1,
    recall: expectedNonNull ? correct / expectedNonNull : 1,
  };
}
