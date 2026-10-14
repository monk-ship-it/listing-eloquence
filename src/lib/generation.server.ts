/**
 * The three Claude calls with their retry rules. No createServerFn import, so
 * bun scripts (eval harness) run exactly the code the app runs.
 */
import { callClaudeTool, type CallMeta } from "./ai-gateway.server";
import {
  buildCoreRequest,
  buildExtractRequest,
  buildMarketingRequest,
  CALL_SETTINGS,
} from "./prompts/calls";
import type { CoreOutput, ListingInput, MarketingOutput } from "./listing-types";
import { socialProblems, validateCoreOutput, validateMarketingOutput } from "./listing-types";
import { filterExtraction, type ExtractResult } from "./extract-filter";
import { LIMIT_REMINDER, MARKETING_REMINDER } from "./prompts/templates";
import { inputsToText } from "./fact-check";
import {
  bannedIn,
  bannedReminder,
  coreTexts,
  labelCore,
  labelMarketing,
  marketingTexts,
  missingPleaseNote,
  pleaseNoteReminder,
} from "./output-guards";

export type GenStage = "core" | "marketing" | "regen";

export interface RunOpts {
  /** Called for every failed attempt (server: logGenerationError). */
  log?: (stage: GenStage, err: unknown) => void | Promise<void>;
  model?: string;
  /** Timing / stop reason / token usage for every attempt. */
  onMeta?: (m: CallMeta & { call: "core" | "marketing" | "extract"; attempt: number }) => void;
  /** Raw tool input of every attempt, before validate* patches it (evals). */
  onRaw?: (call: "core" | "marketing" | "extract", raw: unknown, attempt: number) => void;
}

function errorCode(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  const known = [
    "AI_TRUNCATED",
    "AI_TIMEOUT",
    "RATE_LIMIT",
    "AI_UNAVAILABLE",
    "MALFORMED_AI_OUTPUT",
  ];
  return known.find((k) => m.includes(k)) ?? "UNKNOWN";
}

function breaksLimits(o: CoreOutput): boolean {
  return (
    o.headline.length > 70 || o.summary.length > 250 || o.keyFeatures.some((f) => f.length > 80)
  );
}

/**
 * CORE call: retry once on truncation/invalid output (retryMaxTokens) or
 * timeout. If the headline, strapline or a bullet breaks its limit, retry once with a
 * reminder, then accept (the UI counters flag anything still over).
 */
export async function runCore(input: ListingInput, opts: RunOpts = {}): Promise<CoreOutput> {
  const S = CALL_SETTINGS.core;
  let retried = false;
  let n = 0;
  const inputsText = inputsToText(input);
  const problems = (o: CoreOutput) => ({
    limits: breaksLimits(o),
    banned: bannedIn(coreTexts(o), inputsText),
  });
  const score = (o: CoreOutput) => {
    const p = problems(o);
    return (p.limits ? 1 : 0) + p.banned.length;
  };
  const attempt = async (maxTokens: number, reminder: boolean | string = false) => {
    const a = ++n;
    const raw = await callClaudeTool({
      ...buildCoreRequest(input, { reminder, maxTokens }),
      model: opts.model,
      onMeta: (m) => opts.onMeta?.({ ...m, call: "core", attempt: a }),
    });
    opts.onRaw?.("core", raw, a);
    return labelCore(validateCoreOutput(raw), input);
  };
  let out: CoreOutput;
  try {
    out = await attempt(S.maxTokens);
  } catch (err) {
    await opts.log?.("core", err);
    const code = errorCode(err);
    retried = true;
    if (code === "AI_TRUNCATED" || code === "MALFORMED_AI_OUTPUT")
      out = await attempt(S.retryMaxTokens);
    else if (code === "AI_TIMEOUT") out = await attempt(S.maxTokens);
    else throw err;
  }
  const p = problems(out);
  if (!retried && (p.limits || p.banned.length)) {
    await opts.log?.(
      "core",
      new Error(
        `${p.limits ? "LIMITS_EXCEEDED " : ""}${p.banned.length ? `BANNED: ${p.banned.join(",")}` : ""}`.trim(),
      ),
    );
    const reminder =
      (p.limits ? LIMIT_REMINDER : "") + (p.banned.length ? bannedReminder(p.banned) : "");
    try {
      const second = await attempt(S.maxTokens, reminder);
      if (score(second) <= score(out)) out = second;
    } catch (err) {
      await opts.log?.("core", err);
    }
  }
  return out;
}

/**
 * MARKETING call: one retry on any failure. If the answer breaks the social
 * rules (X > 280 incl. hashtags, a caption without price or tenure), one retry
 * with MARKETING_REMINDER; then accept (UI counters flag anything left).
 */
export async function runMarketing(
  input: ListingInput,
  opts: RunOpts & { stage?: "marketing" | "regen" } = {},
): Promise<MarketingOutput> {
  const stage = opts.stage ?? "marketing";
  const subject = `Your property details for approval – ${input.address?.trim() || "your property"}`;
  let n = 0;
  const inputsText = inputsToText(input);
  const problems = (o: MarketingOutput) => ({
    social: socialProblems(o, input),
    banned: bannedIn(marketingTexts(o), inputsText),
    pleaseNote: missingPleaseNote(o, input),
  });
  const score = (o: MarketingOutput) => {
    const p = problems(o);
    return p.social.length + p.banned.length + p.pleaseNote.length;
  };
  const attempt = async (reminder: boolean | string = false) => {
    const a = ++n;
    const raw = await callClaudeTool({
      ...buildMarketingRequest(input, { reminder }),
      model: opts.model,
      onMeta: (m) => opts.onMeta?.({ ...m, call: "marketing", attempt: a }),
    });
    opts.onRaw?.("marketing", raw, a);
    const out = validateMarketingOutput(raw);
    if (out.sellerEmail) out.sellerEmail = { ...out.sellerEmail, subject };
    return labelMarketing(out, input);
  };
  let out: MarketingOutput;
  let retried = false;
  try {
    out = await attempt();
  } catch (err) {
    await opts.log?.(stage, err);
    retried = true;
    try {
      out = await attempt();
    } catch (err2) {
      await opts.log?.(stage, err2);
      throw err2;
    }
  }
  const p = problems(out);
  if (!retried && (p.social.length || p.banned.length || p.pleaseNote.length)) {
    const tags = [
      p.social.length ? `SOCIAL_RULES: ${p.social.join(",")}` : "",
      p.banned.length ? `BANNED: ${p.banned.join(",")}` : "",
      p.pleaseNote.length ? "PLEASE_NOTE_MISSING" : "",
    ].filter(Boolean);
    await opts.log?.(stage, new Error(tags.join(" ")));
    const reminder =
      (p.social.length ? MARKETING_REMINDER : "") +
      (p.banned.length ? bannedReminder(p.banned) : "") +
      (p.pleaseNote.length ? pleaseNoteReminder(p.pleaseNote) : "");
    try {
      const second = await attempt(reminder);
      if (score(second) <= score(out)) out = second;
    } catch (err) {
      await opts.log?.(stage, err);
    }
  }
  return out;
}

/** EXTRACT call + server-side evidence filter. No retry. */
export async function runExtraction(notes: string, opts: RunOpts = {}): Promise<ExtractResult> {
  const raw = await callClaudeTool({
    ...buildExtractRequest(notes),
    model: opts.model,
    onMeta: (m) => opts.onMeta?.({ ...m, call: "extract", attempt: 1 }),
  });
  opts.onRaw?.("extract", raw, 1);
  return filterExtraction(raw, notes);
}
