import { describe, expect, it } from "vitest";
import { checkText, factCheckPack, keyFeatureCaveatFlags, privateLeakFlags, publicInputsToText } from "./fact-check";

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

describe("price abbreviations", () => {
  it("accepts £350k for a supplied 350,000 but flags an invented one", () => {
    expect(checkText("Guide £350k", "email", inputs).filter((x) => x.rule === "number")).toEqual(
      [],
    );
    expect(checkText("Guide £360k", "email", inputs).map((x) => x.term)).toContain("£360k");
  });
});

describe("exported facts and privacy", () => {
  it("checks personal messages for private access instructions", () => {
    expect(privateLeakFlags({ emailBlast: { personalMessage: "The keysafe code is 9876." } }, { showingNotes: "keysafe code 9876", bedrooms: "2" }).some(f => f.kind === "private-leak")).toBe(true);
  });
  it("checks every additional exported marketing field for private leaks", () => {
    for (const pack of [{ emailBlast: { callToAction: "Use keysafe 9876" } }, { sellerEmail: { subject: "Use keysafe 9876" } }, { social: [{ platform: "X", caption: "View today", hashtags: ["keysafe 9876"] }] }]) {
      expect(privateLeakFlags(pack, { showingNotes: "keysafe code 9876", bedrooms: "2" }).some(f => f.kind === "private-leak")).toBe(true);
    }
  });
  it("checks personal message, CTA and seller subject for unsupported facts", () => {
    for (const pack of [{ emailBlast: { personalMessage: "Three bedrooms." } }, { emailBlast: { callToAction: "View three bedrooms" } }, { sellerEmail: { subject: "Three bedrooms" } }]) expect(factCheckPack(pack, "Two bedrooms, three bathrooms").some(f => f.rule === "room-count")).toBe(true);
  });
  it("does not pool bedroom and bathroom counts", () => {
    const facts = publicInputsToText({ bedrooms: "2", bathrooms: "3", price: "325000" });
    expect(factCheckPack({ listing: "Three bedrooms and two bathrooms." }, facts).filter(f => f.rule === "room-count")).toHaveLength(2);
    expect(factCheckPack({ listing: "Two bedrooms and three bathrooms." }, facts).filter(f => f.rule === "room-count")).toEqual([]);
  });
  it("rejects ground-floor room attribution for a first/second floor maisonette", () => {
    expect(checkText("The kitchen is on the ground floor.", "description", "Maisonette on first and second floors. Kitchen 3.00m x 2.00m.").some(f => f.rule === "floor-position")).toBe(true);
    expect(checkText("Ground-floor kitchen.", "description", "Ground-floor kitchen.").filter(f => f.rule === "floor-position")).toEqual([]);
  });
});
