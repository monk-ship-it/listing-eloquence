# Release readiness — 17 Oct 2026 (release audit)

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

## Round 4 — feature-caveats correctness fix (independent review)
- **Bugs fixed in `src/lib/feature-caveats.ts`:**
  - A negative word anywhere in the sentence triggered a caveat. Now a negative must sit in the same clause as the approval it governs (clauses split on commas, semicolons, "but/however/whereas", and "and" unless it joins planning/building regs). "Extension has planning approval and no known issues" adds nothing.
  - Generic "no approval" was turned into building regulations. It now stays generic: "no known approval".
  - Any word like "planning" in a bullet counted as a caveat. Now the bullet must state the same negative substance as the fact. "(planning approved)" or a regs-only caveat where both are required is replaced with the correct one.
  - A bullet naming two caveated structures counted as caveated after one caveat. Now a bullet is only accepted if it names exactly one structure; compound bullets are split so each structure gets its own correct caveat, or dropped from the bullets when it can't fit.
  - When the negative can't be tied to one structure (e.g. two structures in the sentence, "approval unknown" naming neither), no legal wording is added: the structure is removed from the bullets and returned by `caveatsForReview()`; the grader FAILs any such bullet. Material Information keeps the verbatim disclosures.
- Tests: `feature-caveats.test.ts` now 15 cases (added: positive approval + no known issues, generic approval stays generic, planning granted/regs unknown, wrong positive output caveat, regs-only vs both, multiple structures, ambiguous → review).
- Results: `bun run test` **12 files, 130/130 passed**; `bun run build` exit 0; `bunx tsgo --noEmit` clean; `bun run prompts:check` up to date (27 files). Prompt text unchanged; PROMPT_VERSION `da649db30566` unchanged.
- Live A7 ×1 (`docs/evals/2026-10-16-1515-a7-caveat-fix`): **PASS**, LLM 5.00, 0 retries, core 10.2s, marketing 23.0s; bullet "Lean-to utility (no known planning or building regulations approval)". Saved as-is A7 failure still FAILs on regrade (grader not weakened).

## Round 5 — account and distribution safeguards (17 Oct)

### Exact changes
- `src/lib/auth-state.ts`, `src/routes/auth.tsx`: reject unsafe redirect paths; trim email input; confirmation returns to the public sign-in page with the selected plan preserved. Confirmation is still required. Email/password provider was read/enabled idempotently: already enabled; no confirmation settings changed.
- `src/routes/reset-password.tsx`: ordinary signed-in sessions no longer enable password reset. A recovery link/event and authenticated user are required; invalid-link submit is disabled.
- `src/routes/_authenticated.tsx`, `src/routes/__root.tsx`: client-only pre-render identity check; sign-out cancels/clears private query caches and replaces navigation history. Root sign-out also clears private cached data.
- `src/lib/billing-state.ts`, `src/lib/subscription.functions.ts`: cancellation remains available for an existing non-ended subscription even if generation is blocked; period-end date supports both Stripe formats; cancellation/resume returns Stripe's accepted state even if the local sync fails. Billing return URLs are allowlisted. Checkout refuses a second subscription while one is still open; checkout activation requires ownership. Subscription-read failures no longer look like no subscription.
- `src/routes/_authenticated.subscription.tsx`, `src/routes/_authenticated.account.tsx`: billing/payment-failure cancellation path, load-error retry, explicit paid-access end date and card-required trial. Cancelled plans now say **Access ended**, not **Next billing date**. Paused subscribers are directed to their existing billing rather than a fresh trial.
- `src/components/pack/ListingPack.tsx`, `src/lib/clipboard.ts`: seller approval copy includes the supplied Material Information; full-pack copy now includes the same draft particulars inside the approval email. No emails are sent by these controls.
- `src/routes/_authenticated.history.tsx`: stops the misleading endless Load more at the server's existing 2,000-row limit. This preserves existing data; it is not full pagination beyond that limit.
- `src/routes/_authenticated.app.tsx`, `src/routes/_authenticated.admin.tsx`, account/subscription/history/auth/reset: leaf page metadata completed. `src/lib/seo.ts` no longer emits a nonexistent default social image. `src/routes/uk-property-listing-generator.tsx`: FAQ now includes all five voices and the seller approval email; claims are framed as instructions, not accuracy guarantees.
- `src/lib/release-rules.test.ts`: seven tests covering cancellation during payment problems, exact period-end-only Stripe request (mocked), both date formats, safe billing URLs, safe auth redirects, recovery-link requirement, and disclosure inclusion in seller/full-pack copy.
- `AGENTS.md`: records auth/cache, shared billing-state and social-image conventions. `roadmap.md`: release audit checklist. No prompt text or golden fixtures changed.

