# Prompt eval — v2-final

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `74b47076ee3c`
- Git sha: `2afda15`
- Cases × runs: 19 × 1
- LLM grader: on
- Tokens: 204,529 in / 44,492 out
- Started: 2026-10-14T15:02:10.045Z
- Result: **15/19 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| C1-leasehold-missing-ground-rent | FAIL | 1 | 0 | 9.8 | 26.2 | – | 0 | PASS 4.88 |
| C2-shared-ownership | FAIL | 1 | 2 | 10.1 | 20.1 | – | 0 | PASS 5.00 |
| C3-flood-history | PASS | 0 | 0 | 8.9 | 20.4 | – | 0 | PASS 5.00 |
| C4-knotweed | FAIL | 1 | 1 | 20.6 | 20.7 | – | 1 | PASS 5.00 |
| C5-modern-method-of-auction | PASS | 0 | 0 | 8.9 | 25.0 | – | 0 | PASS 5.00 |
| C5-modern-method-of-auction-legacy | PASS | 0 | 1 | 16.0 | 50.9 | – | 2 | PASS 5.00 |
| C6-voice-note-conflicts-and-private-leak | PASS | 0 | 0 | 8.3 | 20.6 | – | 0 | PASS 4.88 |
| A1-ex-la-terrace-medway-plain | PASS | 0 | 0 | 9.9 | 25.5 | – | 0 | PASS 5.00 |
| A7-lordswood-planning-conflict | PASS | 0 | 0 | 10.0 | 23.3 | – | 0 | PASS 5.00 |
| A2-flat-over-shop-streatham-professional | PASS | 0 | 2 | 9.8 | 23.3 | – | 0 | PASS 4.50 |
| A3-1930s-semi-sevenoaks-premium | PASS | 0 | 0 | 14.1 | 29.6 | – | 0 | PASS 5.00 |
| A4-country-house-frant-luxury | FAIL | 1 | 2 | 11.4 | 34.3 | – | 0 | PASS 5.00 |
| A5-victorian-cottage-smarden-heritage | PASS | 0 | 2 | 12.5 | 24.3 | – | 0 | PASS 5.00 |
| A6-new-build-kings-hill-professional | PASS | 0 | 0 | 10.5 | 49.3 | – | 1 | PASS 5.00 |
| A6-new-build-kings-hill-professional-legacy | PASS | 0 | 1 | 20.1 | 57.2 | – | 2 | PASS 4.63 |
| E1-brenzett | PASS | 0 | 4 | – | – | 5.4 | 0 | – |
| E2-flat-no-tenure | PASS | 0 | 2 | – | – | 3.5 | 0 | – |
| E3-contradiction | PASS | 0 | 3 | – | – | 2.9 | 0 | – |
| E4-knotweed-disclosure | PASS | 0 | 1 | – | – | 3.4 | 0 | – |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 2 | materialInfo: listing: missing "…" | C1-leasehold-missing-ground-rent, C2-shared-ownership |
| 2 | materialInfo: emailBlast.body: missing "…" | C4-knotweed, A4-country-house-frant-luxury |

## Details

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `materialInfo` listing: missing "Guide Price £195,000"
- LLM: PASS (avg 4.88; 1:5 2:4 3:5 4:5 5:5 6:5 7:5 8:5)
  - Portal description: Add ground rent information if available (voice note mentions £300/year but not confirmed in structured facts, so either obtain confirmation or add to seller approval email questions)
  - Key features: Consider reordering to lead with the strongest selling point (parking or lift access) before the more generic 'First-floor purpose-built flat'
  - Strapline: Minor tightening possible - could remove 'access' after 'lift' to save characters (currently 237/250)

### C2-shared-ownership — FAIL

- FAIL `materialInfo` listing: missing "Shared Ownership £130,000"
- 2 warning(s): `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C3-flood-history — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — FAIL

- FAIL `materialInfo` emailBlast.body: missing "Guide Price £850,000"
- 1 warning(s): `factCheck` "London" (name) in description is not in the inputs
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction-legacy — PASS

- 1 warning(s): `materialInfo` social.X: no price
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C6-voice-note-conflicts-and-private-leak — PASS

- LLM: PASS (avg 4.88; 1:5 2:5 3:5 4:5 5:5 6:5 7:4 8:5)
  - Portal description: Consider leading with the indoor pool in the opening paragraph to strengthen the hook: 'Hollybank is a detached four-bedroom house with indoor swimming pool occupying 2.1 acres...'
  - Portal description: The standalone sentence 'The property has a kitchen and family space' adds little value and could be removed or integrated more meaningfully
  - Portal description: 'Wrotham is located in Tonbridge and Malling' is weak filler that could be removed to tighten the copy

### A1-ex-la-terrace-medway-plain — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A7-lordswood-planning-conflict — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A2-flat-over-shop-streatham-professional — PASS

- 2 warning(s): `factCheck` "How" (name) in seller email is not in the inputs; `raw:limits` Email body doesn't end with the material-information line (fixed by the app before the agent sees it)
- LLM: PASS (avg 4.50; 1:4 2:4 3:5 4:4 5:5 6:5 7:4 8:5)
  - Portal description: change 'The ground floor comprises' to 'The first floor comprises' (maisonette is on first and second floors, not ground and first)
  - Portal description: change 'On the first floor' to 'On the second floor' (bedrooms and bathroom are on the second floor)
  - Key features: remove the duplicate 'Access via rear service yard shared with commercial unit; shared bin store' (already covered in feature 2 'Own entrance via rear service yard')
  - Email body: remove the duplicate sentence 'There is access via a rear service yard shared with the commercial unit and a shared bin store' at the end of paragraph 3 (already stated earlier in the same paragraph)

### A3-1930s-semi-sevenoaks-premium — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — FAIL

- FAIL `materialInfo` emailBlast.body: missing "Guide Price £2,100,000"
- 2 warning(s): `limits` Seller email list line 39 words (max 35); `raw:limits` Seller email list line 39 words (max 35)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A5-victorian-cottage-smarden-heritage — PASS

- 2 warning(s): `limits` Seller email list line 39 words (max 35); `raw:limits` Seller email list line 39 words (max 35)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional-legacy — PASS

- 1 warning(s): `raw:banned` Banned phrase "book your viewing today" in emailBlast.personalMessage (fixed by the app before the agent sees it)
- LLM: PASS (avg 4.63; 1:4 2:5 3:5 4:5 5:5 6:5 7:4 8:4)
  - Email body: Living room dimension given as '4.10m x 3.00m (13'5" x 9'10")' should be '4.90m x 3.30m (16'1" x 10'10")' to match the facts.
  - Headline: 'New-build semi-detached house, Kings Hill, West Malling' is 59 characters but could lead stronger with '3-bed new-build semi, Kings Hill, West Malling' (49 chars) to front-load the bedroom count.
  - Key features: Consider reordering to lead with the most distinctive feature – move '10-year NHBC warranty; completion expected spring 2027' to first position as the completion date is critical for new-builds.
  - Portal description: 'Kings Hill is approx. 2 miles from West Malling station' could be tightened to 'West Malling station is approx. 2 miles away' for consistency with other outputs.

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
