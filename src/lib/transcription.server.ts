/** Deadline includes upload preparation, response headers and the SSE stream. */
export const TRANSCRIPTION_DEADLINE_MS = 90_000;
export const MAX_TRANSCRIPT_STREAM_BYTES = 512 * 1024;
export const MAX_TRANSCRIPT_TEXT_CHARS = 64 * 1024;

type AudioInput = { file: File; lang: string; type: string };
type CallOptions = {
  fetch?: typeof fetch;
  deadlineMs?: number;
  maxStreamBytes?: number;
  maxTextChars?: number;
};

/** Server-only provider call; options permit isolated network/stream tests. */
export async function callTranscription(data: AudioInput, options: CallOptions = {}): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("TRANSCRIPTION_FAILED");

  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("TRANSCRIPTION_FAILED"));
    }, options.deadlineMs ?? TRANSCRIPTION_DEADLINE_MS);
  });

  const run = async () => {
    // MediaRecorder can label an audio-only recording as video/*.
    const audioType = data.type.replace(/^video\//, "audio/");
    const ext = /mp4|aac/.test(audioType) ? "m4a" : audioType.includes("ogg") ? "ogg" : "webm";
    const form = new FormData();
    form.append("model", "openai/gpt-transcribe");
    form.append("file", new Blob([await data.file.arrayBuffer()], { type: audioType }), `voice-note.${ext}`);
    if (controller.signal.aborted) throw new Error("TRANSCRIPTION_FAILED");
    form.append("response_format", "json");
    form.append("stream", "true");
    form.append("languages", data.lang.split("-")[0]);
    form.append("prompt", "Property notes dictated by an estate agent. Return a plain verbatim transcript only.");

    const response = await (options.fetch ?? fetch)("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) {
      // Do not read or log an unbounded provider error body containing private data.
      void response.body?.cancel().catch(() => {});
      if (response.status === 402) throw new Error("TRANSCRIPTION_CREDITS");
      if (response.status === 429) throw new Error("TRANSCRIPTION_RATE_LIMIT");
      throw new Error("TRANSCRIPTION_FAILED");
    }
    if (!response.body || controller.signal.aborted) {
      void response.body?.cancel().catch(() => {});
      throw new Error("TRANSCRIPTION_FAILED");
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const maxBytes = options.maxStreamBytes ?? MAX_TRANSCRIPT_STREAM_BYTES;
    const maxChars = options.maxTextChars ?? MAX_TRANSCRIPT_TEXT_CHARS;
    let received = 0;
    let line = "";
    let previousCR = false;
    let dataLines: string[] = [];
    let deltas = "";
    let finalText: string | null = null;
    let completed = false;

    const dispatch = () => {
      const payload = dataLines.join("\n");
      dataLines = [];
      if (!payload) return;
      if (payload === "[DONE]") { completed = true; return; }
      const event: unknown = JSON.parse(payload);
      if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("TRANSCRIPTION_FAILED");
      const item = event as Record<string, unknown>;
      if (item.type === "error" || item.error) throw new Error("TRANSCRIPTION_FAILED");
      if (typeof item.type !== "string") return;
      if (item.type.endsWith(".delta") && typeof item.delta === "string") {
        deltas += item.delta;
        if (deltas.length > maxChars) throw new Error("TRANSCRIPTION_FAILED");
      } else if (item.type.endsWith(".done") && typeof item.text === "string") {
        if (item.text.length > maxChars) throw new Error("TRANSCRIPTION_FAILED");
        finalText = item.text;
        completed = true;
      }
    };
    const endLine = () => {
      if (!line) dispatch();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
      line = "";
    };
    // Preserve CR/LF state across network chunks (including a split CRLF).
    const consume = (text: string) => {
      for (const char of text) {
        if (char === "\r") { endLine(); previousCR = true; }
        else if (char === "\n") { if (!previousCR) endLine(); previousCR = false; }
        else { previousCR = false; line += char; }
      }
    };

    while (!completed) {
      const { done, value } = await reader.read();
      if (controller.signal.aborted) throw new Error("TRANSCRIPTION_FAILED");
      if (done) {
        consume(decoder.decode());
        if (line) endLine();
        if (dataLines.length) dispatch();
        break;
      }
      received += value.byteLength;
      if (received > maxBytes) throw new Error("TRANSCRIPTION_FAILED");
      consume(decoder.decode(value, { stream: true }));
    }
    // A network EOF after deltas alone is an incomplete result, never a success.
    if (!completed) throw new Error("TRANSCRIPTION_FAILED");
    const text = (finalText ?? deltas).trim();
    if (!text) throw new Error("NO_SPEECH");
    return text;
  };

  try {
    return await Promise.race([run(), deadline]);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["NO_SPEECH", "TRANSCRIPTION_CREDITS", "TRANSCRIPTION_RATE_LIMIT"].includes(code)) throw error;
    throw new Error("TRANSCRIPTION_FAILED");
  } finally {
    clearTimeout(timer);
    controller.abort();
    // Cleanup must not wait indefinitely on a broken stream's cancel callback.
    if (reader) {
      void reader.cancel().catch(() => {});
      try { reader.releaseLock(); } catch { /* An aborted read can still be settling. */ }
    }
  }
}
