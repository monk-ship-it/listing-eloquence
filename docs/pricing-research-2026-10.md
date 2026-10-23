# Quill UK competitor pricing and launch recommendation

Research date: 22 October 2026 (Europe/London). Prices below are vendors' published offers, not a test of product quality, customer numbers, output accuracy or fulfilment. Only primary vendor pages support the price comparison. VAT is marked unknown wherever the page does not explicitly explain it.

## Recommended monthly prices

| Quill plan | GBP per month | Existing listing allowance | Effective price at full allowance |
| --- | ---: | ---: | ---: |
| Starter | £15 | 15 | £1.00 |
| Pro | £29 | 50 | £0.58 |
| Growth | £59 | 120 | £0.49 |

These are a commercially reasoned launch recommendation, not a claim to be the cheapest. Keep the existing allowances to avoid introducing unrelated entitlement changes. Starter and Pro match PropertyScribe's published headline prices for the same description volumes; Growth offers lower unit pricing at higher volume. A lower-priced unlimited rival exists, so do not use "lowest price", "cheapest", or "best value" market-wide claims. These prices are conditional on acceptable inference, support and payment costs; there is no verified unit-cost ledger in this review.

The current Quill remote configuration was inspected read-only: £39/15 listings, £79/50, £149/120, 14-day trial, GBP only, five brand voices, key features, email campaign copy, social captions, saved history, and voice-note input. That price ladder is a premium against close writing-only competitors. There is insufficient verified product differentiation to justify that premium solely through public competitor comparisons.

Quill's current high-volume tier should say "For high-volume agents" or "More listing capacity". Avoid promises of multiple seats, shared workspaces, SSO, API access, CRM distribution, or a dedicated manager unless those features are implemented and verified. Five predefined tones should not be marketed as custom-trained agency brand voice.

## Comparable writing products

| Vendor and primary source | Published price and allowance | Tax treatment stated | Comparison notes |
| --- | --- | --- | --- |
| [PropertyScribe pricing](https://propertyscribe.co.uk/pricing) | Starter £15/month, 15 descriptions; Professional £29/month, 50 descriptions. Three-description free trial. | Not explicitly stated on pricing page | Closest transparent volume comparison. Professional advertises image analysis, premium templates and branding. Unused descriptions do not roll over. Cancel at period end. |
| [ListSmith homepage pricing](https://listsmith.co.uk/) | Pro £7.99/month unlimited; £89 one-time lifetime option. Three instant tries plus 10 free listings/month with an account. | Not explicitly stated on page | Strong lower-priced competitor on paper: full description, headline, key features, social caption and email; Pro advertises history, bulk generation, Word export and saved brand voice. No functional or business-continuity verification performed. |
| [ModelProp AI Particulars Writer](https://www.modelprop.ai/ai-particulars-writer) | £49/month; allowance not stated. | Explicitly excludes VAT; setup fees may apply | First-draft descriptions from bullet points, agency style examples and avoided-word list. Not an unlimited allowance comparison because no allowance is disclosed. |
| [ListingCraft homepage pricing](https://listingcraft.co.uk/) | Standard £97/month for 100 listings; Pro £197/month unlimited. | Not explicitly stated on page | Primarily description plus three headlines, delivered by email. The live primary page differs sharply from an indexed rival's comparison claiming £9.99/month; the primary page takes precedence. |
| [NippyListings homepage](https://nippylistings.com/) and [pricing](https://nippylistings.com/pricing) | Indexed primary-site offer: Starter £29/month, 50 listings; Pro £79/month unlimited; Agency £149/month, up to 10 members. Free 3/month. | Not explicitly stated in retrieved content | Price cards are client rendered and not fully exposed by the live text extractor; numbers were visible in search-indexed primary homepage content. Treat as secondary confidence until manually reconfirmed in the live interface. Pro/Agency advertise substantially more than Quill's verified current single-user scope. |

## Broader marketing products: context, not a writing-only benchmark

[PropertyBox's official pricing](https://propertybox.io/pricing/) publishes £19.99/month for three properties, £39.99 for seven, £79.99 for fifteen, £129.99 for thirty and £199.99 for fifty, all plus VAT. Plans include photography enhancement as a core feature, with descriptions, EPC features and marketing add-ons. These bundles are materially broader than Quill. Their higher property cost is not evidence that a description-only product can support the same headline price. Broad CRMs and portal subscriptions should likewise not be used to claim savings for an unrelated standalone writer without a like-for-like workflow comparison.

## Billing implementation requirements

- Treat the new catalogue as new-customer pricing. Do not silently migrate or reprice existing subscriptions; keep existing price objects for historical invoices and subscribed customers.
- Create GBP monthly recurring Stripe prices in minor units: 1500, 2900 and 5900. Use durable lookup keys and metadata (app, plan, allowance, version), then resolve the permitted plan server-side.
- Check the connected account's existing tax settings and registrations before setting tax behaviour or enabling automatic tax. Do not claim VAT included or excluded based on this research. Display the same treatment beside every price and at Checkout. Do not add VAT to customers without the relevant registration and correct rules.
- Keep the existing allowance period in product copy: if application code resets by calendar month, say "per calendar month", not "per billing month". Trial allowance and trial-to-paid renewal timing must also be explicit and match the server.
- Keep the 14-day trial only if its quota and payment requirements are enforced server-side. The trial must not become an unbounded AI endpoint.
- A listing generation should count once on successful persisted output; failed AI calls should not consume paid allowance. Retry, refinement and duplicate-submit semantics must be documented and tested.
- Authenticate Checkout, portal and subscription reads; map Stripe customer ownership to the signed-in user. Grant entitlements from authenticated, verified webhook events and reconcile subscription status, not a client-supplied success URL.
- Do not issue live charges or create customer subscriptions as a smoke test. Use Stripe's test environment and test events for renewals, failure, duplicate delivery, cancellation and plan change.

## Evidence and limitations

The browser retrieved primary pages on the research date; some results are search-engine cached. No competitor purchase, account provisioning or paid action was performed. Vendor product, compliance and performance claims are not independently verified or adopted as Quill promises. The recommendation intentionally avoids claiming legal compliance or higher sales rates.

Stripe Directory was consulted first as required by the installed Directory skill. Its homepage resolves to the current Directory documentation and describes CLI search. The Stripe documentation connector did not return a relevant Directory guide. The latest official Windows Stripe CLI v1.55.0 was downloaded to a temporary research folder, and Directory plugin v0.3.5 installed successfully. Its help was read. Searches for "UK estate agent property listing writer" and the broader "estate agent software" were attempted; the endpoint rejected the official CLI with "Invalid user agent. This endpoint can only be used by the Stripe CLI tool." Primary vendor pages were therefore used as the fallback. No provider service was provisioned and no payment was made. The parent task owns Stripe catalogue mutations and final app deployment.
