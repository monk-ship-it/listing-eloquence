/**
 * Tool schemas, call settings and request builders for the three Claude calls
 * (core, marketing, extract). Pure module. The returned ClaudeToolOpts are
 * what callClaudeTool sends (serialised by toApiBody in ai-gateway.server.ts).
 */
import type { ListingInput } from "../listing-types";
import { EXTRACTABLE_FIELDS } from "../listing-fields";
import {
  CORE_USER_TEMPLATE,
  EXTRACT_SYSTEM,
  EXTRACT_USER_TEMPLATE,
  LIMIT_REMINDER,
  MARKETING_REMINDER,
  MARKETING_USER_TEMPLATE,
  SYSTEM_TEMPLATE,
  fillTemplate,
  varsFor,
} from "./templates";
import { promptVars } from "./render";

/** Fallback model when app_settings.claude_model is empty. */
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

export interface ClaudeToolOpts {
  system: string;
  user: string;
  toolName: string;
  toolDescription?: string;
  inputSchema: Record<string, unknown>;
  maxTokens: number;
  timeoutMs?: number;
  model?: string;
  temperature?: number;
}

export const CORE_TOOL = "submit_listing_core";
export const MARKETING_TOOL = "submit_listing_marketing";
export const EXTRACT_TOOL = "fill_listing_fields";

export const TOOL_DESCRIPTIONS = {
  core: "Submit the headline, portal description, strapline and key features.",
  marketing: "Submit the Email Blast, the seller approval email and three social posts.",
  extract: "Submit only the fields the agent explicitly stated.",
} as const;

export const CALL_SETTINGS = {
  core: {
    maxTokens: 6000,
    retryMaxTokens: 8000,
    timeoutMs: 90_000,
    temperature: undefined as number | undefined,
  },
  marketing: { maxTokens: 3500, timeoutMs: 90_000, temperature: undefined as number | undefined },
  extract: { maxTokens: 1500, temperature: 0, timeoutMs: 30_000 },
} as const;

/** Human-readable retry rules (mirrors generation.server.ts) for settings.json. */
export const RETRY_RULES = {
  core: [
    "On AI_TRUNCATED (stop_reason max_tokens) or MALFORMED_AI_OUTPUT: retry once with max_tokens = retryMaxTokens.",
    "On AI_TIMEOUT: retry once with the same max_tokens.",
    "If the first answer has a headline > 70 chars, a strapline > 250 chars or a key feature > 80 chars: retry once with {{LIMIT_REMINDER}} filled from core.limit-reminder.txt; if that retry fails, keep the first answer.",
    "Any other error (e.g. RATE_LIMIT) is not retried.",
  ],
  marketing: [
    "Any failure: retry once. If the retry fails the listing is still saved without the email/social pack.",
    "If the X caption + hashtags is over 280 characters, or a caption misses the price or tenure: retry once with marketing.reminder.txt appended to the user message; then accept (the UI counters flag anything still over).",
  ],
  extract: [
    "No retry. Fields whose evidence quote isn't found in the notes are dropped (filterExtraction).",
  ],
};

export const CORE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "Brochure / email headline, max 70 characters" },
    listing: {
      type: "string",
      description: "Portal description, plain-text paragraphs separated by \\n\\n",
    },
    summary: { type: "string", description: "Strapline (portal summary), max 250 characters" },
    keyFeatures: {
      type: "array",
      items: { type: "string" },
      minItems: 6,
      maxItems: 10,
      description: "6–10 bullets, max 80 characters each",
    },
  },
  required: ["headline", "listing", "summary", "keyFeatures"],
};

export const MARKETING_SCHEMA = {
  type: "object",
  properties: {
    emailBlast: {
      type: "object",
      properties: {
        subjectLines: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        previewText: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" },
        callToAction: { type: "string" },
        personalMessage: {
          type: "string",
          description: "40–80 words for the CRM property-alert message box",
        },
      },
      required: ["subjectLines", "previewText", "headline", "body", "callToAction", "personalMessage"],
    },
    sellerEmail: {
      type: "object",
      properties: { body: { type: "string" } },
      required: ["body"],
    },
    social: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["Instagram", "Facebook", "X"] },
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
        },
        required: ["platform", "caption", "hashtags"],
      },
    },
  },
  required: ["emailBlast", "sellerEmail", "social"],
};

export function buildExtractSchema() {
  const props: Record<string, unknown> = {};
  const evidence: Record<string, unknown> = {};
  for (const d of EXTRACTABLE_FIELDS) {
    props[d.key] = {
      type: "string",
      description: [
        d.label,
        d.kind === "select" && d.options ? `One of: ${d.options.join(" | ")}.` : "",
        d.hint ?? "",
      ]
        .filter(Boolean)
        .join(" "),
    };
    evidence[d.key] = { type: "string", maxLength: 80 };
  }
  return {
    type: "object",
    properties: {
      ...props,
      evidence: {
        type: "object",
        description: "Verbatim quote from the notes supporting each returned field",
        properties: evidence,
      },
    },
    required: ["evidence"],
  };
}

export function renderSystem(input: ListingInput): string {
  return fillTemplate(SYSTEM_TEMPLATE, varsFor(SYSTEM_TEMPLATE, promptVars(input)));
}

export function buildCoreRequest(
  input: ListingInput,
  opts: { reminder?: boolean; maxTokens?: number } = {},
): ClaudeToolOpts {
  const vars = { ...promptVars(input), LIMIT_REMINDER: opts.reminder ? LIMIT_REMINDER : "" };
  return {
    system: renderSystem(input),
    user: fillTemplate(CORE_USER_TEMPLATE, varsFor(CORE_USER_TEMPLATE, vars)),
    toolName: CORE_TOOL,
    toolDescription: TOOL_DESCRIPTIONS.core,
    inputSchema: CORE_SCHEMA,
    maxTokens: opts.maxTokens ?? CALL_SETTINGS.core.maxTokens,
    timeoutMs: CALL_SETTINGS.core.timeoutMs,
    temperature: CALL_SETTINGS.core.temperature,
  };
}

export function buildMarketingRequest(
  input: ListingInput,
  opts: { reminder?: boolean } = {},
): ClaudeToolOpts {
  const vars = promptVars(input);
  return {
    system: renderSystem(input),
    user:
      fillTemplate(MARKETING_USER_TEMPLATE, varsFor(MARKETING_USER_TEMPLATE, vars)) +
      (opts.reminder ? MARKETING_REMINDER : ""),
    toolName: MARKETING_TOOL,
    toolDescription: TOOL_DESCRIPTIONS.marketing,
    inputSchema: MARKETING_SCHEMA,
    maxTokens: CALL_SETTINGS.marketing.maxTokens,
    timeoutMs: CALL_SETTINGS.marketing.timeoutMs,
    temperature: CALL_SETTINGS.marketing.temperature,
  };
}

export function buildExtractRequest(notes: string): ClaudeToolOpts {
  return {
    system: EXTRACT_SYSTEM,
    user: fillTemplate(EXTRACT_USER_TEMPLATE, { NOTES: notes }),
    toolName: EXTRACT_TOOL,
    toolDescription: TOOL_DESCRIPTIONS.extract,
    inputSchema: buildExtractSchema(),
    maxTokens: CALL_SETTINGS.extract.maxTokens,
    timeoutMs: CALL_SETTINGS.extract.timeoutMs,
    temperature: CALL_SETTINGS.extract.temperature,
  };
}
