import { describe, expect, it } from "vitest";
import { filterExtraction } from "./extract-filter";

const notes =
  "Four bed semi on Brenzett Close, Chatham, freehold, guide price three fifty, EPC C, council tax band D";

describe("filterExtraction", () => {
  it("keeps evidenced fields, drops unsupported and unknown keys", () => {
    const r = filterExtraction(
      {
        bedrooms: "4",
        tenure: "freehold",
        epc: "C",
        heating: "Gas central heating",
        hacked: "x",
        evidence: {
          bedrooms: "Four bed",
          tenure: "Freehold,",
          epc: "EPC C",
          heating: "gas central heating",
          hacked: "Four",
        },
      },
      notes,
    );
    expect(r.fields).toEqual({ bedrooms: "4", tenure: "Freehold", epc: "C" });
  });
});
