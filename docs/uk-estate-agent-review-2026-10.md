# Quill UK estate-agency production review

Reviewed 22 October 2026. Primary target: connected Lovable project `13dc08a6-2803-4cbd-b9e9-4d1452afd64a`, remote source at HEAD when inspected. This is a product/domain assessment, not a claim of professional estate-agent or solicitor credentials. The local HTML/Node prototype is older and must not be used as evidence of the connected application's current behaviour.

## What the connected application already does well

The production project is substantially more mature than the local prototype. It has structured UK sales fields, deterministic material-information checks, seller questions, room conversions, fact checks, public/private notes separation, image labels, planning caveats, and a combined pack safety status. Its source acknowledges that the old NTSELAT guidance was withdrawn. A core listing can succeed independently of marketing generation, so a marketing failure need not waste a credit. Preserve those decisions.

## Priority fixes in the connected application

### P1 — Approval must belong to the generated wording

`src/routes/_authenticated.app.tsx` collects `sellerApproved` before generating, sends it in `run()` (lines 381–387), and freezes it in the input snapshot used by `ListingPack` (441–446). The generated wording can therefore inherit approval given before that wording existed. Ticking approval after generation changes the snapshot and presents the form as stale, requiring regeneration into another unseen wording.

Bind approval to a generation ID and revision/hash of the exact output; clear it when input or generated output changes. Put the confirmation next to the completed pack. Preserve a separate seller-facts confirmation if useful, but do not describe that as approval of the final generated particulars. `ListingPack.tsx` line 337 also passes `sellerApproved={!draft}` to the seller email card; actual seller confirmation and overall publication safety should be separate values.