### Checks actually executed
- `bun run test`: **13 files, 137/137 passed** (final run 17 Oct 11:55 UTC). Earlier new-suite import failure was corrected; final suite is green.
- `bun run prompts:check`: **27 files up to date**. No prompt export/golden refresh needed: none of the prompt-bearing files changed.
- Automatic preview build: **build OK**, newest observed entry 17 Oct 11:54:30 UTC. A separate production `bun run build` was **not executed in this round**; sandbox instructions prohibit manual builds/typechecks. Prior round production results above are historical, not a new production verification.
- Real signed-out `/app` redirects to `/auth`; real invalid email/password login shows its error and unlocks submit. No signup or reset email sent.
- Existing non-admin account: `/app`, `/history`, `/account`, `/subscription`, `/reset-password`, `/` checked at **1280×1800 and 390×844**. No horizontal overflow or browser page errors. Screenshot inspection confirmed mobile generator/subscription and disabled reset submit. History reads **No saved listings yet**.
- Signed-in ordinary session cannot use reset submit; sign-out then revisit `/history` redirects to `/auth` without protected content. Loaded the synthetic example into 17 non-empty form inputs. A nonexistent UUID produces a recoverable saved-listing error.
- Clipboard: real Clipboard API copy and readback succeeded for synthetic text. Forced API denial exercised the fallback using a mocked `execCommand`; this is not a real iOS Safari check. Seller particulars/disclosures are covered by the regression test, not a saved-pack browser test.
- Read-only Stripe checks: all three configured prices active, GBP monthly **£39/£79/£149**; default active customer portal permits cancellation **at period end**, no proration; subscription/checkout webhook endpoint enabled. No checkout session, charge, cancellation, resumption or other live subscription change was made.

### Current verification limits
- The tested account has no active access and no saved packs. **New listing → persisted pack → history → copy was not end-to-end verified**; no entitlement bypass or live-account change was made. Existing unit tests and prior synthetic AI evaluations are not a substitute for this flow.
- Actual signup/confirmation/reset delivery and successful recovery-link password update remain untested; no live emails or passwords were changed. Hosted redirect allowlist, password rules and public-signup settings were not read successfully, so remain unverified.
- Live checkout completion, renewal/webhook delivery and cancellation/resumption were intentionally not exercised. Read-only Stripe configuration and mocked requests establish configuration/request semantics only.
- No download control currently exists; copying is the established export flow. No download feature was added. Real Safari fallback, screen-reader pass and >2,000-record browsing remain unverified.
- No deletion, live billing mutation, AI generation or publishing occurred this round. Brand, pricing, billing IDs, existing subscribers and saved records were preserved.

## Historical round 4 limits (still relevant where noted above)
- Opening a saved listing in the browser (the test account has none; generating one would use AI and a credit on an account without access).
- Stripe checkout, renewal and webhooks live; transactional emails; deletion.
- A real finalize network failure against the database (covered by the in-memory model tests only).
- Screen-reader pass (automated label and landmark checks only).

## Round 6 — urgent independent security/correctness findings (17 Oct)

### Changes
- Complimentary entitlement now uses the verified existing owner's immutable account ID from authenticated context, never subscriber/billing email. The owner ID was verified against the confirmed identity before changing the rule; checkout billing email cannot grant access or overwrite the identity email.
- Verified Stripe webhooks delegate to a tested processor. Returned database read/write errors propagate to HTTP 500 for retry. Events read current Stripe subscription state, not stale invoice snapshots. Only checkout can attach a new subscription; subscription/customer/email fallback cannot attach old subscriptions. The atomic PostgreSQL function locks the subscriber, rejects older same-subscription events and rejects superseded subscription identities. Existing records are preserved.
- Checkout rejects open subscriptions (including past_due/unpaid), checks customer subscription history and fails closed on an incomplete history read. Durable per-user checkout attempts keep an identical idempotency key, trial parameter and explicit expiry across retries. Eligibility is consumed conservatively when an eligible attempt is reserved; a lost response or expired abandoned attempt cannot grant a second trial. Historical subscriptions/trials preclude another trial. Competing plans cannot open concurrent attempts. Failed recording of a prepared session gives a retry-same-plan message, not a claim that nothing happened.
- Billing management remains independent of generation access. Removed false grace-period text and corrected repeat-trial promises: only eligible first-time customers receive a trial; checkout confirms it. Ended subscribers retain invoice/payment management. Portal return URLs use the existing allowlist. Cancellation/resume returns Stripe's accepted state even if local persistence fails, with writes constrained to the same subscription identity; reconciliation also cannot overwrite a replacement subscription ID.
- Fact/privacy checks now cover personal message, CTA, seller-email subject and social hashtags as well as the existing outputs. Bedroom/bathroom counts are checked by type, not pooled numbers. Unsupported room-to-floor attribution is flagged. Seller approval cannot remove draft status while fact/privacy flags or must-fix/conflicting Material Information remain unresolved.
- Supplied "capped at £500" ground-rent wording is retained with a verification conflict flag, not silently deleted. Ground-rent review information and shared-ownership full market value are checked; Part C "Yes" without details is incomplete. Material Information remains visible.

