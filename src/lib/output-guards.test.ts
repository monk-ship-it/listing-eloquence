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
    expect(missingPleaseNote(out, { disclosures: "Knotweed" } as ListingInput)).toEqual([
      "the Email Blast body",
    ]);
    expect(missingPleaseNote(out, {} as ListingInput)).toEqual([]);
  });
});
