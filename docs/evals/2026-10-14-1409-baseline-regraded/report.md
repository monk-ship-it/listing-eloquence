# Prompt eval — 2026-10-14-1409-baseline-regraded

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `eb82f283dca2`
- Git sha: `b58f6d0`
- Cases × runs: 16 × 1
- LLM grader: on
- Tokens: 107,936 in / 28,455 out
- Started: 2026-10-14T14:19:41.855Z
- Result: **5/16 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A1-ex-la-terrace-medway-plain | FAIL | 4 | 0 | 10.1 | 16.8 | – | 0 | FAIL 3.38 |
| A2-flat-over-shop-streatham-professional | FAIL | 2 | 2 | 12.1 | 20.2 | – | 0 | PASS 5.00 |
| A3-1930s-semi-sevenoaks-premium | FAIL | 4 | 0 | 13.3 | 21.7 | – | 0 | PASS 5.00 |
| A4-country-house-frant-luxury | FAIL | 2 | 1 | 12.9 | 21.7 | – | 0 | PASS 5.00 |
| A5-victorian-cottage-smarden-heritage | FAIL | 11 | 0 | 14.4 | 48.3 | – | 1 | FAIL 3.63 |
| A6-new-build-kings-hill-professional | FAIL | 8 | 2 | 10.4 | 22.1 | – | 0 | PASS 5.00 |
| C1-leasehold-missing-ground-rent | FAIL | 4 | 0 | 7.6 | 17.3 | – | 0 | PASS 4.63 |
| C2-shared-ownership | FAIL | 9 | 0 | 8.1 | 19.2 | – | 0 | PASS 5.00 |
| C3-flood-history | FAIL | 2 | 0 | 10.1 | 17.4 | – | 0 | PASS 5.00 |
| C4-knotweed | FAIL | 4 | 0 | 9.5 | 35.0 | – | 1 | PASS 5.00 |
| C5-modern-method-of-auction | PASS | 0 | 0 | 8.2 | 17.1 | – | 0 | PASS 5.00 |
| C6-voice-note-conflicts-and-private-leak | FAIL | 2 | 2 | 6.6 | 16.0 | – | 0 | FAIL 4.00 |
| E1-brenzett | PASS | 0 | 4 | – | – | 4.9 | 0 | – |
| E2-flat-no-tenure | PASS | 0 | 2 | – | – | 3.6 | 0 | – |
| E3-contradiction | PASS | 0 | 3 | – | – | 2.3 | 0 | – |
| E4-knotweed-disclosure | PASS | 0 | 1 | – | – | 3.0 | 0 | – |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 7 | limits: X post N > N chars incl. hashtags | A1-ex-la-terrace-medway-plain, A2-flat-over-shop-streatham-professional, A3-1930s-semi-sevenoaks-premium, A4-country-house-frant-luxury, A6-new-build-kings-hill-professional, C2-shared-ownership, C4-knotweed |
| 7 | raw:limits: X post N > N chars incl. hashtags | A1-ex-la-terrace-medway-plain, A2-flat-over-shop-streatham-professional, A3-1930s-semi-sevenoaks-premium, A4-country-house-frant-luxury, A6-new-build-kings-hill-professional, C2-shared-ownership, C4-knotweed |
| 5 | limits: Preview text N > N chars | A3-1930s-semi-sevenoaks-premium, A6-new-build-kings-hill-professional, C3-flood-history, C4-knotweed, C6-voice-note-conflicts-and-private-leak |
| 5 | raw:limits: Preview text N > N chars | A3-1930s-semi-sevenoaks-premium, A6-new-build-kings-hill-professional, C3-flood-history, C4-knotweed, C6-voice-note-conflicts-and-private-leak |
| 2 | banned: Banned phrase "…" in listing | A6-new-build-kings-hill-professional, C1-leasehold-missing-ground-rent |
| 2 | raw:banned: Banned phrase "…" in listing | A6-new-build-kings-hill-professional, C1-leasehold-missing-ground-rent |
| 2 | materialInfo: listing: missing "…" | C1-leasehold-missing-ground-rent, C2-shared-ownership |
| 1 | limits: Seller email doesn't start "…" | A1-ex-la-terrace-medway-plain |
| 1 | raw:limits: Seller email doesn't start "…" | A1-ex-la-terrace-medway-plain |
| 1 | limits: Email Blast missing | A5-victorian-cottage-smarden-heritage |

## Details

### A1-ex-la-terrace-medway-plain — FAIL

