import { describe, expect, it } from "vitest";
import { applyFeatureCaveats, missingCaveats, requiredCaveats } from "./feature-caveats";

const A7 = {
  planning: "None known",
  disclosures:
    "Damp mark on bathroom ceiling from a cracked roof tile, repaired August 2026, not yet redecorated. Seller unaware of planning or building regulations approval for the lean-to utility.",
};

describe("feature caveats", () => {
  it("derives the caveat from the supplied sentence", () => {
    expect(requiredCaveats(A7)).toEqual([
      expect.objectContaining({ key: "lean-to", caveat: "no known planning or building regulations approval" }),
    ]);
  });
  it("A7 compound bullet: split, caveated, ≤ 80 chars", () => {
    const out = applyFeatureCaveats(
      ["Kitchen/diner 5.45m x 2.90m (17'11\" x 9'6\") and lean-to utility", "Three bedrooms"],
      A7,
    );
    expect(out).toContain("Kitchen/diner 5.45m x 2.90m (17'11\" x 9'6\")");
    expect(out).toContain("Lean-to utility (no known planning or building regulations approval)");
    expect(out.every((f) => f.length <= 80)).toBe(true);
    expect(missingCaveats(out, A7)).toEqual([]);
  });
  it("short bullet gets the caveat appended", () => {
    expect(applyFeatureCaveats(["Lean-to utility room"], A7)).toEqual([
      "Lean-to utility room (no known planning or building regulations approval)",
    ]);
  });
  it("catches spelling variants", () => {
    expect(missingCaveats(["Lean to utility", "Leanto store"], A7)).toHaveLength(2);
  });
  it("leaves an already caveated bullet alone", () => {
    const f = ["Lean-to utility (no known building regs)"];
    expect(applyFeatureCaveats(f, A7)).toEqual(f);
  });
  it("planning-only wording stays planning-only", () => {
    const r = requiredCaveats({ planning: "No planning permission for the conservatory.", disclosures: "" });
    expect(r[0]).toMatchObject({ key: "conservatory", caveat: "no known planning approval" });
    expect(missingCaveats(["Sunroom overlooking the garden"], { planning: "No planning permission for the conservatory.", disclosures: "" })).toHaveLength(1);
  });
  it("positive approval statements add nothing", () => {
    expect(requiredCaveats({ planning: "Extension built 2019 with planning approval and building regulations sign-off.", disclosures: "" })).toEqual([]);
  });
  it("drops the structure from a full 10-bullet list rather than leave it uncaveated", () => {
    const ten = Array.from({ length: 9 }, (_, i) => `Feature ${i}`);
    ten.push("Kitchen/diner 5.45m x 2.90m (17'11\" x 9'6\") with a lean-to utility beyond");
    const out = applyFeatureCaveats(ten, A7);
    expect(out).toHaveLength(10);
    expect(missingCaveats(out, A7)).toEqual([]);
  });
});
