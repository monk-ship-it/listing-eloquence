import { PLAN_PRICING, type PlanId } from "./config";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Stripe JSON
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
  return stripeRequest(`/checkout/sessions/${sessionId}?expand[]=subscription`, "GET");
}

/**
 * Resolves the live Stripe price id for a plan (GBP). Uses the authoritative
 * hard-coded constant; the client never supplies a price id.
 */
export async function resolvePriceId(plan: string): Promise<string> {
  return (PLAN_PRICING[plan as PlanId] ?? PLAN_PRICING.starter).priceId;
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
    "metadata[currency]": "gbp",
    "subscription_data[metadata][user_id]": params.userId,
    "subscription_data[metadata][plan]": params.plan,
    "subscription_data[metadata][currency]": "gbp",
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

export function setSubscriptionCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
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