- FAIL `limits` Seller email doesn't start "Dear [Seller name]," — `Dear Seller,  Thank you for instructing us to market the pro`
- FAIL `limits` X post 294 > 280 chars incl. hashtags — `Guide Price £285,000. Freehold. 3-bed mid-terrace, Fernhill Close, Lordswood, Chatham ME5. Kitchen/diner, utility, rear garden. Gas central heating, Worcester boiler 2019. No chain. Council Tax Band B, EPC C. Full materi`
- FAIL `raw:limits` Seller email doesn't start "Dear [Seller name]," — `Dear Seller,  Thank you for instructing us to market the pro`
- FAIL `raw:limits` X post 294 > 280 chars incl. hashtags — `Guide Price £285,000. Freehold. 3-bed mid-terrace, Fernhill Close, Lordswood, Chatham ME5. Kitchen/diner, utility, rear garden. Gas central heating, Worcester boiler 2019. No chain. Council Tax Band B, EPC C. Full materi`
- LLM: FAIL (avg 3.38; 1:1 2:2 3:4 4:5 5:5 6:5 7:4 8:1)
  - "repaired August 2026" — impossible future date. Facts state repair happened, voice notes say "fixed in August". Change to August 2024 or verify actual year throughout all outputs.
  - Seller approval email asks "How is the mobile signal" — this fact is not in the supplied material information list, so cannot be requested. Remove this question.
  - Instagram hashtag "#InvestorOpportunity" — likely buyer emphasis must never appear in marketing. Remove this hashtag.
  - Facebook hashtag "#InvestorProperty" — likely buyer emphasis must never appear in marketing. Remove this hashtag.
  - Portal description imperial conversions incorrect: 4.62m = 15'2" should be 15'2"; 5.45m = 17'11" should be 17'10"; 3.80m = 12'6" should be 12'6"; verify all conversions.
  - Key features item 8 ends without full stop (correct per format rules), but check consistency across all features.
  - Email body paragraph structure: currently 2 paragraphs plus CTA. Ensure material-information line "Full material information is on the property listing" ends the body text before CTA.
  - Social posts: ensure all three are present and distinct (Instagram, Facebook, X) — currently provided but verify character limits for X (formerly Twitter) platform.

### A2-flat-over-shop-streatham-professional — FAIL

