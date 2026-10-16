import { describe, expect, it } from "vitest";
import { repairJsonQuotes, unwrapSellerEmail, validateMarketingOutput } from "./listing-types";
import { agencySignature, EMPTY_AGENCY, hasAgencyDetails, withAgency } from "./clipboard";
import { EMAIL_SIGNOFF_PLACEHOLDER } from "./listing-types";

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

describe("agency sign-off at copy time", () => {
  const agency = {
    ...EMPTY_AGENCY,
    negotiatorName: "Sarah Jones",
    agencyName: "Oakwood Estates – Chatham",
    phone: "01634 000000",
    footerLine: "Member of The Property Ombudsman",
  };
  it("replaces the placeholder with the saved details", () => {
    const out = withAgency(`Book a viewing: [Add property link]\n\n${EMAIL_SIGNOFF_PLACEHOLDER}`, agency);
    expect(out).toBe(
      "Book a viewing: [Add property link]\n\nKind regards,\nSarah Jones\nOakwood Estates – Chatham\n01634 000000\n\nMember of The Property Ombudsman",
    );
  });
  it("doesn't repeat the sign-off when the text already has one", () => {
    const out = withAgency(`Thanks again.\n\nKind regards,\n${EMAIL_SIGNOFF_PLACEHOLDER}`, agency);
    expect(out.match(/Kind regards/g)).toHaveLength(1);
    expect(out).toContain("Kind regards,\nSarah Jones");
  });
  it("leaves text alone when nothing is saved", () => {
    const t = `Hello\n\n${EMAIL_SIGNOFF_PLACEHOLDER}`;
    expect(withAgency(t, EMPTY_AGENCY)).toBe(t);
    expect(withAgency(t, null)).toBe(t);
    expect(hasAgencyDetails({ ...EMPTY_AGENCY, signOff: "Best wishes" })).toBe(false);
  });
  it("uses a custom sign-off", () => {
    expect(agencySignature({ ...agency, signOff: "Best wishes," })).toMatch(/^Best wishes,\nSarah Jones/);
  });
});
