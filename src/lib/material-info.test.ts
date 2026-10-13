import { describe, expect, it } from "vitest";
import { buildMaterialInfoBlock, checkMaterialInfo, summariseChecks } from "./material-info";
import { EMPTY_INPUT, LEASEHOLD_EXAMPLE, type ListingInput } from "./listing-types";

const freehold: ListingInput = {
  ...EMPTY_INPUT,
  price: "425,000",
  priceQualifier: "Guide Price",
  tenure: "Freehold",
  councilTaxBand: "D",
  localAuthority: "Medway Council",
  epc: "C",
  construction: "Standard",
  electricity: "Mains",
  water: "Mains",
  waterMetered: "Yes",
  sewerage: "Mains",
  heating: "Gas central heating",
  broadband: "FTTP",
  mobileSignal: "Good outdoor coverage",
  parking: "Driveway for two cars",
  buildingSafety: "None known",
  restrictions: "None known",
  rightsEasements: "None known",
  flooding: "None known",
  coastalErosion: "None known",
  planning: "None known",
  accessibility: "None known",
  coalfieldMining: "None known",
  sellerApproved: true,
};

describe("buildMaterialInfoBlock", () => {
  it("formats the leasehold example", () => {
    const block = buildMaterialInfoBlock(LEASEHOLD_EXAMPLE);
    expect(block).toContain("Price: Offers in Excess of £235,000");
    expect(block).toContain("Tenure: Leasehold · 112 years remaining");
    expect(block).toContain("Ground rent: £250 per year (reviewed every 25 years)");
    expect(block).toContain("Service charge: £1,840 per year (y/e Mar 2026)");
    expect(block).toContain("Council Tax: Band C (Medway Council)");
    expect(block).toContain("EPC rating: C");
    expect(block).toContain(
      "Electricity: Mains · Water: Mains (metered) · Sewerage: Mains · Heating: Electric panel heaters",
    );
    expect(block).toContain("Broadband: FTTP");
  });
  it("never prints placeholders or 'capped'", () => {
    const block = buildMaterialInfoBlock({
      ...LEASEHOLD_EXAMPLE,
      epc: "TBC",
      mobileSignal: "Ask agent",
      groundRentReview: "capped at £500",
    });
    expect(block).not.toMatch(/TBC|Ask agent|capped/i);
    expect(block).not.toContain("EPC rating");
  });
  it("prints Part C answers", () => {
    expect(buildMaterialInfoBlock(freehold)).toContain("Flooding: None known");
    expect(buildMaterialInfoBlock({ ...freehold, flooding: "Yes – flooded in 2007" })).toContain(
      "Flooding: flooded in 2007",
    );
  });
});

describe("checkMaterialInfo", () => {
  it("blocks a leasehold flat with no ground rent", () => {
    const items = checkMaterialInfo({ ...LEASEHOLD_EXAMPLE, groundRent: "" });
    const gr = items.find((i) => i.field === "groundRent");
    expect(gr?.severity).toBe("block");
    expect(gr?.ok).toBe(false);
  });
  it("shows 0 must-fix for a complete freehold house", () => {
    const s = summariseChecks(checkMaterialInfo(freehold));
    expect(s.mustFix).toBe(0);
    expect(s.open).toHaveLength(0);
  });
  it("requires seller approval and treats unanswered Part C as confirm", () => {
    const s = summariseChecks(
      checkMaterialInfo({ ...freehold, sellerApproved: false, flooding: "" }),
    );
    expect(s.mustFix).toBe(1);
    expect(s.open.find((i) => i.field === "flooding")?.severity).toBe("confirm");
  });
  it("flags missing shared ownership details", () => {
    const items = checkMaterialInfo({ ...freehold, priceQualifier: "Shared Ownership" });
    expect(items.filter((i) => !i.ok && i.severity === "block").map((i) => i.field)).toEqual([
      "sharePercent",
      "rent",
    ]);
  });
});