- FAIL `limits` X post 319 > 280 chars incl. hashtags — `Two-bedroom maisonette, Streatham High Road SW16. Offers in Excess of £375,000. Leasehold · 89 years remaining. Own entrance, bay living room, kitchen fitted 2022. Section 42 served. Streatham station approx. 6 mins' wal`
- FAIL `raw:limits` X post 319 > 280 chars incl. hashtags — `Two-bedroom maisonette, Streatham High Road SW16. Offers in Excess of £375,000. Leasehold · 89 years remaining. Own entrance, bay living room, kitchen fitted 2022. Section 42 served. Streatham station approx. 6 mins' wal`
- 2 warning(s): `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A3-1930s-semi-sevenoaks-premium — FAIL

- FAIL `limits` Preview text 105 > 90 chars — `Four-bedroom freehold semi-detached house with 2021 kitchen extension, loft conversion and garden office.`
- FAIL `limits` X post 367 > 280 chars incl. hashtags — `Guide Price £975,000 · Freehold  Oak Lane, Sevenoaks TN13 — four-bedroom 1930s semi with 2021 kitchen extension, 2019 loft conversion (en-suite, building regs cert), log burner, garden office. South-west garden approx. 3`
- FAIL `raw:limits` Preview text 105 > 90 chars — `Four-bedroom freehold semi-detached house with 2021 kitchen extension, loft conversion and garden office.`
- FAIL `raw:limits` X post 367 > 280 chars incl. hashtags — `Guide Price £975,000 · Freehold  Oak Lane, Sevenoaks TN13 — four-bedroom 1930s semi with 2021 kitchen extension, 2019 loft conversion (en-suite, building regs cert), log burner, garden office. South-west garden approx. 3`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — FAIL

- FAIL `limits` X post 317 > 280 chars incl. hashtags — `Brook Hall, near Frant — detached Edwardian country house (1908) on approx. 4.5 acres. 5 bed, 4 bath, 4 reception. Gated drive, heated pool, oak cart lodge with annexe, 3-acre paddock. Guide Price £2.1m, Freehold. Full m`
- FAIL `raw:limits` X post 317 > 280 chars incl. hashtags — `Brook Hall, near Frant — detached Edwardian country house (1908) on approx. 4.5 acres. 5 bed, 4 bath, 4 reception. Gated drive, heated pool, oak cart lodge with annexe, 3-acre paddock. Guide Price £2.1m, Freehold. Full m`
- 1 warning(s): `materialInfo` social.X: no price
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A5-victorian-cottage-smarden-heritage — FAIL

- FAIL `limits` Email Blast missing
- FAIL `limits` Seller email missing
- FAIL `limits` 0 social posts (need 3)
- FAIL `materialInfo` emailBlast.body: missing "Guide Price £425,000"
- FAIL `materialInfo` emailBlast.body: missing tenure "Freehold"
- FAIL `materialInfo` emailBlast.body: missing council tax band C
- FAIL `materialInfo` emailBlast.body: missing EPC E
- FAIL `raw:limits` Email Blast missing
- FAIL `raw:limits` Seller email missing
- FAIL `raw:limits` 0 social posts (need 3)
- FAIL `marketing` marketing call failed
- LLM: FAIL (avg 3.63; 1:5 2:5 3:5 4:1 5:5 6:3 7:4 8:1)
  - Add EMAIL BLAST: 3 subject lines (≤60 chars each), preview (≤90 chars), and email body (2–4 paragraphs ending with material-information line)
  - Add SELLER APPROVAL EMAIL: 150–250 words summarising the property for the vendor
  - Add SOCIAL: 3 distinct social media posts as required by format specification
  - Strengthen voice fit: current copy is factual/neutral, not 'warm, cinematic, story-led' Heritage voice. Open with evocative scene-setting (e.g. 'The brick path winds past...' or 'Light falls through...')
  - Headline could lead with story/character: consider 'A Victorian cottage on The Street' or similar to match Heritage voice
  - Portal description: weave narrative thread through rooms rather than inventory format to match cinematic brief
  - Strapline: add warmth/story element beyond pure facts (e.g. reference village life, the forge history, or sensory detail)
  - Key features: rephrase to avoid list format where possible, integrate story elements

### A6-new-build-kings-hill-professional — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…oor and radiators upstairs. The principal bedroom benefits from an en-suite.  The ground floor comprises a living…`
- FAIL `limits` Preview text 125 > 90 chars — `Fixed Price £410,000. Three-bedroom new-build semi with air source heat pump, EV charger and 10-year NHBC warranty. Freehold.`
- FAIL `limits` X post 305 > 280 chars incl. hashtags — `New: Plot 47, Orchard Rise, Kings Hill. Fixed Price £410,000, Freehold. 3-bed new-build semi, completion spring 2027. Air source heat pump, underfloor heating, EV charger, 2 allocated spaces, 10-yr NHBC warranty. Full ma`
- FAIL `mustInclude` "show home" missing from listing
- FAIL `mustInclude` "CGI" missing from listing
- FAIL `raw:limits` Preview text 125 > 90 chars — `Fixed Price £410,000. Three-bedroom new-build semi with air source heat pump, EV charger and 10-year NHBC warranty. Freehold.`
- FAIL `raw:limits` X post 305 > 280 chars incl. hashtags — `New: Plot 47, Orchard Rise, Kings Hill. Fixed Price £410,000, Freehold. 3-bed new-build semi, completion spring 2027. Air source heat pump, underfloor heating, EV charger, 2 allocated spaces, 10-yr NHBC warranty. Full ma`
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…oor and radiators upstairs. The principal bedroom benefits from an en-suite.  The ground floor comprises a living…`
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…kitchen/living room and lift access. The property benefits from a Juliet balcony and one allocated parking space.…`
- FAIL `materialInfo` listing: missing "Guide Price £195,000"
- FAIL `mustInclude` "ground rent" missing from sellerEmail.body
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…kitchen/living room and lift access. The property benefits from a Juliet balcony and one allocated parking space.…`
- LLM: PASS (avg 4.63; 1:4 2:3 3:5 4:5 5:5 6:5 7:5 8:5)
  - Add ground rent (£300 per year) to material information section in portal description, key features, and email blast - this is a material leasehold cost mentioned in voice notes
  - In seller approval email, add ground rent: '5. Ground rent: £300 per year' and renumber subsequent items
  - Add space after comma in seller approval email address: 'Flat 4,Albion House' should be 'Flat 4, Albion House'
  - Consider adding ground rent to strapline or key features for transparency, though space may be limited

### C2-shared-ownership — FAIL

- FAIL `factCheck` "£325" (number) in social is not in the inputs — `£325`
- FAIL `limits` Strapline opens with a digit — `40% share £130,000 (full market value £325,000), rent £487 p`
- FAIL `limits` X post 360 > 280 chars incl. hashtags — `Shared Ownership £130,000 for 40% share. 2-bed mid-terrace, 14 Wren Close, Dartford DA1. Rear garden, 2 parking spaces. Leasehold 990 yrs. Rent £487/mo on unsold share. Full value £325k. Service charge £312/yr. Ground re`
- FAIL `materialInfo` listing: missing "Shared Ownership £130,000"
- FAIL `mustNotInclude` "Peppercorn per year" in listing — `…h. Leasehold, 990 years remaining. Ground rent is peppercorn per year. Service charge £312 per year (2026/27 estimate).…`
- FAIL `mustNotInclude` "Peppercorn per year" in emailBlast.body — `…ing B.  Leasehold, 990 years remaining. Ground rent peppercorn per year. Service charge £312 per year (2026/27 estimate…`
- FAIL `mustNotInclude` "Peppercorn per year" in social.Facebook — `…ing B.  Leasehold, 990 years remaining. Ground rent peppercorn per year. Service charge £312 per year (2026/27 estimate…`
- FAIL `raw:limits` Strapline opens with a digit — `40% share £130,000 (full market value £325,000), rent £487 p`
- FAIL `raw:limits` X post 360 > 280 chars incl. hashtags — `Shared Ownership £130,000 for 40% share. 2-bed mid-terrace, 14 Wren Close, Dartford DA1. Rear garden, 2 parking spaces. Leasehold 990 yrs. Rent £487/mo on unsold share. Full value £325k. Service charge £312/yr. Ground re`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C3-flood-history — FAIL

- FAIL `limits` Preview text 94 > 90 chars — `A three-bedroom detached cottage from c.1850 with exposed beams and a garden to the riverbank.`
- FAIL `raw:limits` Preview text 94 > 90 chars — `A three-bedroom detached cottage from c.1850 with exposed beams and a garden to the riverbank.`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — FAIL

- FAIL `limits` Preview text 95 > 90 chars — `Four-bedroom detached house with extended kitchen/family room, double garage and 0.3-acre plot.`
- FAIL `limits` X post 343 > 280 chars incl. hashtags — `Guide Price £850,000. Freehold. Four-bedroom detached house, Beech Avenue, Sevenoaks TN13. Extended kitchen/family room, double garage, 0.3-acre plot. Council Tax Band G, EPC D. Japanese knotweed treatment in progress wi`
- FAIL `raw:limits` Preview text 95 > 90 chars — `Four-bedroom detached house with extended kitchen/family room, double garage and 0.3-acre plot.`
- FAIL `raw:limits` X post 343 > 280 chars incl. hashtags — `Guide Price £850,000. Freehold. Four-bedroom detached house, Beech Avenue, Sevenoaks TN13. Extended kitchen/family room, double garage, 0.3-acre plot. Council Tax Band G, EPC D. Japanese knotweed treatment in progress wi`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C6-voice-note-conflicts-and-private-leak — FAIL

- FAIL `limits` Preview text 91 > 90 chars — `Detached house with indoor swimming pool, triple garage and 2.1-acre plot in the Kent Downs`
- FAIL `raw:limits` Preview text 91 > 90 chars — `Detached house with indoor swimming pool, triple garage and 2.1-acre plot in the Kent Downs`
- 2 warning(s): `factCheck` "North" (name) in strapline is not in the inputs; `materialInfo` social.X: no price
- LLM: FAIL (avg 4.00; 1:2 2:4 3:5 4:5 5:5 6:5 7:4 8:2)
  - FACTS state 4 bedrooms but voice notes say 'Five-bed detached' - critical inconsistency. Verify actual bedroom count before publishing.
  - FACTS state '2.1-acre plot' but voice notes say 'about three acres' - use the correct acreage throughout all materials.
  - Voice notes state 'EPC C now the windows are done' but all outputs show EPC D. Verify current EPC rating and update if C is correct.
  - Voice notes state 'guide one point three million' but all outputs show £1,250,000. Verify correct guide price (£1.3m vs £1.25m).
  - Seller approval email states 'Bedrooms: 4' but voice notes indicate 5 bedrooms - this inconsistency must be resolved.
  - Plot size inconsistency: 2.1 acres (FACTS) vs 'about three acres' (voice notes) appears in all outputs - verify and correct.
  - EPC rating discrepancy between voice notes (C) and all outputs (D) creates compliance risk - must verify actual rating.
  - Price discrepancy: £1.25m in outputs vs £1.3m in voice notes - confirm correct guide price before publication.

### E1-brenzett — PASS

- Precision 1.00, recall 1.00
- 4 warning(s): `extraction` unexpected field address (not in expectFields); `extraction` unexpected field propertyType (not in expectFields); `extraction` unexpected field outsideSpace (not in expectFields); `extraction` unexpected field parking (not in expectFields)

### E2-flat-no-tenure — PASS

- Precision 1.00, recall 1.00
- 2 warning(s): `extraction` unexpected field propertyType (not in expectFields); `extraction` unexpected field parking (not in expectFields)

### E3-contradiction — PASS

- Precision 1.00, recall 1.00
- 3 warning(s): `extraction` unexpected field price (not in expectFields); `extraction` unexpected field priceQualifier (not in expectFields); `extraction` unexpected field bedrooms (not in expectFields)

### E4-knotweed-disclosure — PASS

- Precision 1.00, recall 1.00
- 1 warning(s): `extraction` unexpected field disclosures (not in expectFields)
