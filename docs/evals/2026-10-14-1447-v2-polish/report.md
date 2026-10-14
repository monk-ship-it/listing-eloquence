# Prompt eval — v2-polish

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `e47cc44cd5af`
- Git sha: `3a8288c`
- Cases × runs: 11 × 1
- LLM grader: on
- Tokens: 147,321 in / 33,528 out
- Started: 2026-10-14T14:47:21.961Z
- Result: **6/11 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| C1-leasehold-missing-ground-rent | FAIL | 1 | 1 | 8.3 | 17.9 | – | 0 | PASS 5.00 |
| C5-modern-method-of-auction-legacy | PASS | 0 | 0 | 7.8 | 45.0 | – | 1 | PASS 5.00 |
| C6-voice-note-conflicts-and-private-leak | PASS | 0 | 0 | 9.7 | 18.3 | – | 0 | PASS 4.75 |
| A1-ex-la-terrace-medway-plain | PASS | 0 | 0 | 11.5 | 25.4 | – | 0 | PASS 5.00 |
| A7-lordswood-planning-conflict | FAIL | 2 | 1 | 11.7 | 30.4 | – | 0 | PASS 5.00 |
| A2-flat-over-shop-streatham-professional | PASS | 0 | 5 | 10.4 | 21.6 | – | 0 | PASS 5.00 |
| A3-1930s-semi-sevenoaks-premium | PASS | 0 | 0 | 16.0 | 41.8 | – | 1 | PASS 5.00 |
| A4-country-house-frant-luxury | PASS | 0 | 0 | 11.9 | 21.9 | – | 0 | PASS 5.00 |
| A5-victorian-cottage-smarden-heritage | FAIL | 2 | 1 | 11.8 | 21.7 | – | 0 | PASS 5.00 |
| A6-new-build-kings-hill-professional | FAIL | 2 | 2 | 20.2 | 45.0 | – | 2 | FAIL 3.75 |
| A6-new-build-kings-hill-professional-legacy | FAIL | 3 | 2 | 21.8 | 45.3 | – | 2 | PASS 5.00 |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 2 | limits: X post N > N chars incl. hashtags | A6-new-build-kings-hill-professional, A6-new-build-kings-hill-professional-legacy |
| 1 | v2: personalMessage N words (need N–N) | C1-leasehold-missing-ground-rent |
| 1 | limits: Seller email N words (need N–N) | A7-lordswood-planning-conflict |
| 1 | raw:limits: Seller email N words (need N–N) | A7-lordswood-planning-conflict |
| 1 | raw:limits: Email Blast missing | A5-victorian-cottage-smarden-heritage |
| 1 | raw:limits: N social posts (need N) | A5-victorian-cottage-smarden-heritage |
| 1 | materialInfo: emailBlast.body: missing "…" | A6-new-build-kings-hill-professional |
| 1 | limits: Preview text N > N chars | A6-new-build-kings-hill-professional-legacy |
| 1 | raw:limits: Preview text N > N chars | A6-new-build-kings-hill-professional-legacy |

## Details

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `v2` personalMessage 39 words (need 40–80)
- 1 warning(s): `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction-legacy — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C6-voice-note-conflicts-and-private-leak — PASS

- LLM: PASS (avg 4.75; 1:4 2:5 3:5 4:5 5:5 6:5 7:4 8:5)
  - Voice notes mention 'five-bed' and 'three acres' but structured FACTS show 4 bedrooms and 2.1 acres - copy correctly uses structured data (4 bed, 2.1 acres) throughout, no fix needed but verify bedroom count is definitely 4
  - Voice notes mention 'EPC C now the windows are done' but structured FACTS show EPC D - copy correctly uses D throughout, confirm current certificate rating
  - Voice notes mention 'guide one point three million' but structured FACTS show £1,250,000 - copy correctly uses £1.25m, confirm asking price
  - Portal description 'The kitchen opens to family space' is vague filler - consider more concrete detail or remove if not verifiable
  - Portal description 'An indoor swimming pool is housed separately' - verify location/structure detail is factual

### A1-ex-la-terrace-medway-plain — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A7-lordswood-planning-conflict — FAIL

- FAIL `limits` Seller email 337 words (need 150–300)
- FAIL `raw:limits` Seller email 337 words (need 150–300)
- 1 warning(s): `raw:limits` Email body doesn't end with the material-information line
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A2-flat-over-shop-streatham-professional — PASS

- 5 warning(s): `materialInfo` listing: lease years not in the same paragraph as the tenure; `materialInfo` listing: ground rent not in the same paragraph as the tenure; `materialInfo` listing: service charge not in the same paragraph as the tenure; `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A3-1930s-semi-sevenoaks-premium — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A5-victorian-cottage-smarden-heritage — FAIL

- FAIL `raw:limits` Email Blast missing
- FAIL `raw:limits` 0 social posts (need 3)
- 1 warning(s): `factCheck` "I've" (name) in seller email is not in the inputs
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional — FAIL

- FAIL `limits` X post 327 > 280 chars incl. hashtags — `New: 3-bed semi, Plot 47 Orchard Rise, Kings Hill. From £410,000, freehold. Completion spring 2027. Air source heat pump, EV charging, 2 spaces, NHBC warranty. Predicted EPC B. Estate charge £295 pa. #KingsHill #Kent  Im`
- FAIL `materialInfo` emailBlast.body: missing "Fixed Price £410,000"
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: FAIL (avg 3.75; 1:4 2:4 3:3 4:4 5:3 6:5 7:4 8:3)
  - Change all instances of 'From £410,000' to 'Fixed Price £410,000' (appears in email subject lines, email body, seller approval email, and all social posts)
  - Remove 'Only three Larches left, push that, get them in' pressure language from voice notes - this has not appeared in outputs but confirms compliance awareness
  - Seller approval email question 1: change 'From £410,000' to 'Fixed Price £410,000'
  - Email subject lines: replace 'From £410,000' with 'Fixed Price £410,000' in all three subject lines
  - Instagram post: change 'From £410,000' to 'Fixed Price £410,000'
  - Facebook post: change 'From £410,000' to 'Fixed Price £410,000'
  - X/Twitter post: change 'From £410,000' to 'Fixed Price £410,000'

### A6-new-build-kings-hill-professional-legacy — FAIL

- FAIL `limits` Preview text 94 > 90 chars — `Freehold · No onward chain · EPC B · Completion spring 2027 · EV charging · Two parking spaces`
- FAIL `limits` X post 340 > 280 chars incl. hashtags — `Plot 47, Orchard Rise, Kings Hill, West Malling – Fixed Price £410,000, freehold, EPC B. New-build 3-bed semi, completion spring 2027. Air source heat pump, EV charging, 2 parking spaces. Full material information on the`
- FAIL `raw:limits` Preview text 94 > 90 chars — `Freehold · No onward chain · EPC B · Completion spring 2027 · EV charging · Two parking spaces`
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
