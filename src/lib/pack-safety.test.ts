import { describe, expect, it } from "vitest";
import { approvalSnapshot, hasSellerApproval, needsSafetyDraft } from "./pack-safety";
import { checkMaterialInfo } from "./material-info";
import {
  coerceLegacyInput,
  coerceLegacyOutput,
  EMPTY_INPUT,
  type ListingOutput,
} from "./listing-types";
describe("safety drafts", () => {
  it("keeps seller-approved packs draft when must-fix information is missing", () => {
    expect(
      needsSafetyDraft(true, checkMaterialInfo({ ...EMPTY_INPUT, sellerApproved: true }), []),
    ).toBe(true);
  });
  it("keeps seller-approved packs draft when private output leaks", () => {
    expect(
      needsSafetyDraft(
        true,
        [],
        [{ term: "keysafe", kind: "private-leak", section: "personal message" }],
      ),
    ).toBe(true);
    expect(needsSafetyDraft(true, [], [])).toBe(false);
  });
  it("flags Part C Yes without details", () => {
    expect(
      checkMaterialInfo({ ...EMPTY_INPUT, planning: "Yes" }).some(
        (i) => i.field === "planning" && !i.ok && i.severity === "block",
      ),
    ).toBe(true);
  });
  it.each(["warn", "confirm"] as const)("keeps unresolved %s information draft", (severity) => {
    expect(
      needsSafetyDraft(
        true,
        [{ id: severity, field: "water", label: "Water", severity, message: "Review", ok: false }],
        [],
      ),
    ).toBe(true);
  });
  it("requires shared ownership full market value and lease review terms", () => {
    expect(
      checkMaterialInfo({ ...EMPTY_INPUT, sharePercent: "40", rent: "500" }).some(
        (i) => i.field === "fullMarketValue" && !i.ok,
      ),
    ).toBe(true);
    expect(
      checkMaterialInfo({ ...EMPTY_INPUT, tenure: "Leasehold", groundRent: "250" }).some(
        (i) => i.field === "groundRentReview" && !i.ok,
      ),
    ).toBe(true);
  });
});

describe("approval of an exact saved pack", () => {
  const id = "12345678-1234-1234-1234-123456789abc";
  const input = { ...EMPTY_INPUT, address: "12 Test Street", sellerApproved: true };
  const output: ListingOutput = {
    headline: "A home",
    listing: "Two bedrooms",
    summary: "A supplied home",
    keyFeatures: ["Two bedrooms"],
    emailBlast: null,
    social: [],
  };
  const approved = () => ({
    ...output,
    sellerApproval: {
      generationId: id,
      approvedAt: "2026-10-22T12:00:00.000Z",
      snapshot: approvalSnapshot(input, output),
    },
  });
  it("never trusts the old bare input flag", () => {
    expect(hasSellerApproval(input, output, id)).toBe(false);
    expect(coerceLegacyInput(input).sellerApproved).toBe(false);
  });
  it("preserves and recognises the approved exact revision on reopening", () => {
    expect(hasSellerApproval(coerceLegacyInput(input), coerceLegacyOutput(approved()), id)).toBe(
      true,
    );
    expect(hasSellerApproval(input, approved(), "different-generation")).toBe(false);
    expect(hasSellerApproval(input, approved(), null)).toBe(false);
  });
  it("invalidates approval after input, core or marketing changes", () => {
    expect(hasSellerApproval({ ...input, address: "14 Test Street" }, approved(), id)).toBe(false);
    expect(hasSellerApproval(input, { ...approved(), listing: "Changed wording" }, id)).toBe(false);
    expect(
      hasSellerApproval(
        input,
        { ...approved(), social: [{ platform: "X", caption: "New marketing", hashtags: [] }] },
        id,
      ),
    ).toBe(false);
    expect(
      hasSellerApproval(
        input,
        { ...approved(), revisionId: "98765432-1234-1234-1234-123456789abc" },
        id,
      ),
    ).toBe(false);
    expect(
      hasSellerApproval(
        input,
        { ...approved(), sellerEmail: { subject: "Review", body: "New seller email" } },
        id,
      ),
    ).toBe(false);
  });
  it("is independent of object key ordering and the obsolete approval flag", () => {
    const reordered = { ...input, sellerApproved: false };
    expect(approvalSnapshot(reordered, output)).toBe(approvalSnapshot(input, output));
    expect(
      approvalSnapshot(input, {
        social: [],
        emailBlast: null,
        keyFeatures: ["Two bedrooms"],
        summary: "A supplied home",
        listing: "Two bedrooms",
        headline: "A home",
      }),
    ).toBe(approvalSnapshot(input, output));
  });
});
