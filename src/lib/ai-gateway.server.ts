interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

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

/**
 * Calls Anthropic's Claude (Messages API) and returns the model's text content.
 * The prompt asks for JSON, so callers parse the returned string as JSON.
 * When `model` is omitted, the model configured in app_settings is used.
 */
export async function callLovableAiJson(messages: ChatMessage[], model?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const resolvedModel = model || (await getConfiguredClaudeModel());

  const systemPrompt = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
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
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 4096,
        system: systemPrompt || undefined,
        messages: conversation,
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI_TIMEOUT");
    }
    console.error("Claude request failed", err);
    throw new Error("AI_UNAVAILABLE");
  }

  try {
    if (res.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (!res.ok) {
      // Raw provider body stays in server logs only.
      const text = await res.text().catch(() => "");
      console.error("Claude API error", res.status, text);
      throw new Error("AI_UNAVAILABLE");
    }
    const data = await res.json();
    return extractText(data);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("AI_TIMEOUT");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls Claude with a single forced tool and returns the tool_use input.
 * Throws friendly codes only: AI_TIMEOUT, RATE_LIMIT, AI_UNAVAILABLE,
 * AI_TRUNCATED (stop_reason max_tokens) or MALFORMED_AI_OUTPUT.
 */
export async function callClaudeTool(opts: {
  system: string;
  user: string;
  toolName: string;
  toolDescription?: string;
  inputSchema: Record<string, unknown>;
  maxTokens: number;
  timeoutMs?: number;
  model?: string;
}): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    throw new Error("AI_UNAVAILABLE");
  }
  const model = opts.model || (await getConfiguredClaudeModel());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);
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
        body: JSON.stringify({
          model,
          max_tokens: opts.maxTokens,
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
        }),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw new Error("AI_TIMEOUT");
      console.error("Claude request failed", err);
      throw new Error("AI_UNAVAILABLE");
    }
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Claude API error", res.status, text);
      throw new Error("AI_UNAVAILABLE");
    }
    const data = (await res.json()) as {
      stop_reason?: string;
      content?: { type?: string; name?: string; input?: unknown }[];
    };
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

function extractText(data: unknown): string {
  const d = data as { content?: unknown };
  const blocks = Array.isArray(d?.content) ? d.content : [];
  return blocks
    .filter((b: { type?: string }) => b?.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");
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
