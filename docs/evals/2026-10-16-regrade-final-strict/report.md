# Prompt eval — 2026-10-14-1502-v2-final-regraded-revalidated

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `74b47076ee3c`
- Git sha: `2afda15`
- Cases × runs: 2 × 1
- LLM grader: on
- Tokens: 33,056 in / 8,053 out
- Started: 2026-10-16T15:03:54.678Z
- Result: **0/2 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A2-flat-over-shop-streatham-professional | FAIL | 1 | 1 | 9.8 | 23.3 | – | 0 | FAIL 4.50 |
| A6-new-build-kings-hill-professional-legacy | FAIL | 1 | 2 | 20.1 | 57.2 | – | 2 | PASS 5.00 |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 1 | facts: listing: "…" — the facts never put any part of this Maisonette (first and second floors) above a commercial unit on that floor | A2-flat-over-shop-streatham-professional |
| 1 | banned: Banned phrase "…" in emailBlast.personalMessage | A6-new-build-kings-hill-professional-legacy |

## Details

### A2-flat-over-shop-streatham-professional — FAIL

- FAIL `facts` listing: "ground floor" — the facts never put any part of this Maisonette (first and second floors) above a commercial unit on that floor — `ground floor`
- 1 warning(s): `raw:limits` Email body doesn't end with the material-information line (fixed by the app before the agent sees it)
- LLM: FAIL (avg 4.50; 1:2 2:5 3:5 4:5 5:5 6:5 7:4 8:5)
  - UNSUPPORTED: The ground floor comprises the living room and a kitchen fitted in 2022
  - UNSUPPORTED: On the first floor are two bedrooms measuring 3.85m x 3.05m and 2.70m x 2.40m, and the bathroom
  - Portal description: Remove 'The ground floor comprises the living room and a kitchen fitted in 2022' and 'On the first floor are two bedrooms measuring 3.85m x 3.05m and 2.70m x 2.40m, and the bathroom' – the facts state the maisonette is on the first and second floors above a commercial unit, so the living room and kitchen cannot be on the ground floor. Replace with neutral wording that does not specify which floor each room is on, e.g. 'The accommodation comprises a bay-fronted living room measuring 4.90m x 4.10m into bay and a kitchen fitted in 2022 measuring 3.20m x 2.30m. There are two bedrooms measuring 3.85m x 3.05m and 2.70m x 2.40m, and a bathroom.'
  - Consider strengthening the lead in the portal description by opening with the section 42 lease extension benefit, which is the strongest selling point for a leasehold property with 89 years remaining.

### A6-new-build-kings-hill-professional-legacy — FAIL

- FAIL `banned` Banned phrase "book your viewing today" in emailBlast.personalMessage — `…ds flooring for reservations by 30 November 2026. Book your viewing today.…`
- 2 warning(s): `materialInfo` social.X: no price; `raw:banned` Banned phrase "book your viewing today" in emailBlast.personalMessage (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
