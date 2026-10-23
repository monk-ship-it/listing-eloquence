import { describe, expect, it, vi } from "vitest";
import { reserveProviderCall, settleProviderCall } from "./provider-quota";

const db = (result: unknown, throws = false) =>
  ({
    rpc: vi.fn(async () => {
      if (throws) throw new Error("network");
      return result;
    }),
  }) as never;

describe("provider quota reservations", () => {
  it("returns the reservation id on success", async () => {
    await expect(reserveProviderCall(db({ data: "r1", error: null }), "u", "extract")).resolves.toBe("r1");
  });
  it("maps daily limit to per-kind codes", async () => {
    const lim = { data: null, error: { message: "PROVIDER_LIMIT_REACHED" } };
    await expect(reserveProviderCall(db(lim), "u", "extract")).rejects.toThrow("EXTRACT_LIMIT_REACHED");
    await expect(reserveProviderCall(db(lim), "u", "marketing")).rejects.toThrow("REGEN_LIMIT_REACHED");
    await expect(reserveProviderCall(db(lim), "u", "transcribe")).rejects.toThrow("TRANSCRIPTION_DAILY_LIMIT");
  });
  it("maps byte budget exhaustion to the limit code", async () => {
    const r = db({ data: null, error: { message: "PROVIDER_BYTES_EXCEEDED" } });
    await expect(reserveProviderCall(r, "u", "transcribe", 5)).rejects.toThrow("TRANSCRIPTION_DAILY_LIMIT");
  });
  it("maps in-flight to busy", async () => {
    const r = db({ data: null, error: { message: "PROVIDER_IN_FLIGHT" } });
    await expect(reserveProviderCall(r, "u", "transcribe")).rejects.toThrow("TRANSCRIPTION_RATE_LIMIT");
  });
  it("fails closed on unknown errors, empty ids and thrown calls", async () => {
    await expect(reserveProviderCall(db({ data: null, error: { message: "x" } }), "u", "extract")).rejects.toThrow("AI_UNAVAILABLE");
    await expect(reserveProviderCall(db({ data: "", error: null }), "u", "extract")).rejects.toThrow("AI_UNAVAILABLE");
    await expect(reserveProviderCall(db(null, true), "u", "transcribe")).rejects.toThrow("TRANSCRIPTION_FAILED");
  });
  it("settle never throws", async () => {
    await expect(settleProviderCall(db(null, true), "u", "r", false)).resolves.toBeUndefined();
    await expect(settleProviderCall(db({ error: { message: "x" } }), "u", "r", true)).resolves.toBeUndefined();
  });
});
