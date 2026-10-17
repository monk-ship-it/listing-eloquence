import { describe, expect, it } from "vitest";
import { needsSafetyDraft } from "./pack-safety";
import { checkMaterialInfo } from "./material-info";
import { EMPTY_INPUT } from "./listing-types";
describe("safety drafts", () => {
  it("keeps seller-approved packs draft when must-fix information is missing", () => {
    expect(needsSafetyDraft(true, checkMaterialInfo({ ...EMPTY_INPUT, sellerApproved: true }), [])).toBe(true);
  });
  it("keeps seller-approved packs draft when private output leaks", () => {
    expect(needsSafetyDraft(true, [], [{ term: "keysafe", kind: "private-leak", section: "personal message" }])).toBe(true);
    expect(needsSafetyDraft(true, [], [])).toBe(false);
  });
  it("flags Part C Yes without details", () => {
    expect(checkMaterialInfo({ ...EMPTY_INPUT, planning: "Yes" }).some(i => i.field === "planning" && !i.ok && i.severity === "block")).toBe(true);
  });
  it("requires shared ownership full market value and lease review terms", () => {
    expect(checkMaterialInfo({ ...EMPTY_INPUT, sharePercent: "40", rent: "500" }).some(i => i.field === "fullMarketValue" && !i.ok)).toBe(true);
    expect(checkMaterialInfo({ ...EMPTY_INPUT, tenure: "Leasehold", groundRent: "250" }).some(i => i.field === "groundRentReview" && !i.ok)).toBe(true);
  });
});