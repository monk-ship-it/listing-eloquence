import { STRIPE_PLAN_IDS, type PlanId } from "./config";

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

/** Monthly GBP price (in pence) expected for each plan. Mirrors planFromSubscription. */
const PLAN_AMOUNTS: Record<string, number> = {
  starter: 2499,
  pro: 2999,
  growth: 4999,
};

let _priceCache: { at: number; map: Record<string, string> } | undefined;

/**
 * Resolves the live Stripe price id for a plan by matching the recurring
 * monthly amount. This avoids hardcoding ids while never creating new prices.
 */
export async function resolvePriceId(plan: string): Promise<string> {
  const amount = PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.starter;
  if (_priceCache && Date.now() - _priceCache.at < 5 * 60_000) {
    const cached = _priceCache.map[plan];
    if (cached) return cached;
  }

  const res = await stripeRequest("/prices?active=true&limit=100", "GET");
  const map: Record<string, string> = {};
  for (const p of res.data ?? []) {
    if (p?.recurring?.interval !== "month") continue;
    const amt = p.unit_amount as number | undefined;
    if (amt == null) continue;
    for (const [planId, planAmt] of Object.entries(PLAN_AMOUNTS)) {
      if (amt === planAmt && !map[planId]) map[planId] = p.id;
    }
  }
  _priceCache = { at: Date.now(), map };

  const priceId = map[plan];
  if (!priceId) {
    throw new Error(
      `No active Stripe price found for plan "${plan}" (expected £${(amount / 100).toFixed(2)}/month).`,
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
}

/** Create a subscription Checkout Session tied to the logged-in app user. */
export async function createSubscriptionCheckoutSession(params: CheckoutParams) {
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
    "subscription_data[metadata][user_id]": params.userId,
    "subscription_data[metadata][plan]": params.plan,
    allow_promotion_codes: "true",
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
