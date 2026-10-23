import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callTranscription } from "./transcription.server";

beforeEach(() => vi.stubEnv("LOVABLE_API_KEY", "synthetic-test-key"));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const encoder = new TextEncoder();
const audio = () => ({ file: new File(["synthetic audio"], "note.webm", { type: "audio/webm" }), lang: "en-GB", type: "audio/webm" });
const frame = (event: unknown) => `data: ${JSON.stringify(event)}\n\n`;
function responseFrom(chunks: Uint8Array[]) {
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); },
  }), { headers: { "Content-Type": "text/event-stream" } });
}
const fetchResponse = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response);

describe("bounded transcription provider stream", () => {
  it("handles UTF-8 and CRLF split across individual network bytes", async () => {
    const stream = (
      frame({ type: "transcript.text.delta", delta: "Wrong preview" }) +
      frame({ type: "transcript.text.done", text: " Three bedrooms, £450,000. " })
    ).replace(/\n/g, "\r\n");
    const response = responseFrom([...encoder.encode(stream)].map(byte => new Uint8Array([byte])));
    const fetchMock = fetchResponse(response);
    expect(await callTranscription(audio(), { fetch: fetchMock })).toBe("Three bedrooms, £450,000.");
    expect(response.body?.locked).toBe(false);
    const request = fetchMock.mock.calls[0][1]!;
    expect(request.signal?.aborted).toBe(true);
    const form = request.body as FormData;
    expect(form.get("languages")).toBe("en");
    expect((form.get("file") as File).type).toBe("audio/webm");
  });

  it("supports multiline SSE data and an unseparated final event", async () => {
    const stream = ': keepalive\n\ndata: {"type":"transcript.text.done",\ndata: "text":"Two bathrooms"}';
    expect(await callTranscription(audio(), { fetch: fetchResponse(responseFrom([encoder.encode(stream)])) })).toBe("Two bathrooms");
  });

  it("accepts completed deltas with a terminal DONE marker", async () => {
    const stream = frame({ type: "transcript.text.delta", delta: "A terrace." }) + "data: [DONE]\n\n";
    expect(await callTranscription(audio(), { fetch: fetchResponse(responseFrom([encoder.encode(stream)])) })).toBe("A terrace.");
  });

  it.each([
    frame({ type: "transcript.text.delta", delta: "Partial notes" }),
    "data: not valid JSON\n\n",
    frame({ type: "error", error: { message: "private provider detail" } }),
  ])("rejects partial or malformed streams without exposing their contents", async stream => {
    const response = responseFrom([encoder.encode(stream)]);
    await expect(callTranscription(audio(), { fetch: fetchResponse(response) })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    expect(response.body?.locked).toBe(false);
  });

  it("rejects truncated UTF-8 and a network error after partial output", async () => {
    await expect(callTranscription(audio(), { fetch: fetchResponse(responseFrom([new Uint8Array([0xc2])])) })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    const response = new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.error(new Error("private network detail")); },
    }));
    await expect(callTranscription(audio(), { fetch: fetchResponse(response) })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    expect(response.body?.locked).toBe(false);
  });

  it("bounds cumulative raw bytes even when frames are repeatedly cleared", async () => {
    const response = responseFrom(Array.from({ length: 20 }, () => encoder.encode(": heartbeat\n\n")));
    await expect(callTranscription(audio(), { fetch: fetchResponse(response), maxStreamBytes: 100 })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    expect(response.body?.locked).toBe(false);
  });

  it.each([
    frame({ type: "transcript.text.done", text: "abcdef" }),
    frame({ type: "transcript.text.delta", delta: "abcd" }) + frame({ type: "transcript.text.delta", delta: "ef" }),
  ])("bounds both final text and accumulated deltas", async stream => {
    await expect(callTranscription(audio(), { fetch: fetchResponse(responseFrom([encoder.encode(stream)])), maxTextChars: 5 })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
  });

  it("returns NO_SPEECH only for a completed empty transcript", async () => {
    const response = responseFrom([encoder.encode(frame({ type: "transcript.text.done", text: "  " }))]);
    await expect(callTranscription(audio(), { fetch: fetchResponse(response) })).rejects.toThrow(/^NO_SPEECH$/);
  });

  it("enforces the deadline even if fetching ignores the abort signal", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {}));
    await expect(callTranscription(audio(), { fetch: fetchMock, deadlineMs: 15 })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("times out a stalled stream and never waits on a broken cancellation callback", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const response = new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(encoder.encode(frame({ type: "transcript.text.delta", delta: "Partial" }))); },
      cancel,
    }));
    await expect(callTranscription(audio(), { fetch: fetchResponse(response), deadlineMs: 15 })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    expect(cancel).toHaveBeenCalledOnce();
    expect(response.body?.locked).toBe(false);
  });

  it.each([[402, "TRANSCRIPTION_CREDITS"], [429, "TRANSCRIPTION_RATE_LIMIT"], [500, "TRANSCRIPTION_FAILED"]])("maps HTTP %i without reading or logging its private body", async (status, code) => {
    const response = new Response("private provider details", { status: Number(status) });
    const read = vi.spyOn(response, "text");
    const log = vi.spyOn(console, "error");
    await expect(callTranscription(audio(), { fetch: fetchResponse(response) })).rejects.toThrow(new RegExp(`^${code}$`));
    expect(read).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
  });

  it("does not invoke a provider when credentials are unavailable", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "");
    const fetchMock = vi.fn<typeof fetch>();
    await expect(callTranscription(audio(), { fetch: fetchMock })).rejects.toThrow(/^TRANSCRIPTION_FAILED$/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
