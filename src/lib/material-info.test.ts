import { describe, expect, it } from "vitest";
import {
  buildMaterialInfoBlock,
  checkMaterialInfo,
  partCConflicts,
  summariseChecks,
} from "./material-info";
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

describe("Part C conflicts with Known issues", () => {
  it.each([
    ["planning", "Seller unaware of planning or building regulations approval for the lean-to."],
    ["planning", "Conservatory built without consent."],
    ["planning", "Unapproved loft conversion."],
    ["flooding", "Garage flooded in 2020."],
    ["rightsEasements", "Neighbour has a right of way over the drive."],
    ["rightsEasements", "Shared driveway with number 4."],
    ["restrictions", "Restrictive covenant against business use."],
    ["restrictions", "Oak in the front garden has a TPO."],
  ])("%s: %s", (key, disclosures) => {
    const input = { ...freehold, disclosures };
    expect(partCConflicts(input)).toContain(key);
    expect(buildMaterialInfoBlock(input)).toMatch(/: See known issues/);
    const item = checkMaterialInfo(input).find((i) => i.id === `conflict-${key}`);
    expect(item?.severity).toBe("conflict");
    expect(item?.ok).toBe(false);
  });
  it("leaves None known alone when Known issues is unrelated", () => {
    const input = { ...freehold, disclosures: "Boiler serviced annually." };
    expect(partCConflicts(input)).toEqual([]);
    expect(buildMaterialInfoBlock(input)).toContain("Planning: None known");
  });
});

describe("v2 material-info fixes", () => {
  it("only appends 'per year' to numeric ground rent", () => {
    const peppercorn = buildMaterialInfoBlock({ ...LEASEHOLD_EXAMPLE, groundRent: "Peppercorn", groundRentReview: "" });
    expect(peppercorn).toContain("Ground rent: Peppercorn\n");
    expect(buildMaterialInfoBlock(LEASEHOLD_EXAMPLE)).toContain("Ground rent: £250 per year");
  });
  it("words council tax for not yet banded / exempt", () => {
    expect(buildMaterialInfoBlock({ ...freehold, councilTaxBand: "Not yet banded" })).toContain(
      "Council Tax: not yet banded",
    );
    expect(buildMaterialInfoBlock({ ...freehold, councilTaxBand: "Exempt" })).toContain("Council Tax: Exempt");
  });
  it("treats a filled share % as shared ownership", () => {
    const b = buildMaterialInfoBlock({ ...freehold, sharePercent: "40", rent: "520" });
    expect(b).toContain("40% share");
  });
  it("marks a predicted EPC and adds sale-type lines", () => {
    const b = buildMaterialInfoBlock({
      ...freehold,
      epc: "B",
      epcPredicted: "Yes",
      saleMethod: "Modern Method of Auction",
      auctionTerms: "56-day reservation period",
      reservationFee: "4.2% inc. VAT (min £6,000)",
      estateCharge: "295",
    });
    expect(b).toContain("EPC rating: B (predicted)");
    expect(b).toContain("Sale method: Modern Method of Auction");
    expect(b).toContain("Reservation fee: 4.2% inc. VAT (min £6,000)");
    expect(b).toContain("Estate / management charge: £295 per year");
  });
  it("blocks From without a new home and auctions without terms; warns on event fees", () => {
    const c = checkMaterialInfo({
      ...freehold,
      priceQualifier: "From",
      saleMethod: "Traditional auction",
      ageRestriction: "Over-60s",
    });
    expect(c.find((i) => i.field === "newBuild")?.ok).toBe(false);
    expect(c.find((i) => i.field === "auctionTerms")?.severity).toBe("block");
    expect(c.find((i) => i.field === "eventFees")?.severity).toBe("warn");
  });
});
