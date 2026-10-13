import { describe, expect, it } from "vitest";
import { applyDictation, FIELD_DEFS, fieldRows } from "./listing-fields";

describe("applyDictation", () => {
  it("replaces single values", () => {
    expect(applyDictation("replace", "3", "4")).toBe("4");
  });
  it("appends with the right separator", () => {
    expect(applyDictation("append-semicolon", "Log burner", "south-facing garden.")).toBe(
      "Log burner; south-facing garden",
    );
    expect(applyDictation("append-comma", "Driveway", "garage")).toBe("Driveway, garage");
    expect(applyDictation("append-space", "Near the station.", "Two schools.")).toBe(
      "Near the station. Two schools.",
    );
    expect(applyDictation("append-comma", "", "Driveway.")).toBe("Driveway");
  });
});

describe("FIELD_DEFS", () => {
  it("has unique keys and groups rooms into one row", () => {
    const keys = FIELD_DEFS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    const rows = fieldRows(FIELD_DEFS.filter((d) => d.section === "rooms"));
    expect(rows.find((r) => r[0].key === "bedrooms")?.map((d) => d.key)).toEqual([
      "bedrooms",
      "bathrooms",
      "receptions",
    ]);
  });
});

import { normaliseFieldValue } from "./listing-fields";
describe("normaliseFieldValue", () => {
  it("maps spoken answers onto select options", () => {
    expect(normaliseFieldValue("priceQualifier", "OIEO")).toBe("Offers in Excess of");
    expect(normaliseFieldValue("priceQualifier", "offers over")).toBe("Offers Over");
    expect(normaliseFieldValue("priceQualifier", "guide price.")).toBe("Guide Price");
    expect(normaliseFieldValue("tenure", "share of freehold")).toBe("Share of freehold");
    expect(normaliseFieldValue("councilTaxBand", "band d")).toBe("D");
    expect(normaliseFieldValue("epc", "EPC C")).toBe("C");
    expect(normaliseFieldValue("sewerage", "septic tank")).toBe("Septic tank");
    expect(normaliseFieldValue("tenure", "no idea")).toBeNull();
  });
  it("handles Part C and chips", () => {
    expect(normaliseFieldValue("flooding", "none known")).toBe("None known");
    expect(normaliseFieldValue("flooding", "yes, flooded in 2007")).toBe("Yes – flooded in 2007");
    expect(normaliseFieldValue("targetAudience", "first time buyers and investors")).toBe(
      "First-time buyer, Investor",
    );
  });
});
