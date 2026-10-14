import { describe, expect, it } from "vitest";
import { repairJsonQuotes, unwrapSellerEmail, validateMarketingOutput } from "./listing-types";

describe("marketing output tolerance", () => {
  it("repairs stray quotes inside stringified JSON", () => {
    const s = '{\n  "body": "Please reply "Approved" or send corrections.\n\n[Your name, branch, phone]"\n}';
    expect(JSON.parse(repairJsonQuotes(s)).body).toContain('reply "Approved" or');
    expect(unwrapSellerEmail(s)).toEqual({ body: expect.stringContaining('"Approved"') });
  });
  it("accepts nested objects returned as strings and keeps the MI line last", () => {
    const out = validateMarketingOutput({
      emailBlast: JSON.stringify({
        subjectLines: ["a", "b", "c"],
        previewText: "p",
        headline: "h",
        body: "Para one.\n\nFull material information is on the property listing. Book a viewing.",
        callToAction: "Book a viewing",
        personalMessage: "pm",
      }),
      sellerEmail: '{"body": "Dear [Seller name], reply "Approved"."}',
      social: [{ platform: "X", caption: "c", hashtags: [] }],
    });
    expect(out.emailBlast?.body.endsWith("Full material information is on the property listing.")).toBe(true);
    expect(out.emailBlast?.personalMessage).toBe("pm");
    expect(out.sellerEmail?.body).toContain('"Approved"');
  });
});
