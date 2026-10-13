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
    const rows = fieldRows(FIELD_DEFS.filter((d) => d.section === "details"));
    expect(rows.find((r) => r[0].key === "bedrooms")?.map((d) => d.key)).toEqual([
      "bedrooms",
      "bathrooms",
      "receptions",
    ]);
  });
});
