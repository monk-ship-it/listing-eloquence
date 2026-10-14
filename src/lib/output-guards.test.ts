import { describe, expect, it } from "vitest";
import {
  appendLabels,
  bannedIn,
  imageLabelsFor,
  labelSocial,
  missingPleaseNote,
} from "./output-guards";
import type { ListingInput, MarketingOutput } from "./listing-types";

describe("image labels", () => {
  it("one label per trigger, fixed order", () => {
    expect(
      imageLabelsFor("Lounge virtually staged; exterior is CGI; show home photos"),
    ).toHaveLength(3);
    expect(imageLabelsFor("Digitally altered sky")).toEqual([
      "Some images have been digitally enhanced.",
    ]);
    expect(imageLabelsFor("Photos taken in May")).toEqual([]);
    expect(imageLabelsFor("computer-generated garden")).toHaveLength(1);
  });
  it("appends once as last line", () => {
    const l = imageLabelsFor("CGI");
    const once = appendLabels("Text.", l);
    expect(once.endsWith(l[0])).toBe(true);
    expect(appendLabels(once, l)).toBe(once);
  });
  it("trims X hashtags to stay within 280", () => {
    const [x] = labelSocial(
      [{ platform: "X", caption: "a".repeat(200), hashtags: ["Kent", "KingsHill", "NewHome"] }],
      imageLabelsFor("show home"),
    );
    const len = `${x.caption}\n\n${x.hashtags.map((h) => `#${h}`).join(" ")}`.length;
    expect(len).toBeLessThanOrEqual(280);
    expect(x.caption).toContain("Images show the show home");
  });
});

describe("retry triggers", () => {
  it("finds banned phrases not in the inputs", () => {
    expect(bannedIn(["The flat benefits from a lift"], "")).toContain("benefits from");
    expect(bannedIn(["The flat benefits from a lift"], "benefits from")).toEqual([]);
  });
  it("needs Please note: when known issues exist", () => {
    const out = {
      emailBlast: { subjectLines: [], previewText: "", headline: "", body: "No note." },
      social: [{ platform: "Instagram", caption: "Please note: knotweed.", hashtags: [] }],
    } as unknown as MarketingOutput;
    expect(missingPleaseNote(out, { disclosures: "Knotweed" } as ListingInput)).toEqual([
      "the Email Blast body",
    ]);
    expect(missingPleaseNote(out, {} as ListingInput)).toEqual([]);
  });
});

import {
  labelSocialFor,
  normaliseCaptions as normCaps,
  priceQualifierProblems,
  sellerEmailShape,
  trimPreview,
  xBudget,
  renderImageLabelsLine,
} from "./output-guards";

describe("price qualifier", () => {
  const fixed = { price: "410,000", priceQualifier: "Fixed Price" };
  it("flags a swapped qualifier", () => {
    const p = priceQualifierProblems([["a caption", "New home, From £410,000, freehold"]], fixed);
    expect(p).toEqual([{ where: "a caption", wrote: "From £410,000" }]);
    expect(priceQualifierProblems([["x", "Fixed Price £410k"]], fixed)).toEqual([]);
  });
  const oieo = { price: "375000", priceQualifier: "Offers in Excess of" };
  it("accepts lowercase and subject-line abbreviations", () => {
    expect(priceQualifierProblems([["x", "offers in excess of £375,000"]], oieo)).toEqual([]);
    expect(priceQualifierProblems([["s", "Just listed: 2-bed flat – OIEO £375k"]], oieo)).toEqual(
      [],
    );
    expect(priceQualifierProblems([["s", "Guide £375,000"]], oieo)).toHaveLength(1);
  });
});

describe("X with show home + CGI labels", () => {
  const labels = imageLabelsFor("show home photos and CGI exterior");
  const input = { price: "410,000", tenure: "Freehold", epc: "B" } as ListingInput;
  it("budget line", () => {
    expect(labels).toHaveLength(2);
    expect(renderImageLabelsLine("CGI exterior; show home")).toContain(
      `at most ${xBudget(labels)} characters`,
    );
  });
  it("moves inline hashtags, then fits 280 without cutting protected sentences", () => {
    const caption =
      "Plot 47, Kings Hill – Fixed Price £410,000, Freehold, EPC B. Air source heat pump and EV charging. Two parking spaces and a garden. Completion spring 2027 with a ten-year warranty. Full material information on the listing. #KingsHill #NewHome";
    const [p] = normCaps([{ platform: "X", caption, hashtags: ["kingshill"] }]);
    expect(p.caption.endsWith("listing.")).toBe(true);
    expect(p.hashtags).toEqual(["kingshill", "NewHome"]);
    const [x] = labelSocialFor([p], labels, input);
    const len =
      `${x.caption}${x.hashtags.length ? `\n\n${x.hashtags.map((h) => `#${h}`).join(" ")}` : ""}`
        .length;
    expect(len).toBeLessThanOrEqual(280);
    expect(x.caption).toContain("Fixed Price £410,000");
    expect(x.caption).toContain("Full material information on the listing.");
    for (const l of labels) expect(x.caption).toContain(l);
  });
});

describe("preview + seller email", () => {
  it("trims preview at a separator", () => {
    const t = trimPreview(
      "Freehold · No onward chain · EPC B · Completion spring 2027 · EV charging · Two parking spaces",
    );
    expect(t).toBe("Freehold · No onward chain · EPC B · Completion spring 2027 · EV charging");
    expect(t.length).toBeLessThanOrEqual(90);
  });
  it("counts prose only", () => {
    const s = sellerEmailShape(
      "Dear [Seller name],\n\nThanks.\n\n1. Tenure: Freehold – is this correct?\n2. What is the EPC?",
    );
    expect(s.proseWords).toBe(4);
  });
});

describe("exact price form", () => {
  const g = { price: "195000", priceQualifier: "Guide Price" };
  const prose = "The flat is offered at a guide price of £195,000.";
  it("prose only → missing", () => {
    expect(priceQualifierProblems([["the description", prose]], g)).toEqual([
      { where: "the description", wrote: "", missing: true },
    ]);
  });
  it("prose plus exact form in final paragraph → OK", () => {
    expect(
      priceQualifierProblems(
        [["the description", `${prose}\n\nGuide Price £195,000. Leasehold.`]],
        g,
      ),
    ).toEqual([]);
  });
  it("optional colon, any case", () => {
    const so = { price: "130,000", priceQualifier: "Shared Ownership" };
    expect(
      priceQualifierProblems(
        [["the Email Blast body", "Shared ownership: £130,000 for a 40% share"]],
        so,
      ),
    ).toEqual([]);
  });
  it("swapped qualifier still a problem", () => {
    const p = priceQualifierProblems(
      [["the description", "From £410,000. Fixed Price £410,000."]],
      { price: "410000", priceQualifier: "Fixed Price" },
    );
    expect(p).toEqual([{ where: "the description", wrote: "From £410,000" }]);
  });
  it("no qualifier → amount only", () => {
    expect(
      priceQualifierProblems([["the description", "Priced at £250,000."]], { price: "250000" }),
    ).toEqual([]);
  });
});
