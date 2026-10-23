import { afterEach, describe, expect, it, vi } from "vitest";
import { reserveProviderCall, settleProviderCall } from "./provider-quota";

afterEach(() => vi.restoreAllMocks());
const user = "00000000-0000-4000-8000-000000000001";
const reservation = "00000000-0000-4000-8000-000000000002";

describe("provider reservation adapter", () => {
  it("passes the verified user, kind and bytes to the reservation RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: reservation, error: null });
    expect(await reserveProviderCall({ rpc }, user, "transcribe", 123)).toBe(reservation);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("reserve_provider_call", { _user_id: user, _kind: "transcribe", _bytes: 123 });
  });

  it.each([
    ["extract", "PROVIDER_LIMIT_REACHED", "EXTRACT_LIMIT_REACHED"],
    ["marketing", "PROVIDER_LIMIT_REACHED", "REGEN_LIMIT_REACHED"],
    ["transcribe", "PROVIDER_BYTES_EXCEEDED", "TRANSCRIPTION_DAILY_LIMIT"],
    ["extract", "PROVIDER_IN_FLIGHT", "RATE_LIMIT"],
    ["transcribe", "PROVIDER_IN_FLIGHT", "TRANSCRIPTION_RATE_LIMIT"],
  ] as const)("maps %s reservation failure without leaking database details", async (kind, message, code) => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: `database: ${message}` } });
    await expect(reserveProviderCall({ rpc }, user, kind)).rejects.toThrow(new RegExp(`^${code}$`));
  });

  it("fails closed on thrown errors, returned errors and absent reservation IDs", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const rpc of [
      vi.fn().mockRejectedValue(new Error("private database detail")),
      vi.fn().mockResolvedValue({ data: null, error: { message: "private database detail" } }),
      vi.fn().mockResolvedValue({ data: null, error: null }),
    ]) await expect(reserveProviderCall({ rpc }, user, "extract")).rejects.toThrow(/^AI_UNAVAILABLE$/);
  });

  it("settles once using its user and keeps failed tracking writes conservative", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    await settleProviderCall({ rpc }, user, reservation, false);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("settle_provider_call", { _user_id: user, _reservation_id: reservation, _succeeded: false });
    await expect(settleProviderCall({ rpc: vi.fn().mockRejectedValue(new Error("offline")) }, user, reservation, true)).resolves.toBeUndefined();
    await expect(settleProviderCall({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "offline" } }) }, user, reservation, true)).resolves.toBeUndefined();
  });
});
