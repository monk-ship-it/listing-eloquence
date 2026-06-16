# Quill — UK Estate Agent Listing Generator

An attractive, subscription-gated web app that turns property details into polished UK property listings in four distinct brand voices, plus social media captions with hashtags. Access requires sign-up; the app is gated behind a Stripe 14-day free trial + £24.99/month subscription, with a self-service cancel button.

## Branding
- Use the uploaded quill/play logo as the app logo (header, auth page, favicon).
- Dark, premium aesthetic echoing the logo: deep navy background, sky-blue accent, clean serif display font for headings + refined sans for body. Avoid generic AI look.

## Core research baked into the form (UK listing + Material Information)
The input form collects the fields UK agents and Trading Standards "Material Information" guidance expect, so the AI has real substance to work with:
- Address / location & area highlights
- Property type (detached, semi, terrace, flat, bungalow, cottage, etc.)
- Tenure (freehold / leasehold / share of freehold) + lease years if leasehold
- Asking price & price qualifier (Guide Price, OIEO, etc.)
- Bedrooms, bathrooms, reception rooms
- Key features (free text / chips)
- Room dimensions (optional)
- EPC rating, Council Tax band
- Garden / outside space, parking / garage
- Heating, broadband/utilities notes
- Nearby: schools, transport links, amenities
- Period / character features (for Heritage voice)
- Target audience (families, professionals, investors, downsizers)

## The four voices (tone presets)
Each is a carefully engineered system prompt:
- **Professional** — Refined, confident, lifestyle-aware. Everyday high-street voice; reads like a senior negotiator.
- **Premium** — Restrained, understated, considered. Upper-market, lifestyle-led, careful rhythm.
- **Luxury** — Warm, cinematic, story-led. Prime/country homes; quiet authority, no overblown adjectives.
- **Heritage** — Guided walk-through with atmosphere, period detail and local charm; premium but never overblown.

## Outputs
For each generation the app produces:
1. A full portal-ready listing (headline + body, structured paragraphs).
2. A short summary / teaser.
3. **Social media pack**: platform captions (Instagram/Facebook/X) with relevant hashtags.
Each block has copy-to-clipboard and regenerate.

## Example mode
A prominent "See an example" toggle pre-fills the form with a sample property and shows a sample output, so first-time users instantly understand input → output.

## Pages / flow
```
/                -> Landing (hero, voices showcase, pricing £24.99 + 14-day trial, example I/O, Start free trial CTA)
/auth            -> Sign up / Log in (email + password)
/reset-password  -> Set new password (recovery)
_authenticated/
  /app           -> The generator (form + voice picker + outputs + example mode)
  /account       -> Subscription status, trial countdown, Manage/Cancel subscription
/api/public/stripe-webhook -> Stripe webhook (subscription lifecycle)
```

## Access & subscription gating
- Email + password auth via Lovable Cloud. A `profiles` row is auto-created on signup.
- After signup, user is sent to Stripe Payment Link (trial configured on the Stripe price) with their email pre-filled and a reference linking the checkout back to their account.
- A Stripe webhook updates a `subscribers` table with subscription status (trialing / active / canceled), current period end, Stripe customer & subscription IDs.
- The `/app` generator checks subscription status: allowed when `trialing` or `active`; otherwise shows a "Subscribe to continue" screen.
- **Cancel**: `/account` has a Cancel button calling a secure server function that cancels the Stripe subscription (cancel at period end) via the Stripe API and reflects status in-app.

## Technical notes
- **Lovable Cloud** enabled for auth + Postgres.
- **Tables** (all with RLS + grants):
  - `profiles` (id -> auth.users, email) — user reads/updates own row.
  - `subscribers` (user_id, email, stripe_customer_id, stripe_subscription_id, status, trial_end, current_period_end) — user reads own row; writes done server-side.
  - `generations` (id, user_id, voice, inputs jsonb, output text, created_at) — user reads/writes own rows; a saved history list on `/app`.
- **AI**: Lovable AI Gateway (`google/gemini-3-flash-preview`) via a `createServerFn` server function; voice → system prompt; structured output for listing + social pack. Server-only `LOVABLE_API_KEY`.
- **Stripe webhook**: server route under `/api/public/stripe-webhook`, verifies signature using the provided signing secret (`whsec_…`), updates `subscribers`. Signing secret + Stripe secret key stored as secrets.
- **Stripe payment link**: `https://buy.stripe.com/3cI00i1Ct5oO4pg3gC7AI0C` used for the trial/subscribe CTA.
- **Secrets needed**: `STRIPE_SECRET_KEY` (for cancel + reading subscription), `STRIPE_WEBHOOK_SECRET` (provided), `LOVABLE_API_KEY` (auto).

## Build order
1. Enable Lovable Cloud; create tables, RLS, grants, signup trigger.
2. Add logo asset; build design system (tokens, fonts) + landing page.
3. Auth (signup/login/reset) + auth gate.
4. Generator server function (voices + social pack) and `/app` UI with example mode + history.
5. Stripe: webhook route, subscribe CTA wiring, `/account` status + cancel.
6. Verify end-to-end (build, generation, gating).

## Notes / assumptions
- The Stripe price behind your Payment Link must have the 14-day trial configured in Stripe for "trial via Stripe" to work; the webhook will read `trialing` status from it.
- Self-service cancel requires your Stripe secret key (requested securely during build). If you'd prefer to avoid sharing it, the alternative is Stripe's hosted Customer Portal link instead — tell me and I'll switch.
