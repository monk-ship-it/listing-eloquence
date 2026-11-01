# Legal page preparation — not public policies

## Current status — 1 November 2026 (supersedes conflicting historical questions below)

The operator is **Domenico Monk, sole trader trading as CopyByMonk**. **domenico@copybymonk.com** handles support, administration and privacy requests. The owner confirms **not VAT registered** and **ICO registered**. Do not invent an ICO reference or treat the missing number alone as a launch blocker. No business correspondence/service address has been supplied; this remains unresolved and no address is fabricated.

The current internal refund proposal is in `docs/refund-policy-draft.md`: cancel anytime; a once-per-customer 14-calendar-day first-payment refund after reasonable evaluation; a seven-calendar-day unused-renewal offer; billing-error correction; and fair full/proportionate material-service-failure remedies, preserving mandatory rights. These are proposed commercial terms, not published statutory-rights claims. `docs/support-checklist.md` records the manual process, identity/payment checks, billing-period successful-core-pack evidence, duplicate safeguards and owner decision. No automatic Quill cancellation/refund email or automated refund entitlement is implemented; manual support delivery remains an operating requirement.

The unconditional optional Opinly analytics pixel was removed from the root head on 1 November. Fresh preview loads of /, /auth and /app made no request for that script. Separate blog/content integrations remain. This does not establish that the product has no tracking/cookies or resolve other provider data flows.

Public Privacy/Terms/refund pages remain absent and this document remains internal. Verify actual processing providers, regions, contracts/transfers, lawful bases, retention/deletion, agency data-processing terms, and remaining liability/jurisdiction decisions before publishing. Application source does not establish provider contracts or retention. Historical pending identity/contact/VAT/ICO questions below are superseded by the confirmed facts above; the missing correspondence address and unverified processing/legal details remain open.

---

Internal drafting structure only. No public Privacy/Terms routes, navigation links or placeholder policies are introduced. Do not publish this as a finished policy. Source inspection establishes application behaviour, not provider contracts, legal compliance or hosted configuration.

## Confirmed operator facts

- Trading name: CopyByMonk; business form: **sole trader**, not a limited company.
- Support: domenico@copybymonk.com.
- Known owner name: Domenico Monk. The legal identity for the policy and service/legal correspondence address still require owner verification. No company number or registered office is assumed or requested for a limited company.

## Privacy Policy structure for owner/legal approval

1. **Who controls the data and contact details.** Use the confirmed trading form above; insert only the owner-verified legal identity/address once provided. Confirm whether support is also the privacy/data-rights contact. Confirm ICO registration/fee or applicable exemption; no status is asserted.
2. **Data collected and purposes.** Account email/password authentication; profile name and agency details; supplied property fields, voice-note text, private access/photo notes, generated packs; billing identifiers/status; usage, rate-limit and error records. Describe service delivery, authentication, billing and support purposes separately. Owner/legal review must select lawful bases and clarify agent/customer responsibilities for third-party personal data.
3. **AI and speech processing.** Listing/extraction text goes to Anthropic through the server (`ai-gateway.server.ts`). Private viewing/photo fields are excluded from public-copy prompt facts (`prompts/render.ts`), but may remain in saved inputs/browser drafts. Optional microphone recordings are sent through Lovable's audio gateway using `openai/gpt-transcribe` (`transcribe.functions.ts`); this application does not persist audio files, but transcript text becomes form data. This is not a promise about gateway/provider retention or training. Verify actual processor names, agreements, subprocessors, locations, transfer safeguards and training/retention terms.
4. **Storage and recipients.** Lovable Cloud authentication/database stores profiles, inputs/output packs, subscription and usage/error records. Browser local storage holds per-user drafts, authentication session and dictation preferences. Stripe hosts checkout and customer billing management. Managed authentication-email infrastructure handles confirmation/recovery messages; listing emails are copyable drafts, not sent by Quill. Verify enabled email sender and any queue/log retention. Do not list an unused integration as actively processing customer data merely because code exists.
5. **Cookies, local storage and external requests.** Root head loads Opinly's analytics script and Google Fonts (`__root.tsx`); actual analytics payloads/cookies, domains, consent requirements and consent implementation need verification. Draft/session/preferences storage also needs an accurate essential/non-essential classification. No claim of cookie-free operation or consent compliance.
6. **Retention and deletion.** Owner must set periods for profiles, listings/private notes/transcripts, browser drafts, usage/error/security logs, billing and email records, backups and provider copies. No indefinite/automatic deletion promise. Confirm how a data request/account deletion will be fulfilled and how statutory billing records are handled.
7. **Rights, security, transfers and complaints.** Describe verified access/ownership safeguards without an absolute security guarantee. Owner/legal review to approve rights process, response handling, international-transfer basis, ICO complaint information and update/effective-date wording.

## Terms structure for owner/legal approval

1. **Supplier and scope:** verified sole-trader identity/address; Quill for UK residential estate agents; confirm business-customer eligibility and contracting capacity.
2. **Service:** AI-generated listing/marketing/seller-approval drafts from supplied facts; copy/paste workflow, no CRM/portal delivery integration or listing-email sending. Agent verification and seller approval required; no accuracy, legal/compliance or speed guarantee.
3. **Accounts and acceptable use:** credentials, authorised use and rights to submitted facts/personal data. Owner/legal approval for prohibited use, suspension, remedies and content/output rights/licences; do not invent them.
4. **Prices/trial/billing:** implemented GBP monthly Starter £39/15, Pro £79/50, Growth £149/120; eligible first-time Starter trial 14 days, card required, checkout confirms trial/renewal price. Monthly listing allowance resets on calendar month; only a new listing pack consumes listing allowance, other operations have rate limits. Verify VAT/tax presentation with owner rather than assert included/excluded tax. Trial eligibility is conservatively reserved on checkout preparation; an abandoned eligible attempt may use eligibility without a charge. Owner must review this disclosure/customer remedy before approving terms.
5. **Cancellation and access:** cancellation available any time for an open subscription, including payment problems; scheduled for period end. Paid access continues to the displayed end date while entitlement remains valid; payment problems can already pause generation. Cancellation stops renewal, does not itself settle outstanding invoices. No live lifecycle certification. Owner must decide refunds, credits, disputes and any statutory rights; no "no refunds" or money-back promise added.
6. **Availability, liability and termination:** approve service limitations, interruption/support handling, legally appropriate liability terms, termination and changes; no fabricated exclusions or guarantees.
7. **Governing law, disputes and contacts:** owner/legal review required for jurisdiction, complaint process and legal contact. Use support address only for support until its wider role is confirmed.

## Release checklist

- Verify legal identity and correspondence/service address; do not substitute trading name plus known person name for verification.
- Confirm privacy contact, ICO position, processor/transfer/retention terms, analytics consent, deletion process, VAT, refunds/credits, liability, jurisdiction and effective dates.
- Review current conservative trial-reservation behaviour and its customer disclosure/remedy.
- Only after approval, create real Privacy/Terms content routes with unique SEO metadata and consistent footer/checkout supplier details. Do not create or publish placeholder pages.
