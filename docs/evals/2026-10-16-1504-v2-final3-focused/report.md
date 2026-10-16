# Prompt eval — v2-final3-focused

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `da649db30566`
- Git sha: `fe59707`
- Cases × runs: 8 × 1
- LLM grader: on
- Tokens: 105,247 in / 25,412 out
- Started: 2026-10-16T15:04:55.467Z
- Result: **7/8 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| C1-leasehold-missing-ground-rent | PASS | 0 | 4 | 6.9 | 23.8 | – | 0 | PASS 5.00 |
| C4-knotweed | PASS | 0 | 2 | 10.1 | 21.0 | – | 0 | PASS 5.00 |
| C5-modern-method-of-auction | PASS | 0 | 3 | 10.1 | 24.2 | – | 0 | PASS 5.00 |
| A7-lordswood-planning-conflict | FAIL | 1 | 1 | 10.9 | 24.6 | – | 0 | PASS 5.00 |
| A2-flat-over-shop-streatham-professional | PASS | 0 | 2 | 11.7 | 53.7 | – | 1 | PASS 5.00 |
| A3-1930s-semi-sevenoaks-premium | PASS | 0 | 4 | 12.2 | 24.9 | – | 0 | PASS 5.00 |
| A6-new-build-kings-hill-professional | PASS | 0 | 1 | 10.1 | 51.3 | – | 1 | PASS 5.00 |
| A6-new-build-kings-hill-professional-legacy | PASS | 0 | 2 | 9.8 | 63.3 | – | 1 | PASS 5.00 |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 1 | patterns: keyFeature /lean-to/ lacks /approv\|building reg\|planning/ | A7-lordswood-planning-conflict |

## Details

### C1-leasehold-missing-ground-rent — PASS

- 4 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £195,000"; `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £195,000"; `raw:banned` Banned phrase "benefits from" in emailBlast.body (fixed by the app before the agent sees it); `raw:banned` Banned phrase "benefits from" in social.Facebook (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — PASS

- 2 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £850,000"; `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £850,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction — PASS

- 3 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £150,000"; `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £150,000"; `raw:banned` Banned phrase "benefits from" in listing (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A7-lordswood-planning-conflict — FAIL

- FAIL `patterns` keyFeature /lean-to/ lacks /approv\|building reg\|planning/ — `Kitchen/diner 5.45m x 2.90m (17'11" x 9'6") and lean-to utility`
- 1 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £285,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A2-flat-over-shop-streatham-professional — PASS

- 2 warning(s): `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A3-1930s-semi-sevenoaks-premium — PASS

- 4 warning(s): `limits` Seller email list line 38 words (max 35); `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £975,000"; `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately; `raw:limits` Seller email list line 38 words (max 35)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional — PASS

- 1 warning(s): `raw:banned` Banned phrase "benefits from" in listing (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional-legacy — PASS

- 2 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Fixed Price £410,000"; `raw:banned` Banned phrase "benefits from" in listing (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
