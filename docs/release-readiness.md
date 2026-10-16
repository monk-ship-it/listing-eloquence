# Release readiness — 16 Oct 2026 (round 2)

Status: **not published**. Brand, prices, Stripe price ids, accounts and data unchanged. No live charges, emails or deletions of existing data.

## Changes this round
- **Homepage example (index.tsx):** removed "New instruction" / "new to market" everywhere in DEMO_UK. The spoken note now says "exposed beams", matching the facts. The voices section shows all five voices (Plain & factual added), and each sample is labelled "Illustrative tone only". "Four voices" changed to five here and on /uk-property-listing-generator. "So nothing drifts between channels" replaced with "every channel starts from the same facts. Check each one before it goes live." The homepage now has a `<main>` landmark.
- **Credit reconciliation (src/lib/quota-slot.ts, listing.functions.ts):** after any finalize failure, the row is re-read before deciding.
  - `completed`: the commit happened but the response was lost. The listing is kept and the credit counts.
  - `missing`: released. The listing row is removed and the agent is told it didn't use a listing.
  - Read or release fails: `unresolved`. The credit state is **unknown**: finalize may have committed. The saved listing is **kept**. If the row is still `reserved`, it expires and is cleared by the next reservation. If it was in fact `completed`, that usage stays counted. Quill does not claim either way.
  - Comped accounts no longer lose a saved listing if the audit-row insert fails.
- **Stale saved-listing loads (_authenticated.app.tsx):** the effect cleanup cancels the request when you leave the page or open another listing (and allows a fresh load of the same id later). Late responses never overwrite edits or a generation in progress.
- **Security:** removed two unused, unauthenticated Opinly endpoints (`trackOpinlyPurchase`, `trackOpinlyEvent`) that let anyone post fake conversions. The admin check now calls `has_role` as the caller, not with the service role. All other server functions use `requireSupabaseAuth`. Generation, marketing, extraction and transcription all check subscription status on the server, and every query on saved listings is limited to the signed-in owner's own rows.
- **Eval harness:** `--revalidate` now runs the app's own post-processing (`finishCore` / `finishMarketing`, shared with generation.server.ts). An LLM-grader FAIL now fails the case. Grader rules were not loosened.

## Exact checks and results
- `bun run build` (production): exit 0.
- `bun run test`: 11 files, **115/115 passed**. This includes 12 credit tests: committed-but-response-lost, error/false/throw/partial without a commit, release fails, release throws, status read fails, and the confirming read fails.
- `bunx tsgo --noEmit`: clean. `bun run prompts:check`: up to date (27 files). No prompt text changed; PROMPT_VERSION is unchanged.
- ESLint: 117 errors, all already present before this round (formatting, `any` in the generated email registry, the intentional control-character regex). None were introduced here.
- **Regrade of v2-final2 with today's code** (`docs/evals/2026-10-14-1510-v2-final2-regraded`): **19/19**. The earlier 5 failures were all stale: the app now trims the preview and adds image labels and the sale-method line, and the A3, A6 ×2, C1 and C5 failures came from these steps.
- **Strict LLM regrade** (unsupported-claims grader): C4 (final2) FAIL 4.50. A2 (final) FAIL: "ground floor" invented for a first/second-floor maisonette. A6-legacy (final) FAIL: banned phrase in the personal message. All three known-bad packs are now caught.
- **Live focused run** `docs/evals/2026-10-16-1504-v2-final3-focused` (8 synthetic cases, LLM-graded): **7/8**. Retries 3/8. Core median ≈10.1s, max 12.2s. Marketing median ≈24.4s, max 63.3s (the slow ones are the retried runs).
  - Current failure, A7: key feature "Kitchen/diner 5.45m x 2.90m (17'11" x 9'6") and lean-to utility" lacks the planning/building-regs caveat.
- **Browser QA, signed in as the non-admin test account** at 390px and 1280px, on /, /auth, /app, /history, /account, /subscription and /uk-property-listing-generator: no sideways scrolling, no page or console errors, no unlabelled controls, one `<main>` and one `<h1>` per page. The saved-listings empty state renders. Signed-in /auth redirects to checkout because this account has no subscription.

## Round 3 — A7 lean-to caveat (fixed)
- New deterministic step `src/lib/feature-caveats.ts`, run in `labelCore` (app and eval revalidation).
  - **What triggers it:** a planning or disclosures sentence that says a structure (lean-to/lean to/leanto, conservatory/orangery/sunroom, extension, loft or garage conversion, outbuilding/annexe/garden room, porch, dormer) has no known or unknown approval.
  - **What it does:** every key feature naming that structure gets a caveat worded from that sentence only: "no known planning approval", "no known building regulations approval", or "no known planning or building regulations approval".
  - **Compound bullets** over 80 characters are split so the structure gets its own caveated bullet. When there are already 10 bullets, the structure is dropped from the bullet instead. The description and Material Information still disclose it.
  - **Prompt text is unchanged**, so there was no golden refresh and PROMPT_VERSION is unchanged.
- New grader `caveats` in `scripts/prompt-evals/graders.ts` FAILs any uncaveated bullet, including synonyms. The existing case pattern was kept, so no grader was weakened.
- Tests: `src/lib/feature-caveats.test.ts`, 8 cases (A7 compound bullet, short bullet, spelling variants, already caveated, planning-only wording, positive approval adds nothing, full list of 10).
- **Saved A7 output from the focused run, regraded:**
  - as saved: FAIL on both `patterns` and the new `caveats` (`docs/evals/2026-10-16-a7-regrade-asis`);
  - with today's post-processing: PASS (`docs/evals/2026-10-16-a7-regrade`).
- **Live A7 ×3** (`docs/evals/2026-10-16-1512-a7-caveat-live`): **3/3 PASS**, LLM 5.00 each, 0 retries. Core ≈10s, marketing ≈24–25s.
  - Bullets in the three runs: "Lean-to utility (no known planning or building regulations approval)" twice, and "Lean-to utility (seller unaware of planning or building regulations approval)" once.
- Final gates: `bunx tsgo --noEmit` clean; `bun run test` **12 files, 123/123 passed**; `bun run prompts:check` up to date (27 files); `bun run build` exit 0.

## Not tested
- Opening a saved listing in the browser (the test account has none; generating one would use AI and a credit on an account without access).
- Stripe checkout, renewal and webhooks live; transactional emails; deletion.
- A real finalize network failure against the database (covered by the in-memory model tests only).
- Screen-reader pass (automated label and landmark checks only).

## Remaining launch blockers
1. **Privacy Policy and Terms pages do not exist.** The owner must supply, verified:
   - legal entity name, company number and registered address;
   - a contact for data requests, and ICO registration number/fee status;
   - processors and where data is held: the AI writer (Anthropic), speech-to-text provider, hosting/database, Stripe, email sender, Opinly analytics;
   - retention periods for listings, voice transcripts (audio isn't stored), usage logs and account deletion;
   - lawful basis, cookie/analytics consent position, governing law, liability and refund terms.

   None of this was written or invented.
2. Footer and checkout legal identity must match item 1.

Not blockers: in-app editing (promises corrected); the pre-existing ESLint formatting debt.
