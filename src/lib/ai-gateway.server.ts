import { DEFAULT_CLAUDE_MODEL, type ClaudeToolOpts } from "./prompts/calls";

export { DEFAULT_CLAUDE_MODEL };
export type { ClaudeToolOpts };

/** Reads the configured Claude model id from app_settings, falling back to the default. */
export async function getConfiguredClaudeModel(): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "claude_model")
      .maybeSingle();
    return data?.value?.trim() || DEFAULT_CLAUDE_MODEL;
  } catch {
    return DEFAULT_CLAUDE_MODEL;
  }
}

export interface CallMeta {
  ms: number;
  stopReason: string | null;
  usage: { input_tokens?: number; output_tokens?: number } | null;
}

/**
 * The exact Messages API body for a tool call. Used by callClaudeTool and by
 * every export (admin "Copy for Workbench", eval --dry) so they serialise
 * identically.
 */
export function toApiBody(opts: ClaudeToolOpts, model: string): Record<string, unknown> {
  return {
    model,
    max_tokens: opts.maxTokens,
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription ?? "Return the requested copy.",
        input_schema: opts.inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
  };
}

/**
 * Calls Claude with a single forced tool and returns the tool_use input.
 * Throws friendly codes only: AI_TIMEOUT, RATE_LIMIT, AI_UNAVAILABLE,
 * AI_TRUNCATED (stop_reason max_tokens) or MALFORMED_AI_OUTPUT.
 */
export async function callClaudeTool(
  opts: ClaudeToolOpts & { onMeta?: (m: CallMeta) => void },
): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    throw new Error("AI_UNAVAILABLE");
  }
  const model = opts.model || (await getConfiguredClaudeModel());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);
  const started = Date.now();
  const meta = (stopReason: string | null, usage: CallMeta["usage"]) => {
    try {
      opts.onMeta?.({ ms: Date.now() - started, stopReason, usage });
    } catch {
      // never let instrumentation break a call
    }
  };
  try {
    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(toApiBody(opts, model)),
      });
    } catch (err) {
      meta(null, null);
      if (err instanceof Error && err.name === "AbortError") throw new Error("AI_TIMEOUT");
      console.error("Claude request failed", err);
      throw new Error("AI_UNAVAILABLE");
    }
    if (res.status === 429) {
      meta(null, null);
      throw new Error("RATE_LIMIT");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Claude API error", res.status, text);
      meta(null, null);
      throw new Error("AI_UNAVAILABLE");
    }
    const data = (await res.json()) as {
      stop_reason?: string;
      usage?: CallMeta["usage"];
      content?: { type?: string; name?: string; input?: unknown }[];
    };
    meta(data.stop_reason ?? null, data.usage ?? null);
    if (data.stop_reason === "max_tokens") throw new Error("AI_TRUNCATED");
    const block = (data.content ?? []).find(
      (b) => b?.type === "tool_use" && b.name === opts.toolName,
    );
    if (!block || !block.input || typeof block.input !== "object") {
      throw new Error("MALFORMED_AI_OUTPUT");
    }
    return block.input;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("AI_TIMEOUT");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validates a model id by making a tiny live request to the Claude API.
 * Returns an error message string when invalid, or null when the model works.
 */
export async function validateClaudeModel(model: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Missing ANTHROPIC_API_KEY on the server.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    }),
  });

  if (res.ok) return null;

  if (res.status === 404) {
    return `Model "${model}" was not found. Check the exact model id and try again.`;
  }
  if (res.status === 401 || res.status === 403) {
    return "The Claude API key was rejected. The model could not be validated.";
  }
  if (res.status === 429) {
    return "Rate limited while validating. Please try again in a moment.";
  }
  const text = await res.text().catch(() => "");
  console.error("Claude model validation failed", res.status, text);
  return `Validation failed (${res.status}). Please check the model id and try again.`;
}
