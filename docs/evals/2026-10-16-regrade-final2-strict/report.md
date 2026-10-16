# Prompt eval — 2026-10-14-1510-v2-final2-regraded-revalidated

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `cc364453c3ba`
- Git sha: `a4cce70`
- Cases × runs: 5 × 1
- LLM grader: on
- Tokens: 94,837 in / 21,681 out
- Started: 2026-10-16T15:03:37.248Z
- Result: **5/5 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A3-1930s-semi-sevenoaks-premium | PASS | 0 | 2 | 11.5 | 52.3 | – | 1 | PASS 5.00 |
| A6-new-build-kings-hill-professional | PASS | 0 | 0 | 26.3 | 50.4 | – | 2 | PASS 5.00 |
| C1-leasehold-missing-ground-rent | PASS | 0 | 3 | 19.2 | 39.3 | – | 2 | PASS 5.00 |
| C4-knotweed | PASS | 0 | 2 | 20.6 | 40.1 | – | 2 | FAIL 4.50 |
| C5-modern-method-of-auction | PASS | 0 | 0 | 9.1 | 46.5 | – | 1 | PASS 5.00 |

## Details

### A3-1930s-semi-sevenoaks-premium — PASS

- 2 warning(s): `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately; `raw:limits` Preview text 98 > 90 chars (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C1-leasehold-missing-ground-rent — PASS

- 3 warning(s): `materialInfo` listing: price stated in prose, not exact form "Guide Price £195,000"; `raw:banned` Banned phrase "benefits from" in emailBlast.body (fixed by the app before the agent sees it); `raw:banned` Banned phrase "benefits from" in social.Facebook (fixed by the app before the agent sees it)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — PASS

- 2 warning(s): `factCheck` "London" (name) in description is not in the inputs; `materialInfo` listing: final paragraph repeats 8 supply labels — the app adds the Material Information block separately
- LLM: FAIL (avg 4.50; 1:2 2:5 3:5 4:5 5:5 6:5 7:4 8:5)
  - UNSUPPORTED: The principal bedroom occupies the front of the house
  - UNSUPPORTED: Sevenoaks town centre lies within reach, with shops, restaurants and the railway station offering services to London
  - UNSUPPORTED: The property is situated in a residential area
  - Remove 'The principal bedroom occupies the front of the house' from the portal description – no facts support which bedroom is where or which is principal
  - Remove 'Sevenoaks town centre lies within reach, with shops, restaurants and the railway station offering services to London' – no facts about amenities, transport or distance to town centre supplied
  - Remove 'The property is situated in a residential area' – neighbourhood character not supplied in facts

### C5-modern-method-of-auction — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
