# Prompt eval — 2026-10-16-a7-regrade-asis-regraded

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `da649db30566`
- Git sha: `fe59707`
- Cases × runs: 1 × 1
- LLM grader: on
- Tokens: 10,965 in / 2,714 out
- Started: 2026-10-16T15:16:26.556Z
- Result: **0/1 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A7-lordswood-planning-conflict | FAIL | 2 | 1 | 10.9 | 24.6 | – | 0 | PASS 5.00 |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 1 | patterns: keyFeature /lean-to/ lacks /approv\|building reg\|planning/ | A7-lordswood-planning-conflict |
| 1 | caveats: keyFeature names the lean-to without its supplied planning/building-regs caveat | A7-lordswood-planning-conflict |

## Details

### A7-lordswood-planning-conflict — FAIL

- FAIL `patterns` keyFeature /lean-to/ lacks /approv\|building reg\|planning/ — `Kitchen/diner 5.45m x 2.90m (17'11" x 9'6") and lean-to utility`
- FAIL `caveats` keyFeature names the lean-to without its supplied planning/building-regs caveat — `Kitchen/diner 5.45m x 2.90m (17'11" x 9'6") and lean-to utility`
- 1 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £285,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
