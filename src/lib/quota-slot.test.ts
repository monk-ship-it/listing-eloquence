import { describe, expect, it, vi } from "vitest";
import { finalizeOrRelease, releaseSlot, type SlotRpc } from "./quota-slot";

function mock(finalize: () => Promise<{ data: unknown; error: unknown }>) {
  const calls: string[] = [];
  const rpc: SlotRpc = vi.fn(async (fn) => {
    calls.push(fn);
    if (fn === "finalize_generation_slot") return finalize();
    return { data: true, error: null };
  });
  return { rpc, calls };
}

describe("finalizeOrRelease", () => {
  it("success: finalizes once and never releases", async () => {
    const { rpc, calls } = mock(async () => ({ data: true, error: null }));
    expect(await finalizeOrRelease(rpc, "u", "r", "g")).toBe(true);
    expect(calls).toEqual(["finalize_generation_slot"]);
  });
  it("RPC error: releases the reservation", async () => {
    const { rpc, calls } = mock(async () => ({ data: null, error: { message: "boom" } }));
    expect(await finalizeOrRelease(rpc, "u", "r", "g")).toBe(false);
    expect(calls).toEqual(["finalize_generation_slot", "release_generation_slot"]);
  });
  it("returns false: releases the reservation", async () => {
    const { rpc, calls } = mock(async () => ({ data: false, error: null }));
    expect(await finalizeOrRelease(rpc, "u", "r", "g")).toBe(false);
    expect(calls).toContain("release_generation_slot");
  });
  it("throws: releases the reservation", async () => {
    const { rpc, calls } = mock(async () => {
      throw new Error("network");
    });
    expect(await finalizeOrRelease(rpc, "u", "r", "g")).toBe(false);
    expect(calls).toContain("release_generation_slot");
  });
  it("partial error with data true still counts as failure and releases", async () => {
    const { rpc, calls } = mock(async () => ({ data: true, error: { message: "partial" } }));
    expect(await finalizeOrRelease(rpc, "u", "r", "g")).toBe(false);
    expect(calls).toContain("release_generation_slot");
  });
});

describe("releaseSlot", () => {
  it("no reservation: no call", async () => {
    const rpc = vi.fn() as unknown as SlotRpc;
    expect(await releaseSlot(rpc, "u", null)).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("release error is swallowed", async () => {
    const rpc: SlotRpc = async () => ({ data: null, error: { message: "x" } });
    expect(await releaseSlot(rpc, "u", "r")).toBe(false);
  });
});
