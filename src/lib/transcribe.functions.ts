import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANGUAGES } from "@/hooks/useDictationSettings";

const MAX_BYTES = 10 * 1024 * 1024;
const DAILY_LIMIT = 60;
const MODEL = "openai/gpt-transcribe";

/**
 * Speech-to-text for voice notes. Audio is forwarded to Lovable AI and never
 * stored. Requires active access but does not consume a listing.
 */
export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Invalid upload.");
    const file = input.get("audio");
    const lang = String(input.get("lang") ?? "en-GB");
    if (!(file instanceof File) || !file.size) throw new Error("No audio was recorded.");
    if (file.size > MAX_BYTES) throw new Error("RECORDING_TOO_LARGE");
    const type = (file.type || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("audio/") && type !== "video/webm" && type !== "video/mp4") {
      throw new Error("Unsupported audio format.");
    }
    if (!LANGUAGES.some((l) => l.code === lang)) throw new Error("Unsupported language.");
    return { file, lang, type };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { isCompedEmail } = await import("./comped.server");
    const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
    const sub = await readReconciledSubscriber(supabase, userId);
    const comped = isCompedEmail(sub?.email);
    if (!comped && !hasActiveAccess(sub?.status ?? "none", sub?.current_period_end ?? null)) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("transcription_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if (countError) {
      console.error("transcription_usage count failed", countError);
      throw new Error("TRANSCRIPTION_FAILED");
    }
    if ((count ?? 0) >= DAILY_LIMIT) throw new Error("TRANSCRIPTION_DAILY_LIMIT");
    await supabaseAdmin
      .from("transcription_usage")
      .insert({ user_id: userId, lang: data.lang, bytes: data.file.size });

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("Missing LOVABLE_API_KEY");
      throw new Error("TRANSCRIPTION_FAILED");
    }

    // MediaRecorder sometimes labels audio-only output as video/*.
    const audioType = data.type.startsWith("video/")
      ? data.type.replace("video/", "audio/")
      : data.type;
    const ext =
      audioType.includes("mp4") || audioType.includes("aac")
        ? "m4a"
        : audioType.includes("ogg")
          ? "ogg"
          : "webm";
    const blob = new Blob([await data.file.arrayBuffer()], { type: audioType });
    const iso = data.lang.split("-")[0];

    const form = new FormData();
    form.append("model", MODEL);
    form.append("file", blob, `voice-note.${ext}`);
    form.append("response_format", "json");
    form.append("stream", "true");
    form.append("languages", iso);
    form.append(
      "prompt",
      "Property notes dictated by an estate agent. Return a plain verbatim transcript only.",
    );

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
      body: form,
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("Transcription error", res.status, body);
      if (res.status === 402) throw new Error("TRANSCRIPTION_CREDITS");
      if (res.status === 429) throw new Error("TRANSCRIPTION_RATE_LIMIT");
      throw new Error("TRANSCRIPTION_FAILED");
    }

    // Read the SSE stream to the end; the .done event carries the full text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let deltas = "";
    let finalText: string | null = null;
    const handle = (frame: string) => {
      const dataLines = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim());
      const payload = dataLines.join("\n");
      if (!payload || payload === "[DONE]") return;
      try {
        const evt = JSON.parse(payload);
        if (evt.type?.endsWith(".delta") && typeof evt.delta === "string") deltas += evt.delta;
        else if (evt.type?.endsWith(".done") && typeof evt.text === "string") finalText = evt.text;
        else if (evt.type === "error" || evt.error) {
          console.error("Transcription stream error", payload);
          throw new Error("TRANSCRIPTION_FAILED");
        }
      } catch (e) {
        if (e instanceof Error && e.message === "TRANSCRIPTION_FAILED") throw e;
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        handle(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
      }
    }
    if (buffer.trim()) handle(buffer);

    const text = ((finalText ?? deltas) as string).trim();
    if (!text) throw new Error("NO_SPEECH");
    return { text };
  });
