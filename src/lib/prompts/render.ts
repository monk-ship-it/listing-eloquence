/**
 * Renders ListingInput into the {{VARIABLES}} used by templates.ts. Pure
 * (relative imports only). The app, the eval harness and the Workbench export
 * all call promptVars(), so a variable can never be filled two ways.
 */
import type { ListingInput } from "../listing-types";
import { VOICE_PROMPTS, VOICES, type VoiceId } from "../voices";
import { FIELD_BY_KEY, FIELD_DEFS } from "../listing-fields";
import { buildMaterialInfoBlock, checkMaterialInfo, summariseChecks } from "../material-info";
import { addImperial } from "../measurements";

/** Max characters accepted per free-text field to keep payloads sane. */
const MAX_FIELD_LEN = 4000;
const MAX_VOICE_NOTES_LEN = 8000;

const VALID_VOICES = new Set(VOICES.map((v) => v.id));

export function isValidVoice(v: unknown): v is VoiceId {
  return VALID_VOICES.has(v as VoiceId);
}

function clip(v: unknown, max: number, label: string): string {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v !== "string") throw new Error(`${label} must be text.`);
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/\u0000/g, "").trim();

  if (t.length > max) {
    throw new Error(`${label} is too long (max ${max.toLocaleString()} characters).`);
  }
  return t;
}

/** Validates the voice, trims/clips every text field and forces market "uk". */
export function normaliseInput(input: ListingInput): ListingInput {
  if (!VALID_VOICES.has(input.voice)) {
    throw new Error("Please choose a valid brand voice.");
  }
  const out = { ...input, market: "uk" } as ListingInput;
  const stringKeys: string[] = [...FIELD_DEFS.map((d) => d.key), "utilities"];
  for (const k of stringKeys) {
    const max = k === "voiceNotes" ? MAX_VOICE_NOTES_LEN : MAX_FIELD_LEN;
    (out as unknown as Record<string, string>)[k] = clip(
      (input as unknown as Record<string, unknown>)[k],
      max,
      FIELD_BY_KEY[k]?.label ?? k,
    );
  }
  out.sellerApproved = input.sellerApproved === true;
  return out;
}

function field(label: string, value: string | undefined) {
  return value && value.trim() ? `- ${label}: ${value.trim()}\n` : "";
}

export const PRIVATE_KEYS = new Set(["showingNotes", "mediaNotes"]);

export function renderBrandVoice(voiceId: string): string {
  const voice = (voiceId ?? "professional") as VoiceId;
  return VOICE_PROMPTS[voice] ?? VOICE_PROMPTS.professional;
}

function walkFields(input: ListingInput): { details: string; privateNotes: string } {
  let details = "";
  let privateNotes = "";
  for (const def of FIELD_DEFS) {
    if (def.key === "voiceNotes") continue;
    if (def.showIf && !def.showIf(input)) continue;
    const v = def.key === "dimensions" ? addImperial(input[def.key] ?? "") : input[def.key];
    if (PRIVATE_KEYS.has(def.key)) privateNotes += field(def.label, v);
    else
      details += field(
        def.key === "targetAudience"
          ? "Likely buyer (emphasis only — never exclude anyone)"
          : def.label,
        v,
      );
  }
  // Legacy combined supplies field from older saved listings.
  details += field("Utilities / broadband (legacy)", input.utilities);
  return { details, privateNotes };
}

/** {{PROPERTY_DETAILS}} — one "- Label: value" line per supplied public field. */
export function renderFactsBlock(input: ListingInput): string {
  return walkFields(input).details || "- (none supplied — use the voice notes)\n";
}

/** {{MATERIAL_INFORMATION}} */
export function renderMaterialInfo(input: ListingInput): string {
  return buildMaterialInfoBlock(input) || "(none supplied)";
}

/** {{PRIVATE_NOTES}} — viewing/photo notes with their warning header, or "". */
export function renderPrivateNotes(input: ListingInput): string {
  const { privateNotes } = walkFields(input);
  return privateNotes
    ? `\nPRIVATE NOTES (never quote or use in any output; the app adds any image label itself):\n${privateNotes}`
    : "";
}

/** Raw private-note lines (no header) — for graders and the leak check. */
export function privateNotesLines(input: ListingInput): string {
  return walkFields(input).privateNotes;
}

/** {{VOICE_NOTES}} — the dictated notes with their header, or "". */
export function renderVoiceNotes(input: ListingInput): string {
  return input.voiceNotes?.trim()
    ? `\nAGENT VOICE NOTES (raw, dictated or pasted — supplementary context only):\n${input.voiceNotes.trim()}\n`
    : "";
}

/** {{SELLER_APPROVAL}} */
export function renderSellerApproval(input: ListingInput): string {
  return input.sellerApproved ? "confirmed" : "NOT confirmed";
}

/**
 * {{GAP_QUESTIONS}} — every open checklist item with a seller question: blank
 * material facts (except price and approval), Part B supplies incl. mobile
 * signal, and unanswered Part C items.
 */
export function renderGapQuestions(input: ListingInput): string {
  const gaps = summariseChecks(checkMaterialInfo(input)).open.filter(
    (i) => i.question && i.field !== "price" && i.field !== "sellerApproved",
  );
  return gaps.length
    ? gaps.map((g) => `- ${g.question}`).join("\n")
    : "- (none — all supplies and Part C items are answered)";
}

export type PromptVarName =
  | "BRAND_VOICE"
  | "PROPERTY_DETAILS"
  | "MATERIAL_INFORMATION"
  | "PRIVATE_NOTES"
  | "VOICE_NOTES"
  | "SELLER_APPROVAL"
  | "GAP_QUESTIONS"
  | "LIMIT_REMINDER";

/** Every variable used by SYSTEM_TEMPLATE, CORE_USER_TEMPLATE and MARKETING_USER_TEMPLATE. */
export function promptVars(input: ListingInput): Record<PromptVarName, string> {
  return {
    BRAND_VOICE: renderBrandVoice(input.voice),
    PROPERTY_DETAILS: renderFactsBlock(input),
    MATERIAL_INFORMATION: renderMaterialInfo(input),
    PRIVATE_NOTES: renderPrivateNotes(input),
    VOICE_NOTES: renderVoiceNotes(input),
    SELLER_APPROVAL: renderSellerApproval(input),
    GAP_QUESTIONS: renderGapQuestions(input),
    LIMIT_REMINDER: "",
  };
}

/** Where each variable comes from — used in the Workbench README. */
export const VARIABLE_SOURCES: Record<PromptVarName | "NOTES", string> = {
  BRAND_VOICE:
    "renderBrandVoice(input.voice) — VOICE_PROMPTS in src/lib/voices.ts (see voices/*.txt)",
  PROPERTY_DETAILS:
    "renderFactsBlock(input) — one '- Label: value' line per supplied public field in FIELD_DEFS",
  MATERIAL_INFORMATION: "renderMaterialInfo(input) — buildMaterialInfoBlock() in material-info.ts",
  PRIVATE_NOTES:
    "renderPrivateNotes(input) — viewing + photo notes with the warning header, or empty",
  VOICE_NOTES: "renderVoiceNotes(input) — dictated notes with their header, or empty",
  SELLER_APPROVAL: 'renderSellerApproval(input) — "confirmed" or "NOT confirmed"',
  GAP_QUESTIONS:
    "renderGapQuestions(input) — seller questions for every open checklist item except price/approval (marketing only)",
  LIMIT_REMINDER:
    "empty, or core.limit-reminder.txt on the one retry after a limit breach (core only)",
  NOTES: "the agent's voice notes, trimmed (extraction only)",
};
