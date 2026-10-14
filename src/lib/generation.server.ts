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
import { validateCoreOutput, validateMarketingOutput } from "./listing-types";
import { filterExtraction, type ExtractResult } from "./extract-filter";

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
  return o.summary.length > 250 || o.keyFeatures.some((f) => f.length > 80);
}

/**
 * CORE call: retry once on truncation/invalid output (retryMaxTokens) or
 * timeout. If the strapline or a bullet breaks its limit, retry once with a
 * reminder, then accept (the UI counters flag anything still over).
 */
export async function runCore(input: ListingInput, opts: RunOpts = {}): Promise<CoreOutput> {
  const S = CALL_SETTINGS.core;
  let retried = false;
  let n = 0;
  const attempt = async (maxTokens: number, reminder = false) => {
    const a = ++n;
    const raw = await callClaudeTool({
      ...buildCoreRequest(input, { reminder, maxTokens }),
      model: opts.model,
      onMeta: (m) => opts.onMeta?.({ ...m, call: "core", attempt: a }),
    });
    opts.onRaw?.("core", raw, a);
    return validateCoreOutput(raw);
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
  if (!retried && breaksLimits(out)) {
    await opts.log?.("core", new Error("LIMITS_EXCEEDED"));
    try {
      out = await attempt(S.maxTokens, true);
    } catch (err) {
      await opts.log?.("core", err);
    }
  }
  return out;
}

/** MARKETING call: one retry on any failure. */
export async function runMarketing(
  input: ListingInput,
  opts: RunOpts & { stage?: "marketing" | "regen" } = {},
): Promise<MarketingOutput> {
  const stage = opts.stage ?? "marketing";
  const req = buildMarketingRequest(input);
  const subject = `Your property details for approval – ${input.address?.trim() || "your property"}`;
  let n = 0;
  const attempt = async () => {
    const a = ++n;
    const raw = await callClaudeTool({
      ...req,
      model: opts.model,
      onMeta: (m) => opts.onMeta?.({ ...m, call: "marketing", attempt: a }),
    });
    opts.onRaw?.("marketing", raw, a);
    const out = validateMarketingOutput(raw);
    if (out.sellerEmail) out.sellerEmail = { ...out.sellerEmail, subject };
    return out;
  };
  try {
    return await attempt();
  } catch (err) {
    await opts.log?.(stage, err);
    try {
      return await attempt();
    } catch (err2) {
      await opts.log?.(stage, err2);
      throw err2;
    }
  }
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
