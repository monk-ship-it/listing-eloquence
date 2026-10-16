# Prompt eval — 2026-10-14-1510-v2-final2-regraded-revalidated

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `cc364453c3ba`
- Git sha: `a4cce70`
- Cases × runs: 19 × 1
- LLM grader: on
- Tokens: 268,883 in / 60,219 out
- Started: 2026-10-16T15:02:49.763Z
- Result: **14/19 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A1-ex-la-terrace-medway-plain | PASS | 0 | 0 | 11.0 | 46.9 | – | 1 | PASS 5.00 |
| A2-flat-over-shop-streatham-professional | PASS | 0 | 0 | 10.3 | 23.3 | – | 0 | PASS 5.00 |
| A3-1930s-semi-sevenoaks-premium | FAIL | 1 | 2 | 11.5 | 52.3 | – | 1 | PASS 5.00 |
| A4-country-house-frant-luxury | PASS | 0 | 2 | 32.7 | 56.5 | – | 2 | PASS 5.00 |
| A5-victorian-cottage-smarden-heritage | PASS | 0 | 1 | 15.6 | 22.4 | – | 0 | PASS 5.00 |
| A6-new-build-kings-hill-professional-legacy | FAIL | 6 | 0 | 19.5 | 52.4 | – | 2 | PASS 4.88 |
| A6-new-build-kings-hill-professional | FAIL | 6 | 0 | 26.3 | 50.4 | – | 2 | PASS 5.00 |
| A7-lordswood-planning-conflict | PASS | 0 | 0 | 11.1 | 46.6 | – | 1 | PASS 5.00 |
| C1-leasehold-missing-ground-rent | FAIL | 2 | 3 | 19.2 | 39.3 | – | 2 | PASS 5.00 |
| C2-shared-ownership | PASS | 0 | 2 | 10.1 | 21.3 | – | 0 | PASS 5.00 |
| C3-flood-history | PASS | 0 | 0 | 9.4 | 21.0 | – | 0 | PASS 5.00 |
| C4-knotweed | PASS | 0 | 2 | 20.6 | 40.1 | – | 2 | PASS 5.00 |
| C5-modern-method-of-auction-legacy | PASS | 0 | 1 | 15.1 | 46.2 | – | 2 | PASS 5.00 |
| C5-modern-method-of-auction | FAIL | 1 | 0 | 9.1 | 46.5 | – | 1 | PASS 5.00 |
| C6-voice-note-conflicts-and-private-leak | PASS | 0 | 1 | 9.8 | 41.0 | – | 1 | PASS 5.00 |
| E1-brenzett | PASS | 0 | 4 | – | – | 5.0 | 0 | – |
| E2-flat-no-tenure | PASS | 0 | 2 | – | – | 5.0 | 0 | – |
| E3-contradiction | PASS | 0 | 3 | – | – | 2.7 | 0 | – |
| E4-knotweed-disclosure | PASS | 0 | 1 | – | – | 4.0 | 0 | – |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 2 | mustInclude: "…" missing from listing | A6-new-build-kings-hill-professional-legacy, A6-new-build-kings-hill-professional |
| 2 | v2: listing: missing image label (N triggered) | A6-new-build-kings-hill-professional-legacy, A6-new-build-kings-hill-professional |
| 2 | v2: social.Instagram: missing image label (N triggered) | A6-new-build-kings-hill-professional-legacy, A6-new-build-kings-hill-professional |
| 2 | v2: social.Facebook: missing image label (N triggered) | A6-new-build-kings-hill-professional-legacy, A6-new-build-kings-hill-professional |
| 2 | v2: social.X: missing image label (N triggered) | A6-new-build-kings-hill-professional-legacy, A6-new-build-kings-hill-professional |
| 1 | limits: Preview text N > N chars | A3-1930s-semi-sevenoaks-premium |
| 1 | banned: Banned phrase "…" in emailBlast.body | C1-leasehold-missing-ground-rent |
| 1 | banned: Banned phrase "…" in social.Facebook | C1-leasehold-missing-ground-rent |
| 1 | v2: social.X: no "…" line | C5-modern-method-of-auction |

## Details

### A1-ex-la-terrace-medway-plain — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A2-flat-over-shop-streatham-professional — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A3-1930s-semi-sevenoaks-premium — FAIL

- FAIL `limits` Preview text 98 > 90 chars — `Freehold · 2021 extension · Loft conversion with building regs · Garden office · Station 0.8 miles`
- 2 warning(s): `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately; `raw:limits` Preview text 98 > 90 chars (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — PASS

- 2 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £2,100,000"; `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A5-victorian-cottage-smarden-heritage — PASS

- 1 warning(s): `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional-legacy — FAIL

- FAIL `mustInclude` "show home" missing from listing
- FAIL `mustInclude` "CGI" missing from listing
- FAIL `v2` listing: missing image label (2 triggered)
- FAIL `v2` social.Instagram: missing image label (2 triggered)
- FAIL `v2` social.Facebook: missing image label (2 triggered)
- FAIL `v2` social.X: missing image label (2 triggered)
- LLM: PASS (avg 4.88; 1:5 2:5 3:4 4:5 5:5 6:5 7:5 8:5)
  - Voice note mentions 'Only three Larches left, push that' – this scarcity language must not appear anywhere. Confirmed absent, no fix needed but flagged for vigilance.
  - Consider whether 'We are pleased to offer' in email blast and Facebook adds value or is filler – 'professional' voice may prefer direct opening, though acceptable.
  - X/Twitter post could lead with strongest fact (new-build, location, price) more concisely – current structure is acceptable but could be tightened.

### A6-new-build-kings-hill-professional — FAIL

- FAIL `mustInclude` "show home" missing from listing
- FAIL `mustInclude` "CGI" missing from listing
- FAIL `v2` listing: missing image label (2 triggered)
- FAIL `v2` social.Instagram: missing image label (2 triggered)
- FAIL `v2` social.Facebook: missing image label (2 triggered)
- FAIL `v2` social.X: missing image label (2 triggered)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A7-lordswood-planning-conflict — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `banned` Banned phrase "benefits from" in emailBlast.body — `…balcony, two bedrooms and a bathroom. The building benefits from lift access, and there is one allocated parking …`
- FAIL `banned` Banned phrase "benefits from" in social.Facebook — `…balcony, two bedrooms and a bathroom. The building benefits from lift access, and there is one allocated parking …`
- 3 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £195,000"; `raw:banned` Banned phrase "benefits from" in emailBlast.body (fixed by the app before the agent sees it); `raw:banned` Banned phrase "benefits from" in social.Facebook (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C2-shared-ownership — PASS

- 2 warning(s): `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C3-flood-history — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — PASS

- 2 warning(s): `factCheck` "London" (name) in description is not in the inputs; `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction-legacy — PASS

- 1 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £150,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction — FAIL

- FAIL `v2` social.X: no "For sale by Modern Method of Auction" line
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C6-voice-note-conflicts-and-private-leak — PASS

- 1 warning(s): `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately
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
