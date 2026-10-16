# Release readiness — 16 Oct 2026

Status: **not published**. Brand, pricing, Stripe price ids, users and data unchanged.

## Changes
1. **Public example (index.tsx)** — LiveExample facts gain Council Tax Band G and EPC E; the "near the high street" note is gone. DEMO_UK is rewritten so it uses only the displayed facts (no rectory, drawing-room size, shaker kitchen, half-acre, "private", "generous" or layout claims). It is labelled "Fictional example" and stays within the generator limits (headline ≤70, teaser ≤250, bullets ≤80, X ≤280 incl. hashtags). The hero preview and transcript no longer invent "private/generous/family life".
2. **Edit promise** — Quill has no in-app editing, so the "each editable" / "fully editable" claims are removed. The copy now says each output has a copy button and agents check and edit after pasting. In-app edit/save is **not** built (deferred).
3. **Credit slot leak** — new `src/lib/quota-slot.ts` (`finalizeOrRelease`, `releaseSlot`). If finalize errors, returns false or throws, the slot is released before the saved row is removed. Release only deletes `reserved` rows, so a completed credit is never released twice or charged twice. RPC `{error}` results are checked, not only thrown errors. Tests: `src/lib/quota-slot.test.ts` (7 cases, including a partial error where data is true but an error is also returned).
4. **Generator lock** — `run()` now awaits `dictation.finishPending()` inside the try/finally. Opening a saved listing ignores stale responses and won't overwrite fields edited while it loads, or a generation already running.
5. **Claims** — "Priority generation" removed from Pro and Growth (it was never built). "All four brand voices" changed to "five", which is how many exist. Pricing notes state card required and renewal at the plan price unless cancelled, and that drafts need agent checking and seller approval. No accuracy guarantees, compliance certification or portal-integration claims were found.

## Test results
- `bun run test`: 11 files, **110/110 passed**.
- `bunx tsgo --noEmit`: no errors.
- `bun run prompts:check`: "Workbench files up to date (27 files)". No prompt files changed, so PROMPT_VERSION is unchanged.
- Playwright on `/` at 390px and 1280px: no sideways scrolling, no page errors, "Fictional example" present, "rectory" absent.

## Not tested
- Signed-in generation end to end (avoids live AI spend and credit use). Finalize-failure behaviour is covered by unit tests only.
- Stripe checkout and renewal (no live charges), emails, and deleting data.
- Full keyboard and screen-reader audit of every signed-in page. Spot review only.

## Launch blockers (owner decisions)
- **No Privacy Policy or Terms pages exist.** These need the trading entity name, address, ICO registration, data processors (AI provider, hosting, payments), retention and a lawful basis. None were invented.
- Confirm the legal entity and contact details for the footer and checkout.
- Decide whether to build in-app editing of generated copy (removed from claims for now).
- Open items from Prompt Lab: the source-of-truth floor/position rule, the stricter grader, and the v2-final3 eval run.