### Exact changed-file inventory
- Billing/security: `src/lib/comped.server.ts`, `subscription.functions.ts`, `stripe.server.ts`, `billing-sync.server.ts`, new `billing-webhook.server.ts`, `listing.functions.ts`, `extract.functions.ts`, `transcribe.functions.ts`, `src/routes/api/public/stripe-webhook.ts`, `src/routes/_authenticated.subscription.tsx`.
- Output safeguards: `src/lib/fact-check.ts`, `material-info.ts`, new `pack-safety.ts`, `src/components/pack/ListingPack.tsx`.
- Regression tests: new `src/lib/billing-security.test.ts`, `billing-database.test.ts`, `pack-safety.test.ts`; updated `fact-check.test.ts`, `material-info.test.ts`.
- Applied additive migrations: `drizzle/migrations/0003_billing_event_and_checkout_guards.sql`, `0004_checkout_attempt_trial_parameters.sql` and managed migration metadata/generated types. No live subscription mutation was performed.
- Test-only dependency: `@electric-sql/pglite` in `package.json`/lockfile; actual migration SQL is exercised against an isolated synthetic PostgreSQL database, never production rows.
- Architecture/evidence: `AGENTS.md`, `roadmap.md`, this document.

### Checks actually executed
- Final `bun run prompts:export` → **0 files changed, 27 total**; `bun run test` → **16 files, 159/159 PASS** (17 Oct, 12:03 UTC); `bun run prompts:check` → **27 up to date**. No prompt text changed; no golden refresh or prompt-version bump.
- Billing processor/request regressions: 8 tests, including billing email attack, returned read/write errors, old subscription metadata ignored, current Stripe state, provider failure, idempotency and no repeated trial parameter.
- Actual migration PostgreSQL regressions: 5 tests, including identical trial reservation after response loss, expired-attempt repeat eligibility, older event rejection, superseded checkout rejection, newer checkout only after ending, and denial of privileged functions to authenticated customers. Synthetic database only.
- Material Information: 21 tests; fact checking: 16 tests; persistent safety draft: 4 tests. Existing cancellation, URL allowlist, request semantics and quota-reconciliation suites also remain green.
- Latest automatic preview build observed **build OK, 17 Oct 12:03:06 UTC**. A separate production build/typecheck was **not manually run**, as sandbox instructions prohibit it; earlier production results are historical, not this round's evidence.
- Real requesting-user session (ended Starter subscription): `/subscription`, `/history`, `/app` loaded at **1280×1800 and 390×844**, one main landmark each, no horizontal overflow or browser page errors. Ended account retains **Manage billing & invoices**. Mobile screenshot inspected. Signed-out subscription redirects to auth. Real synthetic clipboard copy/readback succeeds. No checkout/cancel/resume/portal mutation controls were clicked.
- Initial browser assertions wrongly assumed this account had no subscription/empty history; inspection established an ended subscription and saved history, and the final script was corrected and passed. No private listing content was logged.

### Verification limits and remaining blockers
- No actual charge, checkout completion, live cancellation/resumption, webhook mutation, email, new generation, deletion or publish. Payment-problem UI behavior is source/regression verified, not a live past_due customer journey. Cancellation after Stripe-success/local-save-failure is implemented truthfully but not fault-injected in a live account.
- Current identity has no generation access: new listing → save → history → copy remains unverified end-to-end. Existing history loads; records were not changed.
- External test-environment billing lifecycle, hosted confirmation/reset delivery/redirect/password settings and verified owner Privacy/Terms/legal identity decisions below remain required. No legal identity/address or guaranteed-compliance claim was invented.

## Remaining launch blockers
1. **Privacy Policy and Terms pages do not exist.** The owner must supply, verified:
   - legal entity name, company number and registered address;
   - whether domenico@copybymonk.com is also the data-request contact, and ICO registration number/fee status;
   - processors and where data is held: the AI writer (Anthropic), speech-to-text provider, hosting/database, Stripe, email sender, Opinly analytics;
   - retention periods for listings, voice transcripts (audio isn't stored), usage logs and account deletion;
   - lawful basis, cookie/analytics consent position, governing law, liability and refund terms.

   Operator **CopyByMonk** and support **domenico@copybymonk.com** are confirmed. They do not establish legal entity details, company number or registered address. None of the missing legal terms was invented.
2. Footer and checkout legal identity must match item 1.

3. **External verification before distribution:** confirm hosted auth redirect URLs for both custom domains, confirmation/reset delivery and password rules; safely validate successful checkout/webhook and cancellation in a test environment, then the complete listing/save/history/copy journey with permitted access. Read-only checks above found no current Stripe-price/portal configuration defect.

Not blockers: in-app editing (promises corrected); the pre-existing ESLint formatting debt. Not published.
