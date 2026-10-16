import { describe, expect, it, vi } from "vitest";
import { finalizeOrRelease, releaseSlot, type ReadSlot, type SlotRpc, type SlotStatus } from "./quota-slot";

/** In-memory model of one generation_usage row with the real DB semantics. */
function db(opts: {
  finalize: "ok" | "error" | "false" | "throw" | "commit-then-throw" | "partial";
  release?: "ok" | "error" | "throw";
  read?: "ok" | "fail" | "fail-second";
}) {
  let row: "reserved" | "completed" | null = "reserved";
  let reads = 0;
  const calls: string[] = [];
  const rpc: SlotRpc = vi.fn(async (fn) => {
    calls.push(fn);
    if (fn === "finalize_generation_slot") {
      if (opts.finalize === "ok") {
        row = "completed";
        return { data: true, error: null };
      }
      if (opts.finalize === "commit-then-throw") {
        row = "completed";
        throw new Error("network: response lost");
      }
      if (opts.finalize === "partial") return { data: true, error: { message: "partial" } };
      if (opts.finalize === "throw") throw new Error("network");
      if (opts.finalize === "false") return { data: false, error: null };
      return { data: null, error: { message: "boom" } };
    }
    if (opts.release === "throw") throw new Error("network");
    if (opts.release === "error") return { data: null, error: { message: "x" } };
    const ok = row === "reserved";
    if (ok) row = null;
    return { data: ok, error: null };
  });
  const read: ReadSlot = async () => {
    reads++;
    if (opts.read === "fail" || (opts.read === "fail-second" && reads > 1)) throw new Error("read failed");
    return (row ?? "missing") as SlotStatus;
  };
  return { rpc, read, calls, row: () => row };
}

describe("finalizeOrRelease", () => {
  it("success: finalizes once and never releases", async () => {
    const d = db({ finalize: "ok" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("finalized");
    expect(d.calls).toEqual(["finalize_generation_slot"]);
    expect(d.row()).toBe("completed");
  });
  it("committed but response lost: treated as finalized, never released", async () => {
    const d = db({ finalize: "commit-then-throw" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("finalized");
    expect(d.calls).not.toContain("release_generation_slot");
    expect(d.row()).toBe("completed");
  });
  it("RPC error, nothing committed: releases", async () => {
    const d = db({ finalize: "error" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("released");
    expect(d.row()).toBe(null);
  });
  it("returns false: releases", async () => {
    const d = db({ finalize: "false" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("released");
  });
  it("throws without commit: releases", async () => {
    const d = db({ finalize: "throw" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("released");
  });
  it("partial error (data true + error) with no commit: releases", async () => {
    const d = db({ finalize: "partial" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("released");
  });
  it("release fails: unresolved, row left to expire", async () => {
    const d = db({ finalize: "error", release: "error" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("unresolved");
    expect(d.row()).toBe("reserved");
  });
  it("release throws: unresolved", async () => {
    const d = db({ finalize: "throw", release: "throw" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("unresolved");
  });
  it("status read fails: unresolved, no release attempted", async () => {
    const d = db({ finalize: "throw", read: "fail" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("unresolved");
    expect(d.calls).not.toContain("release_generation_slot");
  });
  it("confirming read after release fails: unresolved", async () => {
    const d = db({ finalize: "error", read: "fail-second" });
    expect(await finalizeOrRelease(d.rpc, d.read, "u", "r", "g")).toBe("unresolved");
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
