
# Deployment Readiness Diagnostic — Quill (production)

Read-only audit. No code changes proposed; nothing is critically broken.

## Environment variables (server runtime)

| Variable | Status | Notes / Action |
|---|---|---|
| `STRIPE_SECRET_KEY` | PASS (present) | Confirm it is a **live** `sk_live_…` key in prod, not test. |
| `STRIPE_WEBHOOK_SECRET` | PASS (present) | Must match the live webhook endpoint's signing secret. |
| `APP_URL` | PASS (present) | Code defaults to `https://copybymonk.com` if unset — verify the configured value matches the canonical prod domain (no trailing slash, https). |
| `SUPABASE_URL` | PASS (present) | — |
| `SUPABASE_SERVICE_ROLE_KEY` | PASS (present) | Server-only; never referenced from client code. |
| `SUPABASE_PUBLISHABLE_KEY` | PASS (present) | Used server-side. |
| `LOVABLE_API_KEY`, `ANTHROPIC_API_KEY` | PASS (present) | AI generation dependencies. |
| Legacy `STRIPE_STARTER/GROWTH/PRO_PRICE_ID` + `_PAYMENT_LINK_ID` | WARN | Not read by current checkout code (price IDs are hardcoded in `src/lib/config.ts`). Safe to leave, but consider deleting to avoid confusion. |

## Public / Vite env vars (client bundle)

| Variable | Status | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | PASS | Present in `.env`. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | PASS | Publishable key — safe client-side. |
| `VITE_SUPABASE_PROJECT_ID` | PASS | — |
| Any `VITE_STRIPE_*` | N/A (PASS) | None required; checkout is fully server-side. |

## App-side production config

| Check | Status | Detail |
|---|---|---|
| Checkout `success_url` / `cancel_url` use prod URL, not localhost | PASS | `subscription.functions.ts` allow-lists `APP_URL`, `copybymonk.com`, `www.copybymonk.com`, `listing-eloquence.lovable.app`; unknown origins fall back to `APP_URL`. No localhost fallback in prod path. |
| Stripe webhook route | PASS | `POST /api/public/stripe-webhook` — this is the URL to register in Stripe Dashboard (prod + preview stable URLs both available). |
| Signature verification + raw body + timing-safe compare | PASS | Present in `stripe-webhook.ts`. |
| Billing Portal route uses logged-in user's Stripe customer ID | PASS | `createBillingPortalUrl` in `subscription.functions.ts` is auth-gated (`requireSupabaseAuth`) and looks up the caller's `stripe_customer_id` from `subscribers` before calling Stripe. |
| Checkout uses live Quill price IDs only | PASS | `PLAN_PRICING` in `src/lib/config.ts` maps plan × market → single authoritative price ID. No legacy £24.99/£29.99/£49.99 references. |
| Checkout uses `mode: 'subscription'` | PASS | Confirmed in `stripe.server.ts`. |
| Stripe secret key exposed to client | PASS | Only referenced in `*.server.ts` and server function handlers; not in any `VITE_*` var or client import. |
| Subscription gating (`active`/`trialing` only) | PASS | Enforced server-side in `hasActiveAccess` and `generateListing`. |

## Manual actions still required in Stripe Dashboard (not code)

1. **Live mode toggle** — confirm `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in prod env are the **live** values, not test.
2. **Webhook endpoint registered** at `https://copybymonk.com/api/public/stripe-webhook` (or the custom domain in use) subscribing to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
3. **Billing Portal enabled** in Stripe Dashboard → Settings → Billing → Customer portal, with cancel-at-period-end permitted.
4. **Deactivate legacy products/prices** (£24.99 / £29.99 / £49.99 and any legacy payment links) so they cannot be purchased.
5. **Confirm live price IDs are active** for all six SKUs (Starter/Pro/Growth × GBP/USD) referenced in `src/lib/config.ts`.
6. Optional: remove unused `STRIPE_*_PRICE_ID` / `STRIPE_*_PAYMENT_LINK_ID` secrets from Project Settings to reduce noise.

## Overall

No FAIL items. One WARN: obsolete legacy Stripe env vars are still stored but not referenced — cosmetic. Ready to sell once the six Stripe Dashboard items above are verified.
