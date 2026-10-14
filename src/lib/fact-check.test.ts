import { describe, expect, it } from "vitest";
import { checkText, factCheckPack, keyFeatureCaveatFlags } from "./fact-check";

const inputs =
  "Four bed semi on Brenzett Close, Chatham. Guide price 350,000. Living room 5.20m x 4.10m. Victorian fireplace.";

describe("fact check", () => {
  it("flags an invented storey count", () => {
    const f = checkText("The house is arranged over three floors.", "description", inputs);
    expect(f.map((x) => x.term.toLowerCase())).toContain("arranged over three floors");
  });
  it("flags an invented era", () => {
    const f = checkText("A fine Georgian house.", "description", inputs);
    expect(f.some((x) => x.term === "Georgian")).toBe(true);
  });
  it("allows supplied facts, conversions and number words", () => {
    const f = checkText(
      "Guide Price £350,000. Four bedrooms on Brenzett Close, Chatham. Living room 5.20m x 4.10m (17'1\" x 13'5\"). A Victorian fireplace.",
      "description",
      inputs,
    );
    expect(f).toEqual([]);
  });
  it("flags invented places and numbers", () => {
    const f = checkText("Walk to Rochester station in 10 minutes.", "description", inputs);
    expect(f.map((x) => x.term)).toEqual(expect.arrayContaining(["Rochester", "10"]));
  });
  it("flags banned phrases and contact details in portal copy", () => {
    const f = factCheckPack(
      { listing: "A stunning home. Call 01634 123456 or visit www.agent.co.uk" },
      inputs,
    );
    expect(f.filter((x) => x.kind === "banned").map((x) => x.term)).toContain("stunning");
    expect(f.filter((x) => x.kind === "contact").length).toBeGreaterThan(0);
  });
});

describe("list markers", () => {
  it("ignores numbered-list markers at the start of a line", () => {
    const f = checkText(
      "Please check:\n6. Tenure: Freehold\n14) EPC rating\n 7: Parking",
      "seller email",
      inputs,
    );
    expect(f.filter((x) => x.rule === "number")).toEqual([]);
  });
  it("still flags invented numbers inside a line", () => {
    const f = checkText("1. Please reply within 14 days.", "seller email", inputs);
    expect(f.map((x) => x.term)).toContain("14");
  });
});

describe("keyFeatureCaveatFlags", () => {
  const issues =
    "Damp mark on bathroom ceiling from a cracked roof tile, repaired August 2026, not yet redecorated. Seller unaware of planning or building regulations approval for the lean-to utility.";
  it("flags a feature that names a known-issue item without its caveat", () => {
    const f = keyFeatureCaveatFlags(
      ["Lean-to utility", "Gas central heating", "Bathroom with shower over bath"],
      issues,
    );
    expect(f.map((x) => x.term)).toEqual(["Lean-to utility", "Bathroom with shower over bath"]);
  });
  it("accepts features that keep their caveat", () => {
    const f = keyFeatureCaveatFlags(
      [
        "Lean-to utility (no known planning or building regulations approval)",
        "Roof tile repaired August 2026, bathroom ceiling not yet redecorated",
      ],
      issues,
    );
    expect(f).toEqual([]);
  });
  it("does nothing without known issues", () => {
    expect(keyFeatureCaveatFlags(["Lean-to utility"], "")).toEqual([]);
  });
});
