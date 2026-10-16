import { describe, expect, it } from "vitest";
import { applyFeatureCaveats, caveatsForReview, missingCaveats, requiredCaveats } from "./feature-caveats";

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
  it("leaves a correctly caveated bullet alone", () => {
    const f = ["Lean-to utility (no known planning or building regs approval)"];
    expect(applyFeatureCaveats(f, A7)).toEqual(f);
  });
  it("partial caveat (regs only) does not satisfy a both-kinds requirement", () => {
    expect(missingCaveats(["Lean-to utility (no known building regs)"], A7)).toHaveLength(1);
    expect(applyFeatureCaveats(["Lean-to utility (no known building regs)"], A7)).toEqual([
      "Lean-to utility (no known planning or building regulations approval)",
    ]);
  });
  it("positive approval plus 'no known issues' adds nothing", () => {
    expect(requiredCaveats({ planning: "Extension has planning approval and no known issues.", disclosures: "" })).toEqual([]);
  });
  it("generic missing approval stays generic — no building regs invented", () => {
    const inp = { planning: "", disclosures: "No approval for the porch." };
    expect(requiredCaveats(inp)).toEqual([expect.objectContaining({ key: "porch", caveat: "no known approval" })]);
    expect(applyFeatureCaveats(["Enclosed porch"], inp)).toEqual(["Enclosed porch (no known approval)"]);
  });
  it("planning granted but building regs unknown → regs-only caveat", () => {
    const inp = { planning: "Planning granted for the extension, but building regulations sign-off is unknown.", disclosures: "" };
    expect(requiredCaveats(inp)).toEqual([
      expect.objectContaining({ key: "extension", caveat: "no known building regulations approval" }),
    ]);
  });
  it("a wrong positive caveat in the output does not satisfy the requirement", () => {
    expect(missingCaveats(["Lean-to utility (planning approved)"], A7)).toHaveLength(1);
    expect(applyFeatureCaveats(["Lean-to utility (planning approved)"], A7)).toEqual([
      "Lean-to utility (no known planning or building regulations approval)",
    ]);
  });
  it("multiple structures: one caveat can't hide another", () => {
    const inp = { planning: "No planning approval for the lean-to. No building regulations approval for the porch.", disclosures: "" };
    const out = applyFeatureCaveats(["Lean-to and porch (no known planning approval)", "Garden"], inp);
    expect(out).toContain("Lean-to (no known planning approval)");
    expect(out).toContain("Porch (no known building regulations approval)");
    expect(missingCaveats(out, inp)).toEqual([]);
  });
  it("ambiguous wording across two structures: no assertion, flagged and removed from bullets", () => {
    const inp = { planning: "The lean-to and porch were added later, approval unknown.", disclosures: "" };
    // "approval unknown" clause names no structure and the sentence has two → review.
    expect(requiredCaveats(inp)).toEqual([]);
    expect(caveatsForReview(inp).sort()).toEqual(["lean-to", "porch"]);
    const out = applyFeatureCaveats(["Lean-to store", "Two bedrooms"], inp);
    expect(out).toEqual(["Two bedrooms"]);
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
