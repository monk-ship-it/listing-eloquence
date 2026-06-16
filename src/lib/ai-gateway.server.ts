interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callLovableAiJson(
  messages: ChatMessage[],
  model = "google/gemini-3-flash-preview",
): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (res.status === 402) {
    throw new Error("CREDITS_EXHAUSTED");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