TPO Code paragraph 7j asks members to agree particulars with the seller before marketing and identify unapproved particulars as drafts. This is an industry code requirement; do not imply that every UK agent belongs to TPO. [TPO codes](https://www.tpos.co.uk/about-us/codes-of-practice/), [current residential estate-agents code](https://www.tpos.co.uk/wp-content/uploads/2026/03/TPOE27-9-Code-of-Practice-for-Residential-Estate-Agents-A4-March-2026.pdf).

### P1 — Raw voice notes can neutralise the privacy check

`src/lib/fact-check.ts` `publicInputsToText()` (271 onwards) excludes `showingNotes` and `mediaNotes` but includes raw `voiceNotes`. `privateLeakFlags()` then subtracts any private words/phrases already in this public pool (314–326). Repro: voice notes say “Lockbox 4931, keys behind the shed”; extraction correctly copies that to `showingNotes`; if generated public copy repeats it, it is accepted as present in the public evidence pool and not flagged as a private leak.

Check private information against structured public fields independently of raw dictation. A duplicate in raw notes must not authorise publishing access details. Add a regression case with duplicated raw/private notes and a control case where an ordinary property feature legitimately appears in both public and private fields. Avoid feeding raw private values to the generation model when they are unnecessary; retain deterministic image-label instructions rather than private photo text where possible.

### P1 — Unanswered material-information checks can lose the draft marker

`src/lib/pack-safety.ts` line 4 only considers unresolved `block` and `conflict` checks. Unanswered `warn` supplies and `confirm` situational items can remain visible as “things to fix before you publish” while copies lose their draft marker once seller approval is true. This contradicts the product's own broad “outstanding material-information checks” safety intent.

Keep a review-required status whenever unresolved checks remain, or explicitly distinguish “not relevant” from “not yet checked”. Do not claim that completing the product checklist guarantees compliance: materiality depends on the property and the consumer's decision. A clear human review step should remain after generation.

### P1 — UK-wide positioning exceeds the supported fact model

`ListingInput` has a single UK market with no property nation; `listing-fields.ts` exposes one mandatory Council Tax selector and one England/Wales-oriented tenure list. `checkMaterialInfo()` requires Council Tax for every property. Northern Ireland uses domestic rates; Scotland has Home Report requirements for most marketed sales. Neither is represented. Using Council Tax “Exempt” to work around Northern Ireland would be inaccurate.

Either clearly scope the initial production release to residential sales in England and Wales, or add a nation field with country-specific labels, supporting documents and checks. Do not infer the nation solely from a free-text address. Check nation-specific tax bands instead of offering Welsh Band I universally. For future Scotland support, collect Home Report status/date and link/reference without pretending Quill produces a survey. [NI rate bills](https://www.nidirect.gov.uk/articles/how-rate-bills-are-calculated), [Scottish selling process and Home Report](https://www.mygov.scot/sell-home/first-steps).

### P2 — EPC status is presented as a rating

`EPC_OPTIONS` includes `Commissioned`; `checkMaterialInfo()` regards it as a complete answer; `buildMaterialInfoBlock()` prints `EPC rating: Commissioned`. Commissioning is a status, not an A–G rating. `Exempt` also needs an evidence/reason workflow rather than automatic acceptance of an unsupported claim.

Separate rating, predicted-rating status, commissioned status/date, certificate reference/expiry, and exemption evidence. Keep an outstanding review prompt for commissioned certificates and publish the rating when available. In England and Wales the EPC must be commissioned before marketing if needed, reasonable efforts must be made to obtain it within seven days (a further 21 days may apply), and adverts must show the rating where available. A pending certificate does not justify a blanket claim that all marketing is unlawful. [England/Wales EPC guidance](https://www.gov.uk/government/publications/energy-performance-certificates-for-the-construction-sale-and-let-of-dwellings/a-guide-to-energy-performance-certificates-for-the-marketing-sale-and-let-of-dwellings).

Scottish guidance requires commercial sale/letting adverts to include the EPC indicator and uses a separate register. Northern Ireland also has its own regulations and enforcement. [Scotland EPC requirements](https://www.gov.scot/publications/energy-performance-certificates-guide/pages/requirements/), [NI EPC information](https://www.nidirect.gov.uk/articles/energy-performance-certificates).

### P2 — Facts need field-specific checks, not only a pool of numbers

The fact checker has improved relational bedroom/bathroom and floor checks, but most amounts still pass when the same digits appear anywhere in public input. A service charge of £2,000 does not authorise an asking price of £2,000; a room dimension does not substantiate a journey time. Add amount/field and measurement/unit-specific checks for price, lease length, ground rent, service charge, rent, dimensions and travel claims. Preserve warnings for broad number/name checks, since those can have legitimate false positives.

The Part C contradiction map only covers planning, flooding, rights and restrictions. Extend deterministic conflicts to building-safety, coastal-erosion and mining disclosures; use carefully tested patterns to avoid negation false positives. Any short-format fallback must retain material fee, sale-method and known-issue disclosures rather than dropping them to meet a character limit; an unresolved overlength output should remain an explicit draft.

### P2 — Avoid unsupported absolute claims in the interface

`ListingPack.tsx` describes plain text as “safe to paste into Rightmove, Zoopla and OnTheMarket”. Plain text formatting can be suitable while content still requires checking; say “Plain text for your property portal” and retain visible review status. The interface can say it supports material-information review, but should not claim “legally compliant”, “fully verified”, “Trading Standards approved” or automated publication readiness.

## Current law, code and proposals — keep the distinctions visible

The DMCC Act unfair-commercial-practices regime replaced the earlier CPR regime for practices from 6 April 2025. It prohibits misleading actions and omissions. A consumer's transactional decision can include deciding whether to view, not just buying. [CMA guidance](https://www.gov.uk/government/publications/unfair-commercial-practices-cma207/unfair-commercial-practices).

The government published its response to the material-information consultation on 19 June 2026. Its roadmap commits to non-statutory guidance later in 2026, standardised information gathering, and sourcing reliable evidence; plans for future sales packs are proposals, not an already mandatory universal pack. No later replacement material-information publication was found during this review. The old NTSELAT Parts A/B/C categories may be retained as a useful product checklist, with an accurate historical label rather than a statutory compliance badge. [Government outcome and roadmap, Chapter 12](https://www.gov.uk/government/consultations/home-buying-and-selling-reform/outcome/home-buying-and-selling-reform-roadmap).

Trading Standards guidance warns that generic disclaimers do not repair misleading particulars. It recommends checking particulars, obtaining seller agreement, retaining records and revisiting details as circumstances change. Product implications: source/date/reviewer fields, exact known-issue wording, property-specific qualifications, and a pack revision date. [Anglesey Trading Standards property descriptions guidance](https://www.anglesey.gov.wales/en/business/trading-standards/trading-standards-guidance/fair-trading/306628).

CAP's leasehold advice explains why remaining lease length and compulsory charges matter, with rulings on omitted service charges and shared-ownership lease-extension costs. Product implication: preserve annual amount and period, review terms, unsold-share rent, full value/share distinction, event fees and buyer/auction fees close to relevant price information. CAP advice interprets advertising rules; it is not legislation. [CAP leasehold advice](https://www.asa.org.uk/advice-online/property-leasehold.html).

The existing prompts correctly specify residential sales. Keep that scope clear. Do not silently use this sales flow for lettings, where jurisdiction-specific tenancy, fee and discrimination rules differ. England's new rental discrimination rules apply from 1 May 2026 to relevant tenancies; a future lettings release requires its own model and review. [Government rental discrimination guidance](https://www.gov.uk/government/publications/rental-discrimination-under-the-renters-rights-act-2025/rental-discrimination-under-the-renters-rights-act-2025).

## Practical agency acceptance checks

1. Start with an instruction, collect structured facts with source and date, and distinguish confirmed / awaiting evidence / unknown / genuinely not applicable.
2. Extract dictated notes with verbatim evidence, present conflicts, and require agent review before treating extraction as confirmed.
3. Keep access codes, seller circumstances, negotiability and occupants' details private even when dictated in the same note as property features.
4. Generate a draft; show every supplied known issue and relevant price/cost detail across portal, email and social outputs.
5. Let the agent edit/correct the pack, request seller approval of that exact revision, and invalidate approval when it changes.
6. Export plain text with a review/draft marker until the agreed checks are resolved; never imply automatic publication.
7. Save evidence, revision dates, approval and the exported text so later factual changes can be traced and corrected.

These are product recommendations informed by the cited sources, not a statement that every checklist field is legally mandatory in every transaction.

## Minimal defensible UK nation support

The user wants a UK product, so a small explicit nation model is preferable to quietly defaulting all property to England/Wales. Full conveyancing or automated jurisdictional certification is unnecessary.

- Add `propertyNation`: England, Wales, Scotland, Northern Ireland, or unconfirmed. Ask the agent; extraction may populate it only from an explicit statement. Existing saved rows without a nation should remain readable and acquire a review prompt, not an assumed nation.
- England/Scotland: Council Tax A–H; Wales: A–I. Keep legitimately exempt/not-yet-banded statuses with explanation. Northern Ireland: show domestic rates, the annual amount and relevant rating year; stop requiring or printing Council Tax. Unknown rates remain an outstanding check.
- Scotland: add Home Report status (available / awaiting / exemption claimed / unconfirmed), date and reference/link if supplied, with exemption rationale when claimed. Add a review prompt while the status is unresolved. Preserve the distinction between an agent's claimed exemption and verification. Do not manufacture survey results, condition, valuation or an exemption decision. A simple reference/status is enough for this iteration.
- Use a nation-neutral “Tenure / ownership” label; allow accurate supplied ownership detail where the English/Welsh list does not describe Scottish ownership. Do not force Scottish agents to select an inaccurate tenure to clear a check.
- Render nation-specific headings and seller questions in the deterministic block. The model must not infer Council Tax or a Home Report from address, price or tenure.
- Update public copy to “UK residential sales; agent review required” and explain support where useful in the review interface. Present national checks as assistance, not an exhaustive legal assessment.

If the implementation cannot preserve these distinctions across generation, saved history, extraction, exports and legacy rows, an explicit England/Wales initial scope is more honest than a misleading all-UK claim.

## Regression cases for Lovable

| Case | Fixture / action | Required outcome |
| --- | --- | --- |
| Duplicated access information | `voiceNotes` and `showingNotes` both contain “lockbox 4931 behind the shed”; generated social/body repeats it | Private-leak warning and draft status; raw dictation cannot authorise publication |
| Private value with ordinary public fact | `showingNotes` says “garage keys in lockbox 4931”; public `parking` says “single garage” | Garage may remain; lockbox/code must be flagged; avoid removing legitimate public features |
| Known issue unresolved | Seller approval true; every blocking field filled; `buildingSafety` unanswered | Review required/draft remains; no green publication-ready state |
| Unanswered supplies | Seller approval true; water or sewerage unknown | Outstanding review remains visible and affects safety state consistently |
| Output approval | Approve generated pack A, then regenerate pack B | B has no inherited approval, even if input facts did not change |
| Edited pack | Approve A, edit any description/key-feature/email/social text | Approval invalidated for affected pack revision; persisted record reflects it |
| EPC commissioned | Status commissioned, no letter rating | Output says commissioned/status; never “rating: Commissioned”; review remains pending and no fabricated grade |
| Predicted EPC | New home with supplied predicted B | Exact predicted status retained across description, deterministic block and marketing |
| Northern Ireland | Property nation Northern Ireland, supplied annual domestic rates £1,240 for 2026/27 | No Council Tax requirement or Band output; rates and year retained; no invented conversion |
| Scotland | Property nation Scotland, Home Report awaiting | Explicit outstanding Home Report review; no fabricated report or claim of approval |
| Legacy row | Saved inputs have no nation/new approval revision | Opens safely without crashing; no automatic England assumption or newly granted approval |
| Tax band boundary | England/Scotland Band I versus Wales Band I | England/Scotland answer flagged/invalid; Wales accepted |
| Wrong amount relationship | Price £250,000, service charge £2,000; generated asking price £2,000 | Amount is flagged despite 2,000 existing elsewhere in inputs |
| Situational contradiction | Building safety “None known”; known issues mention cladding remediation | Conflict surfaces; public copy cannot assert no known building-safety issue |
| Long X with material terms | Auction with supplied fees, known issue and image labels exceeds 280 | Material disclosures retained; explicit unresolved length warning/draft instead of silent omission |

Run the repository-required prompt export and full test suite after changes to prompt/material/field/fact-check modules, as specified by the connected project's `AGENTS.md`. Golden fixtures should change only for intentional prompt changes. These cases are proposed acceptance criteria; no remote mutations or remote tests were performed by this review agent.
