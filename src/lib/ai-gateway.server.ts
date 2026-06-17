interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Calls Anthropic's Claude (Messages API) and returns the model's text content.
 * The prompt asks for JSON, so callers parse the returned string as JSON.
 */
export async function callLovableAiJson(
  messages: ChatMessage[],
  model = "claude-sonnet-4-20250514",
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

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
      model,
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
