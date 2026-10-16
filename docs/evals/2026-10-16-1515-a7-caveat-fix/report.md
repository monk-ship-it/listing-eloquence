# Prompt eval — a7-caveat-fix

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `da649db30566`
- Git sha: `3458154`
- Cases × runs: 1 × 1
- LLM grader: on
- Tokens: 10,965 in / 2,677 out
- Started: 2026-10-16T15:15:58.983Z
- Result: **1/1 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A7-lordswood-planning-conflict | PASS | 0 | 2 | 10.2 | 23.0 | – | 0 | PASS 5.00 |

## Details

### A7-lordswood-planning-conflict — PASS

- 2 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £285,000"; `materialInfo` listing: final paragraph repeats 7 supply labels — the app adds the Material Information block separately
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
