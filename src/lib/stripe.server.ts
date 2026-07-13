import { PLAN_PRICING, MARKETS, type MarketId, type PlanId } from "./config";

const STRIPE_API = "https://api.stripe.com/v1";

function getKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return key;
}

async function stripeRequest(
  path: string,
  method: "GET" | "POST",
  form?: Record<string, string>,
): Promise<any> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  }
  return data;
}

export function getStripeSubscription(subscriptionId: string) {
  return stripeRequest(`/subscriptions/${subscriptionId}`, "GET");
}

export function getCheckoutSession(sessionId: string) {
  return stripeRequest(
    `/checkout/sessions/${sessionId}?expand[]=subscription`,
    "GET",
  );
}

let _priceCache: { at: number; map: Record<string, string> } | undefined;

/**
 * Resolves the live Stripe price id for a plan + market.
 *
 * 1. Prefer the exact known Price ID constant (PLAN_PRICING). This is the
 *    authoritative path and requires no API call. The client never supplies a
 *    price id — it is resolved server-side from the validated plan + market.
 * 2. Fall back to matching an active recurring MONTHLY price in the market's
 *    currency at the exact plan amount only if the constant is somehow missing.
 */
export async function resolvePriceId(
  plan: string,
  market: MarketId = "uk",
): Promise<string> {
  const marketPricing = PLAN_PRICING[market] ?? PLAN_PRICING.uk;
  const planPricing =
    marketPricing[plan as PlanId] ?? marketPricing.starter;

  const known = planPricing.priceId;
  if (known) return known;

  const amount = planPricing.amount;
  const currency = MARKETS[market].currency;
  const cacheKey = `${market}:${plan}`;
  if (_priceCache && Date.now() - _priceCache.at < 5 * 60_000) {
    const cached = _priceCache.map[cacheKey];
    if (cached) return cached;
  }

  const res = await stripeRequest("/prices?active=true&limit=100", "GET");
  const map: Record<string, string> = {};
  for (const p of res.data ?? []) {
    // Fallback lookup requires: monthly interval, matching currency, exact amount.
    if (p?.recurring?.interval !== "month") continue;
    if (p?.currency !== currency) continue;
    const amt = p.unit_amount as number | undefined;
    if (amt == null) continue;
    for (const mkt of Object.keys(PLAN_PRICING) as MarketId[]) {
      if (MARKETS[mkt].currency !== p.currency) continue;
      for (const [planId, meta] of Object.entries(PLAN_PRICING[mkt])) {
        const key = `${mkt}:${planId}`;
        if (amt === meta.amount && !map[key]) map[key] = p.id;
      }
    }
  }
  _priceCache = { at: Date.now(), map };

  const priceId = map[cacheKey];
  if (!priceId) {
    throw new Error(
      `No active Stripe price found for plan "${plan}" in ${currency.toUpperCase()} (expected ${(amount / 100).toFixed(2)}/month).`,
    );
  }
  return priceId;
}


export interface CheckoutParams {
  plan: string;
  priceId: string;
  userId: string;
  email: string;
  customerId: string | null;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  market?: MarketId;
  currency?: string;
}

/** Create a subscription Checkout Session tied to the logged-in app user. */
export async function createSubscriptionCheckoutSession(params: CheckoutParams) {
  const market = params.market ?? "uk";
  const currency = params.currency ?? MARKETS[market].currency;
  const form: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": params.priceId,
    "line_items[0][quantity]": "1",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    "metadata[user_id]": params.userId,
    "metadata[plan]": params.plan,
    "metadata[price_id]": params.priceId,
    "metadata[market]": market,
    "metadata[currency]": currency,
    "subscription_data[metadata][user_id]": params.userId,
    "subscription_data[metadata][plan]": params.plan,
    "subscription_data[metadata][market]": market,
    "subscription_data[metadata][currency]": currency,
    allow_promotion_codes: "true",
    payment_method_collection: "always",
  };


  if (params.customerId) {
    form.customer = params.customerId;
  } else if (params.email) {
    form.customer_email = params.email;
  }

  if (params.trialDays && params.trialDays > 0) {
    form["subscription_data[trial_period_days]"] = String(params.trialDays);
  }

  return stripeRequest("/checkout/sessions", "POST", form);
}

export function setSubscriptionCancelAtPeriodEnd(
  subscriptionId: string,
  cancel: boolean,
) {
  return stripeRequest(`/subscriptions/${subscriptionId}`, "POST", {
    cancel_at_period_end: cancel ? "true" : "false",
  });
}

/** Create a Stripe Billing Portal session so the customer can self-manage/cancel. */
export function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripeRequest("/billing_portal/sessions", "POST", {
    customer: customerId,
    return_url: returnUrl,
  });
}
