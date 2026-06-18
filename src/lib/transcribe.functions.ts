import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface TranscribeInput {
  /** Base64-encoded audio data (no data: prefix). */
  audio: string;
  /** Original recording MIME type, e.g. "audio/webm". */
  mimeType: string;
}

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TranscribeInput) => {
    if (!input || typeof input.audio !== "string" || !input.audio) {
      throw new Error("No audio provided.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Speech-to-text is not configured.");

    const bytes = Buffer.from(data.audio, "base64");
    const baseMime = (data.mimeType || "audio/webm").split(";")[0];
    const ext = EXT_BY_MIME[baseMime] ?? "webm";

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append(
      "file",
      new Blob([bytes], { type: baseMime }),
      `recording.${ext}`,
    );

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      },
    );

    if (res.status === 429) throw new Error("Too many requests. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Transcription failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as { text?: string };
    return { text: (json.text ?? "").trim() };
  });
