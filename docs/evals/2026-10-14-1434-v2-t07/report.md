# Prompt eval — v2-t07

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `8b2771c0beb2`
- Git sha: `f133d10`
- Cases × runs: 19 × 1
- LLM grader: on
- Tokens: 182,309 in / 38,236 out
- Started: 2026-10-14T14:34:24.653Z
- Result: **8/19 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| C1-leasehold-missing-ground-rent | FAIL | 6 | 1 | 9.9 | 21.8 | – | 0 | PASS 5.00 |
| C2-shared-ownership | PASS | 0 | 0 | 8.5 | 20.9 | – | 0 | PASS 5.00 |
| C3-flood-history | PASS | 0 | 0 | 8.9 | 26.4 | – | 0 | PASS 5.00 |
| C4-knotweed | FAIL | 2 | 0 | 9.6 | 19.2 | – | 0 | PASS 5.00 |
| C5-modern-method-of-auction | PASS | 0 | 0 | 8.3 | 45.1 | – | 1 | PASS 5.00 |
| C5-modern-method-of-auction-legacy | FAIL | 1 | 0 | 6.6 | 27.1 | – | 0 | PASS 5.00 |
| C6-voice-note-conflicts-and-private-leak | FAIL | 3 | 0 | 10.3 | 41.7 | – | 1 | FAIL 4.00 |
| A1-ex-la-terrace-medway-plain | PASS | 0 | 0 | 13.0 | 20.3 | – | 0 | FAIL 3.75 |
| A7-lordswood-planning-conflict | FAIL | 3 | 0 | 20.6 | 22.5 | – | 0 | FAIL 3.63 |
| A2-flat-over-shop-streatham-professional | FAIL | 2 | 0 | 11.7 | 23.5 | – | 0 | PASS 5.00 |
| A3-1930s-semi-sevenoaks-premium | FAIL | 5 | 0 | 14.9 | 29.7 | – | 0 | PASS 5.00 |
| A4-country-house-frant-luxury | FAIL | 2 | 0 | 12.7 | 34.5 | – | 0 | PASS 5.00 |
| A5-victorian-cottage-smarden-heritage | FAIL | 3 | 0 | 10.9 | 28.4 | – | 0 | PASS 5.00 |
| A6-new-build-kings-hill-professional | FAIL | 9 | 2 | 10.4 | 26.4 | – | 0 | FAIL 3.13 |
| A6-new-build-kings-hill-professional-legacy | FAIL | 6 | 2 | 12.9 | 24.6 | – | 0 | PASS 5.00 |
| E1-brenzett | PASS | 0 | 4 | – | – | 5.1 | 0 | – |
| E2-flat-no-tenure | PASS | 0 | 2 | – | – | 3.2 | 0 | – |
| E3-contradiction | PASS | 0 | 3 | – | – | 2.6 | 0 | – |
| E4-knotweed-disclosure | PASS | 0 | 1 | – | – | 3.4 | 0 | – |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 6 | limits: Seller email N words (need N–N) | A7-lordswood-planning-conflict, A2-flat-over-shop-streatham-professional, A3-1930s-semi-sevenoaks-premium, A4-country-house-frant-luxury, A5-victorian-cottage-smarden-heritage, A6-new-build-kings-hill-professional-legacy |
| 6 | raw:limits: Seller email N words (need N–N) | A7-lordswood-planning-conflict, A2-flat-over-shop-streatham-professional, A3-1930s-semi-sevenoaks-premium, A4-country-house-frant-luxury, A5-victorian-cottage-smarden-heritage, A6-new-build-kings-hill-professional-legacy |
| 2 | banned: Banned phrase "…" in listing | C1-leasehold-missing-ground-rent, A6-new-build-kings-hill-professional |
| 2 | raw:banned: Banned phrase "…" in listing | C1-leasehold-missing-ground-rent, A6-new-build-kings-hill-professional |
| 2 | v2: emailBlast.body: no "…" sentence | C5-modern-method-of-auction-legacy, A3-1930s-semi-sevenoaks-premium |
| 2 | v2: social.X: missing image label (N triggered) | A6-new-build-kings-hill-professional, A6-new-build-kings-hill-professional-legacy |
| 1 | banned: Banned phrase "…" in emailBlast.body | C1-leasehold-missing-ground-rent |
| 1 | limits: Preview text N > N chars | C1-leasehold-missing-ground-rent |
| 1 | raw:limits: Preview text N > N chars | C1-leasehold-missing-ground-rent |
| 1 | raw:banned: Banned phrase "…" in emailBlast.body | C1-leasehold-missing-ground-rent |

