import { describe, expect, it } from "vitest";
import {
  appendLabels,
  bannedIn,
  imageLabelsFor,
  labelSocial,
  missingPleaseNote,
  hasExactPrice,
  labelMarketing,
  swapSoftBanned,
  withSaleMethodLine,
} from "./output-guards";
import type { ListingInput, MarketingOutput, SocialPost } from "./listing-types";
import {
  gradeBlockDump,
  gradeDimensions,
  gradeFloors,
  suppliedRooms,
  type GradePack,
} from "../../scripts/prompt-evals/graders";

describe("image labels", () => {
  it("one label per trigger, fixed order", () => {
    expect(imageLabelsFor("Lounge virtually staged; exterior is CGI; show home photos")).toHaveLength(3);
    expect(imageLabelsFor("Digitally altered sky")).toEqual(["Some images have been digitally enhanced."]);
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
    expect(missingPleaseNote(out, { disclosures: "Knotweed" } as ListingInput)).toEqual(["the Email Blast body"]);
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
    expect(priceQualifierProblems([["s", "Just listed: 2-bed flat – OIEO £375k"]], oieo)).toEqual([]);
    expect(priceQualifierProblems([["s", "Guide £375,000"]], oieo)).toHaveLength(1);
  });
});

describe("X with show home + CGI labels", () => {
  const labels = imageLabelsFor("show home photos and CGI exterior");
  const input = { price: "410,000", tenure: "Freehold", epc: "B" } as ListingInput;
  it("budget line", () => {
    expect(labels).toHaveLength(2);
    expect(renderImageLabelsLine("CGI exterior; show home")).toContain(`at most ${xBudget(labels)} characters`);
  });
  it("moves inline hashtags, then fits 280 without cutting protected sentences", () => {
    const caption =
      "Plot 47, Kings Hill – Fixed Price £410,000, Freehold, EPC B. Air source heat pump and EV charging. Two parking spaces and a garden. Completion spring 2027 with a ten-year warranty. Full material information on the listing. #KingsHill #NewHome";
    const [p] = normCaps([{ platform: "X", caption, hashtags: ["kingshill"] }]);
    expect(p.caption.endsWith("listing.")).toBe(true);
    expect(p.hashtags).toEqual(["kingshill", "NewHome"]);
    const [x] = labelSocialFor([p], labels, input);
    const len = `${x.caption}${x.hashtags.length ? `\n\n${x.hashtags.map((h) => `#${h}`).join(" ")}` : ""}`.length;
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
  it("prose only → not exact (grader warning), and no retry trigger", () => {
    expect(hasExactPrice(prose, g)).toBe(false);
    expect(priceQualifierProblems([["the description", prose]], g)).toEqual([]);
  });
  it("prose plus exact form in final paragraph → OK", () => {
    expect(hasExactPrice(`${prose}\n\nGuide Price £195,000. Leasehold.`, g)).toBe(true);
  });
  it("optional colon, any case", () => {
    const so = { price: "130,000", priceQualifier: "Shared Ownership" };
    expect(hasExactPrice("Shared ownership: £130,000 for a 40% share", so)).toBe(true);
  });
  it("swapped qualifier still a problem", () => {
    const p = priceQualifierProblems([["the description", "From £410,000. Fixed Price £410,000."]], {
      price: "410000",
      priceQualifier: "Fixed Price",
    });
    expect(p).toEqual([{ where: "the description", wrote: "From £410,000" }]);
  });
  it("no qualifier → amount only", () => {
    expect(hasExactPrice("Priced at £250,000.", { price: "250000", priceQualifier: "" })).toBe(true);
  });
});

describe("soft banned swaps", () => {
  it("swaps and keeps capitals", () => {
    expect(
      swapSoftBanned("The house benefits from a garden. Boasts a view; rooms benefit from light and boast space."),
    ).toBe("The house has a garden. Has a view; rooms have light and have space.");
  });
});

describe("sale method caption line", () => {
  const posts = [
    { platform: "Instagram", caption: "Three bedroom house.", hashtags: [] },
    { platform: "X", caption: "For sale by Modern Method of Auction. Already there.", hashtags: [] },
  ] as SocialPost[];
  it("prepends only where missing", () => {
    const out = withSaleMethodLine(posts, { saleMethod: "Modern Method of Auction" } as ListingInput);
    expect(out[0].caption).toBe("For sale by Modern Method of Auction. Three bedroom house.");
    expect(out[1].caption).toBe(posts[1].caption);
    const t = withSaleMethodLine(posts, { saleMethod: "Traditional auction" } as ListingInput);
    expect(t[0].caption.startsWith("For sale by traditional auction. ")).toBe(true);
    expect(withSaleMethodLine(posts, { saleMethod: "Private treaty" } as ListingInput)).toBe(posts);
  });
  it("X stays ≤ 280 after the prepend", () => {
    const x = {
      platform: "X",
      caption: "A".repeat(150) + ". " + "B".repeat(120) + ".",
      hashtags: ["Kent"],
    } as SocialPost;
    const out = labelMarketing(
      { emailBlast: null, sellerEmail: null, social: [x] } as unknown as MarketingOutput,
      { saleMethod: "Traditional auction" } as ListingInput,
    );
    const c = out.social[0];
    expect(`${c.caption}${c.hashtags.length ? `\n\n#${c.hashtags.join(" #")}` : ""}`.length).toBeLessThanOrEqual(280);
    expect(c.caption.startsWith("For sale by traditional auction.")).toBe(true);
  });
});

describe("eval graders (room dimensions, floors, block dump)", () => {
  const pack = (over: Partial<GradePack>): GradePack => ({
    headline: "",
    listing: "",
    summary: "",
    keyFeatures: [],
    emailBlast: null,
    sellerEmail: null,
    social: [],
    ...over,
  });

  const dims = "Kitchen/dining room 5.80m x 3.40m; Living room 4.90m x 3.30m; Principal bedroom 4.10m x 3.00m";
  const input = { dimensions: dims, propertyType: "Semi-detached house" } as ListingInput;

  describe("room dimensions grader", () => {
    it("parses supplied rooms", () => {
      expect(suppliedRooms(dims).map((r) => r.name)).toEqual([
        "kitchen dining room",
        "living room",
        "principal bedroom",
      ]);
    });
    it("fails a dimension written against the wrong room (A6-legacy)", () => {
      const f = gradeDimensions(pack({ listing: "The living room measures 4.10m x 3.00m (13'5\" x 9'10\")." }), input);
      expect(f).toHaveLength(1);
      expect(f[0].message).toContain('"living room"');
    });
    it("passes the right room, number words and lists of rooms", () => {
      const text =
        "The kitchen/dining room measures 5.80m x 3.40m (19'0\" x 11'2\"), and the living room is 4.90m x 3.30m. Bedroom one is 3.85m x 3.05m.";
      const f = gradeDimensions(pack({ listing: text }), {
        ...input,
        dimensions: `${dims}; Bedroom 1 3.85m x 3.05m`,
      } as ListingInput);
      expect(f).toEqual([]);
    });
    it("fails a dimension that was never supplied", () => {
      expect(gradeDimensions(pack({ listing: "A room of 9.99m x 9.99m." }), input)).toHaveLength(1);
    });
  });

  describe("floor names for flats", () => {
    const flat = {
      propertyType: "Maisonette (first and second floors) above a commercial unit",
    } as ListingInput;
    it("fails a floor the facts never name", () => {
      const f = gradeFloors(pack({ listing: "The ground floor comprises a living room." }), flat);
      expect(f.map((x) => x.text)).toEqual(["ground floor"]);
    });
    it("allows floors listed in the property type", () => {
      expect(
        gradeFloors(pack({ listing: "The first floor has the living room; the second floor two bedrooms." }), flat),
      ).toEqual([]);
    });
    it("ignores houses", () => {
      expect(gradeFloors(pack({ listing: "The ground floor has a kitchen." }), input)).toEqual([]);
    });
  });

  describe("material-information block dump", () => {
    it("warns when the final paragraph repeats 4+ supply labels", () => {
      const listing =
        "Intro.\n\nGuide Price £1. Construction: Standard. Electricity: Mains. Water: Mains. Sewerage: Mains.";
      expect(gradeBlockDump(pack({ listing }))).toHaveLength(1);
      expect(gradeBlockDump(pack({ listing: "Intro.\n\nGuide Price £1. Freehold." }))).toEqual([]);
    });
  });
});
