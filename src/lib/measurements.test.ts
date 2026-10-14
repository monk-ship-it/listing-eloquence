import { describe, expect, it } from "vitest";
import { addImperial, metresToFeetInches } from "./measurements";

describe("metresToFeetInches", () => {
  it.each([
    [4.52, `14'10"`],
    [3.61, `11'10"`],
    [5.2, `17'1"`],
    [4.1, `13'5"`],
    [0.3, `1'0"`],
    [3.05, `10'0"`],
  ])("%s m → %s", (m, out) => expect(metresToFeetInches(m)).toBe(out));
});

describe("addImperial", () => {
  it("formats metric to 2dp and adds imperial in brackets", () => {
    expect(addImperial("Living room 5.2m x 4.1m")).toBe(`Living room 5.20m x 4.10m (17'1" x 13'5")`);
  });
  it("handles several rooms and keeps qualifiers", () => {
    expect(addImperial("Lounge 4.52m x 3.61m into bay; Kitchen 5.2m (max) x 4.1m")).toBe(
      `Lounge 4.52m x 3.61m into bay (14'10" x 11'10" into bay); Kitchen 5.20m (max) x 4.10m (17'1" max x 13'5")`,
    );
  });
  it("converts a narrowing-to measurement", () => {
    expect(addImperial("Hall 5.2m narrowing to 3.05m x 4.1m")).toBe(
      `Hall 5.20m narrowing to 3.05m x 4.10m (17'1" narrowing to 10'0" x 13'5")`,
    );
  });
  it("leaves text that already has imperial alone", () => {
    const t = `Lounge 4.52m x 3.61m (14'10" x 11'10")`;
    expect(addImperial(t)).toBe(t);
    expect(addImperial("Garden 9m x 6m (30ft x 20ft)")).toBe("Garden 9m x 6m (30ft x 20ft)");
  });
  it("leaves text without dimension pairs alone", () => {
    expect(addImperial("Rear garden approx. 9m")).toBe("Rear garden approx. 9m");
  });
});