## Details

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…here are two bedrooms and a bathroom.  The property benefits from one allocated parking space and lift access.  G…`
- FAIL `banned` Banned phrase "benefits from" in emailBlast.body — `…cony, two bedrooms, and one bathroom. The building benefits from a lift and there is one allocated parking space.…`
- FAIL `limits` Preview text 94 > 90 chars — `Leasehold · 99 years remaining · Open-plan kitchen/living room · Juliet balcony · Lift · EPC C`
- FAIL `raw:limits` Preview text 94 > 90 chars — `Leasehold · 99 years remaining · Open-plan kitchen/living room · Juliet balcony · Lift · EPC C`
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…here are two bedrooms and a bathroom.  The property benefits from one allocated parking space and lift access.  G…`
- FAIL `raw:banned` Banned phrase "benefits from" in emailBlast.body — `…cony, two bedrooms, and one bathroom. The building benefits from a lift and there is one allocated parking space.…`
- 1 warning(s): `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C2-shared-ownership — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C3-flood-history — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — FAIL

- FAIL `banned` Banned phrase "benefits from" in emailBlast.personalMessage — `…been extended to create a kitchen/family room and benefits from a double garage and driveway parking. Gas central…`
- FAIL `raw:banned` Banned phrase "benefits from" in emailBlast.personalMessage — `…been extended to create a kitchen/family room and benefits from a double garage and driveway parking. Gas central…`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction-legacy — FAIL

- FAIL `v2` emailBlast.body: no "Please note:" sentence
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C6-voice-note-conflicts-and-private-leak — FAIL

- FAIL `factCheck` "20" (number) in description is not in the inputs — `20`
- FAIL `factCheck` "26" (number) in description is not in the inputs — `26`
- FAIL `factCheck` "two" (number) in description is not in the inputs — `two`
- LLM: FAIL (avg 4.00; 1:2 2:4 3:5 4:5 5:5 6:5 7:4 8:2)
  - FACTS state 4 bedrooms but voice notes say 'Five-bed detached' – resolve this critical discrepancy before publication
  - FACTS state 2.1-acre plot but voice notes say 'about three acres' – verify and use the correct figure consistently
  - FACTS state Guide Price £1,250,000 but voice notes say 'guide one point three million' – confirm the correct asking price
  - FACTS state EPC rating D but voice notes say 'EPC C now the windows are done' – verify current EPC rating
  - Voice notes mention 'Stunning views to London' which is a strong selling point but not mentioned anywhere in the pack – add if verifiable
  - Voice notes mention lockbox 4471 and dog in kitchen – ensure these operational details are communicated to viewing team
  - Headline 'Detached house with indoor pool, 2.1 acres, triple garage' is 58 characters but could lead with stronger luxury positioning for this price point
  - Portal description could strengthen opening with the acreage and setting before the address for better luxury voice fit

### A1-ex-la-terrace-medway-plain — PASS

- LLM: FAIL (avg 3.75; 1:2 2:3 3:5 4:4 5:5 6:5 7:4 8:2)
  - "repaired August 2026" – impossible future date. Change to August 2024 throughout all outputs (portal description, email blast, seller email, all 3 social posts)
  - Key features: remove "Guide Price £285,000" – price qualifiers belong with tenure in material information section, not in key features
  - Key features: 10 items listed but format requires 6–10. Consider if all are genuinely key features or if some weaker items could be removed
  - Seller email: "repaired August 2026" appears in point 10 – must be corrected to 2024
  - Instagram post: "repaired August 2026" – must be corrected to 2024
  - Facebook post: "repaired August 2026" – must be corrected to 2024
  - Voice notes mention "would rent for fifteen hundred easy" – this yield/return claim must never appear in any output (correctly omitted, but flag for vigilance)
  - Headline is 68 characters (within 70 limit) but could lead more strongly with "3-bed freehold mid-terrace" rather than leading with ex-local-authority descriptor

### A7-lordswood-planning-conflict — FAIL

- FAIL `limits` Seller email 254 words (need 150–250)
- FAIL `patterns` keyFeature /damp/ lacks /not yet redecorated/ — `Damp mark bathroom ceiling, tile repaired Aug 2026, not redecorated`
- FAIL `raw:limits` Seller email 254 words (need 150–250)
- LLM: FAIL (avg 3.63; 1:1 2:3 3:5 4:5 5:5 6:5 7:4 8:1)
  - Change 'repaired August 2026' to 'repaired August 2024' throughout all outputs (appears in key features, portal description, email blast, seller email, and all social posts) – the repair date is in the future and impossible
  - Remove 'Honestly an investor's dream, would rent for fifteen hundred easy' inference – no rental value appears in FACTS or MATERIAL INFORMATION, this is from voice notes opinion only
  - Verify and correct the repair date in FACTS section – currently states 'August 2026' which appears to be a typo for 2024 or another past year
  - Ensure consistency check across all outputs once date is corrected – currently the impossible future date appears in 6+ places
  - Consider whether 'Ex-local-authority' should lead every piece or whether 'Three-bedroom freehold house' would be stronger selling language while remaining factual
  - Email blast body could strengthen opening by leading with 'Three-bedroom freehold house' before property type detail
  - Portal description could reorder to lead with bedroom count and freehold status before ex-local-authority detail
  - Seller email question 18 should match the exact wording used in material information for consistency

### A2-flat-over-shop-streatham-professional — FAIL

- FAIL `limits` Seller email 319 words (need 150–250)
- FAIL `raw:limits` Seller email 319 words (need 150–250)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A3-1930s-semi-sevenoaks-premium — FAIL

- FAIL `limits` Seller email 284 words (need 150–250)
- FAIL `v2` emailBlast.body: no "Please note:" sentence
- FAIL `v2` social.Instagram: no "Please note:" sentence
- FAIL `v2` social.Facebook: no "Please note:" sentence
- FAIL `raw:limits` Seller email 284 words (need 150–250)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — FAIL

- FAIL `limits` Seller email 256 words (need 150–250)
- FAIL `raw:limits` Seller email 256 words (need 150–250)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A5-victorian-cottage-smarden-heritage — FAIL

- FAIL `limits` Seller email 252 words (need 150–250)
- FAIL `raw:limits` Email Blast missing
- FAIL `raw:limits` Seller email 252 words (need 150–250)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…mpletion is expected in spring 2027. The property benefits from an air source heat pump with underfloor heating t…`
- FAIL `materialInfo` emailBlast.body: missing "Fixed Price £410,000"
- FAIL `privateLeak` Private-note wording "exterior" in description — `exterior`
- FAIL `privateLeak` Private-note wording "image" in description — `image`
- FAIL `privateLeak` Private-note wording "exterior image is" in description — `exterior image is`
- FAIL `v2` social.Instagram: missing image label (2 triggered)
- FAIL `v2` social.Facebook: missing image label (2 triggered)
- FAIL `v2` social.X: missing image label (2 triggered)
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…mpletion is expected in spring 2027. The property benefits from an air source heat pump with underfloor heating t…`
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: FAIL (avg 3.13; 1:3 2:4 3:2 4:3 5:3 6:4 7:4 8:2)
  - Remove 'From' before £410,000 throughout (subject lines, email body, social posts). The price qualifier is 'Fixed Price', not 'From'.
  - Subject line 1: 'New instruction: 3-bed semi, Kings Hill – From £410,000' – change to 'Fixed Price £410,000' (also 61 chars, over 60 limit).
  - Subject line 2: 'Just listed: 3-bed new build, West Malling – From £410,000' – change to 'Fixed Price £410,000' (also 65 chars, over 60 limit).
  - Subject line 3: 'Air source heat pump: 3-bed semi, Kings Hill – From £410,000' – change to 'Fixed Price £410,000' (also 67 chars, over 60 limit).
  - Instagram post: 'From £410,000' – change to 'Fixed Price £410,000'.
  - Facebook post: 'From £410,000' – change to 'Fixed Price £410,000'.
  - X/Twitter post: 'From £410,000' – change to 'Fixed Price £410,000'.
  - Seller approval email question 1: 'Asking price: From £410,000' – change to 'Asking price: £410,000'.

### A6-new-build-kings-hill-professional-legacy — FAIL

- FAIL `limits` Seller email 291 words (need 150–250)
- FAIL `mustInclude` "show home" missing from listing
- FAIL `mustInclude` "CGI" missing from listing
- FAIL `v2` listing: missing image label (2 triggered)
- FAIL `v2` social.X: missing image label (2 triggered)
- FAIL `raw:limits` Seller email 291 words (need 150–250)
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

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
