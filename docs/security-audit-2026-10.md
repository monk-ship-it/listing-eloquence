# Quill application security review — 22 October 2026

Reviewed the local Node prototype and the actual Lovable project `13dc08a6-2803-4cbd-b9e9-4d1452afd64a`. These are different applications. The remote findings below describe source inspected before the coordinating agent's current hardening changes; they must be rechecked after those changes.

## Fixed in the local prototype

The static server previously exposed every file within the workspace. HTTP requests to `/.env`, `/server.js`, `/package.json` and `/.gitignore` returned 200 in an isolated local process. Credential values were never printed, read for this audit, or sent elsewhere. This establishes a local server defect; it does not establish that an external deployment leaked credentials.

`server.js` now serves only `/`, `/index.html`, `/styles.css` and `/script.js`. All other paths return 404. Browser assets carry `X-Content-Type-Options: nosniff`. Importing the server for a test no longer starts a listener.

`npm test`: **2/2 pass**, covering all public assets, query parameters, and 13 configuration/source/traversal paths. Tests use a loopback-only ephemeral port; they do not call AI or billing providers. Changed files: `server.js`, `package.json`, `test/static-files.test.js`.

The local prototype still has no authenticated user accounts, durable listing storage, subscription enforcement or billing integration. Its generation handler lacks input/output schema validation, provider timeout and rate limits. These were not expanded because the user-provided Lovable project already contains the real implementation.

## Remote findings requiring correction

### P1 — ordinary users can enqueue branded email to arbitrary recipients

- `src/routes/lovable/email/transactional/send.ts:56` verifies a valid Supabase user, but imposes no role, trusted-service or subscription-event authorization.
- Lines 71–75 accept caller-selected `recipientEmail` and `templateData`; line 101 uses that recipient; lines 255–270 enqueue the email using the service-role client.
- The registered `subscription-cancelled` template has no fixed recipient and renders its caller-controlled `resubscribeUrl` directly as a link in `src/lib/email-templates/subscription-cancelled.tsx:80`.

An ordinary signed-in user can therefore request cancellation mail from Quill's sender to an unrelated address, with an arbitrary reactivation link. No live exploit, email send or enqueue request was performed.

**Correction:** disable this unused public sender, or require a trusted server-only caller and derive recipient, cancellation state and template data from an authorized billing event. Allowlist reactivation URLs to the application's approved origins. Do not treat user authentication alone as authorization to send branded transactional mail.

**Regression cases:** unauthenticated and ordinary authenticated callers cannot enqueue; spoofed recipient/template fields cannot alter a trusted event's recipient or date; foreign origins and unsafe URL schemes are rejected; a valid trusted event creates at most one message across retries; authorization failures touch neither queue nor suppression/token tables.

### P1 — auxiliary AI quotas are bypassable under concurrency and tracking failures

- `src/lib/extract.functions.ts:31–40`: reads the successful-run count, invokes the provider, then inserts usage at lines 63–66. Limit: 40/day.
- `src/lib/listing.functions.ts:211–220`: marketing regeneration follows the same count-then-call pattern; lines 273–276 log and ignore usage-insert failures. Limit: 30/day.
- `src/lib/transcribe.functions.ts:43–56`: reads rolling usage, checks calls and bytes, calls the provider, then inserts usage at lines 142–145. Limits: 200 calls and 40 MB per rolling 24 hours.

Parallel requests can all observe the same remaining allowance before any inserts. A successful provider call remains uncounted if its usage insert fails. Failed provider attempts also do not consume a separate abuse/spend budget. Subscription checks exist, but do not prevent a subscribed client bypassing these cost controls.

**Correction:** reserve each call and its byte budget atomically before external work, using server-derived user identity and service-role-only database functions. Include outstanding reservations when checking limits; make retries/idempotency and reservation expiry explicit. Settle success/failure without silently making consumed provider work free. If the product retains successful-only feature allowances, enforce a separate bounded attempt/concurrency budget as well.

**Regression cases:** simultaneous requests for the final allowance produce exactly one reservation; transcription calls jointly exceeding the byte budget cannot both proceed; reservation database failure invokes no provider; settlement failure remains charged/reserved and reconcilable; duplicates reuse an idempotency key; expired reservations recover safely; users cannot execute privileged quota functions or reserve for other users; feature allowance and provider-attempt budget have defined failure semantics.

### P2 — transcription has no application timeout or bounded streaming response

`src/lib/transcribe.functions.ts:89` invokes the transcription provider without an abort signal. The SSE reader loop has no overall deadline or maximum accumulated text. Upload size is bounded, but a stalled or oversized provider response is not.

**Correction:** add an overall request/stream deadline, cancellation and an accumulated-byte/text ceiling. Ensure the reader/timer is cleaned up on every exit and integrate timeout outcomes with the reservation policy.

**Regression cases:** timeout before headers, timeout after one SSE chunk, never-ending stream, excessive response size, upstream error, malformed frames and cancellation all terminate predictably without leaking a reservation or exposing provider error bodies.

## Verified source safeguards

- Authenticated server functions use `requireSupabaseAuth`, which verifies Bearer JWT claims and derives the user ID from the verified subject.
- Saved listing read/update/delete paths include the signed-in owner's ID. MCP listing tools also authenticate and scope results to the caller.
- Admin operations use the caller's `has_role` result; server keys live behind server-only modules.
- Main listing generation uses atomic service-role quota reservations and reconciles uncertain finalization outcomes. Migrations explicitly remove old customer-callable quota signatures.
- The audited table migrations enable RLS; privileged queue/billing/quota functions revoke ordinary customer execution.
- Claude calls already have a timeout, forced tool schema, bounded retries and friendly error codes. This is distinct from the transcription gap above.

## Release checks still required

`docs/release-readiness.md` records 164 passing tests and earlier synthetic AI evaluations on 17 October. Those are historical evidence, not tests executed by this audit. Current hardening must run its own regression suite and preview gate.

The release document also records missing owner-approved Privacy/Terms/legal identity/address decisions; unverified hosted auth redirect/confirmation/reset settings; and incomplete test-environment billing and listing-save-history-copy journeys. These cannot be declared complete from source review alone.

`src/routes/__root.tsx:109` loads Opinly's external script globally, including private routes. Its processing/consent position must be resolved in the privacy work; this audit did not inspect the vendor script or infer a legal breach.

Suggested final verification: isolated billing lifecycle with webhook retry/order/identity tests; authenticated cross-user denial tests; synthetic listing generation → persisted pack → history → copy; sign-out/account-switch cache isolation; mobile and keyboard pass; approved legal links; production preview health/error handling. No production charge, new generation, email, deletion, database mutation or deployment was performed by this reviewer.
