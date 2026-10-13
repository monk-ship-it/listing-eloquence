import { describe, expect, it } from "vitest";
import {
  normaliseCount,
  normaliseCouncilTax,
  normaliseEpc,
  normaliseForField,
  normalisePrice,
  normaliseTenure,
  normaliseYear,
  stripTrailing,
  wordsToNumber,
} from "./dictation-normalise";

describe("stripTrailing", () => {
  it("removes speech-engine full stops", () => {
    expect(stripTrailing("12 Park Avenue.")).toBe("12 Park Avenue");
    expect(stripTrailing("  Semi-detached house. ")).toBe("Semi-detached house");
  });
});

describe("wordsToNumber", () => {
  it("parses words and digits", () => {
    expect(wordsToNumber("four")).toBe(4);
    expect(wordsToNumber("two and a half")).toBe(2.5);
    expect(wordsToNumber("twenty-five")).toBe(25);
    expect(wordsToNumber("one point four five million")).toBe(1_450_000);
    expect(wordsToNumber("1.45 million")).toBe(1_450_000);
    expect(wordsToNumber("three hundred and fifty thousand")).toBe(350_000);
    expect(wordsToNumber("350k")).toBe(350_000);
    expect(wordsToNumber("£350,000")).toBe(350_000);
    expect(wordsToNumber("lovely")).toBeNull();
  });
});

describe("normaliseCount", () => {
  it("converts number words", () => {
    expect(normaliseCount("Four.")).toBe("4");
    expect(normaliseCount("two and a half")).toBe("2.5");
    expect(normaliseCount("3 bedrooms")).toBe("3");
    expect(normaliseCount("ninety nine years")).toBe("99");
  });
  it("keeps unparseable text", () => {
    expect(normaliseCount("a few")).toBe("a few");
  });
});

describe("normaliseYear", () => {
  it("keeps 4-digit years and converts words", () => {
    expect(normaliseYear("1901.")).toBe("1901");
    expect(normaliseYear("built in 1930s")).toBe("1930s");
  });
});

describe("normaliseCouncilTax", () => {
  it("extracts the band letter", () => {
    expect(normaliseCouncilTax("band D")).toBe("D");
    expect(normaliseCouncilTax("council tax band d.")).toBe("D");
    expect(normaliseCouncilTax("e")).toBe("E");
  });
});

describe("normaliseEpc", () => {
  it("extracts the rating letter", () => {
    expect(normaliseEpc("EPC C")).toBe("C");
    expect(normaliseEpc("energy rating c")).toBe("C");
    expect(normaliseEpc("b.")).toBe("B");
  });
});

describe("normalisePrice", () => {
  it("formats prices with commas", () => {
    expect(normalisePrice("one point four five million")).toBe("1,450,000");
    expect(normalisePrice("1.45 million")).toBe("1,450,000");
    expect(normalisePrice("three hundred and fifty thousand")).toBe("350,000");
    expect(normalisePrice("350k")).toBe("350,000");
    expect(normalisePrice("£350,000.")).toBe("350,000");
    expect(normalisePrice("guide price 525k")).toBe("525,000");
  });
  it("keeps unparseable text", () => {
    expect(normalisePrice("to be confirmed")).toBe("to be confirmed");
  });
});

describe("normaliseTenure", () => {
  it("capitalises tenure", () => {
    expect(normaliseTenure("freehold.")).toBe("Freehold");
    expect(normaliseTenure("leasehold")).toBe("Leasehold");
    expect(normaliseTenure("share of freehold")).toBe("Share of freehold");
  });
});

describe("normaliseForField", () => {
  it("routes by key and strips punctuation otherwise", () => {
    expect(normaliseForField("bedrooms", "five")).toBe("5");
    expect(normaliseForField("address", "12 Park Avenue.")).toBe("12 Park Avenue");
  });
});
