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
export async function callLovableAiJson(
  messages: ChatMessage[],
  model?: string,
): Promise<string> {
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

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
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

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("The Claude API key was rejected. Please check the key and try again.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const blocks = Array.isArray(data?.content) ? data.content : [];
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
  const text = await res.text();
  return `Validation failed (${res.status}): ${text}`;
}
