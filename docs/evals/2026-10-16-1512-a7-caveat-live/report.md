# Prompt eval — a7-caveat-live

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `da649db30566`
- Git sha: `fc9bca5`
- Cases × runs: 1 × 3
- LLM grader: on
- Tokens: 32,895 in / 8,276 out
- Started: 2026-10-16T15:12:31.333Z
- Result: **3/3 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A7-lordswood-planning-conflict #1 | PASS | 0 | 1 | 10.8 | 25.4 | – | 0 | PASS 5.00 |
| A7-lordswood-planning-conflict #2 | PASS | 0 | 1 | 10.6 | 24.4 | – | 0 | PASS 5.00 |
| A7-lordswood-planning-conflict #3 | PASS | 0 | 1 | 9.8 | 24.3 | – | 0 | PASS 5.00 |

## Details

### A7-lordswood-planning-conflict (run 1) — PASS

- 1 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £285,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A7-lordswood-planning-conflict (run 2) — PASS

- 1 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £285,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A7-lordswood-planning-conflict (run 3) — PASS

- 1 warning(s): `materialInfo` emailBlast.body: price stated in prose, not exact form "Guide Price £285,000"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
