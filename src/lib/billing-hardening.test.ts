import { afterEach, describe, expect, it, vi } from "vitest";
import { identifyPlan, planForPriceId, LEGACY_PRICE_PLAN } from "./plan-identity";
import { PLAN_PRICING } from "./config";
import { processBillingEvent } from "./billing-webhook.server";
import { hasActiveAccess, computeUsage } from "./subscription.functions";
import { getStripeSubscription, StripeRetryableError, createSubscriptionCheckoutSession } from "./stripe.server";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const future = new Date(Date.now() + 86_400_000).toISOString();

describe("Quill plan identity allowlist", () => {
  it("maps current Quill prices", () => {
    expect(planForPriceId(PLAN_PRICING.starter.priceId)).toBe("starter");
    expect(planForPriceId(PLAN_PRICING.pro.priceId)).toBe("pro");
    expect(planForPriceId(PLAN_PRICING.growth.priceId)).toBe("growth");
  });
  it("maps every grandfathered Quill price", () => {
    expect(LEGACY_PRICE_PLAN).toEqual({
      price_1Tst7KAAj6LfwOUap6nwwkT1: "starter",
      price_1Tst7TAAj6LfwOUaTOG299iy: "pro",
      price_1Tst7dAAj6LfwOUaD8AqhUVE: "growth",
      price_1Tj5eDAAj6LfwOUapbQ7yPiy: "starter",
    });
    for (const [id, plan] of Object.entries(LEGACY_PRICE_PLAN)) expect(identifyPlan({ priceId: id, currency: "gbp" })).toBe(plan);
  });
  it("gives no plan to an unrelated high-priced GBP product", () => {
    expect(identifyPlan({ priceId: "price_unrelated_gbp", currency: "gbp", amount: 99900 })).toBeNull();
  });
  it("gives no plan to a USD product, even at a Quill amount", () => {
    expect(identifyPlan({ priceId: "price_unrelated_usd", currency: "usd", amount: 14900 })).toBeNull();
    expect(identifyPlan({ priceId: PLAN_PRICING.growth.priceId, currency: "usd" })).toBeNull();
  });
  it("ignores stale env price ids", () => {
    vi.stubEnv("STRIPE_GROWTH_PRICE_ID", "price_stale_env");
    expect(identifyPlan({ priceId: "price_stale_env", currency: "gbp" })).toBeNull();
  });
  it("never infers a plan from amount alone or unknown payment links", () => {
    expect(identifyPlan({ amount: 3900 })).toBeNull();
    expect(identifyPlan({ paymentLinkId: "plink_unknown" })).toBeNull();
  });
  it("denies access for active subscriptions on unknown prices", () => {
    expect(hasActiveAccess("active", future, "price_unrelated_gbp")).toBe(false);
    expect(hasActiveAccess("active", future, null)).toBe(false);
    expect(hasActiveAccess("active", future, PLAN_PRICING.pro.priceId)).toBe(true);
  });
});

function webhookDeps(price: Record<string, unknown>, row: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
  const db = { from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) })), rpc };
  const sub = { id: "sub_x", created: 1, status: "active", customer: "cus_x", items: { data: [{ price, current_period_end: 1792281600 }] } };
  return { db, getSubscription: vi.fn().mockResolvedValue(sub) };
}
const checkoutObj = { mode: "subscription", subscription: "sub_x", client_reference_id: "user_x" };

describe("webhook entitlement rules", () => {
  it("does not attach checkout for an unrelated product", async () => {
    const d = webhookDeps({ id: "price_other", currency: "gbp", unit_amount: 50000 });
    await processBillingEvent({ type: "checkout.session.completed", created: 2, data: { object: checkoutObj } }, d);
    expect(d.db.rpc).not.toHaveBeenCalled();
  });
  it("attaches on checkout.session.async_payment_succeeded for a Quill price", async () => {
    const d = webhookDeps({ id: PLAN_PRICING.pro.priceId, currency: "gbp" });
    await processBillingEvent({ type: "checkout.session.async_payment_succeeded", created: 2, data: { object: checkoutObj } }, d);
    const args = d.db.rpc.mock.calls[0][1];
    expect(args._user_id).toBe("user_x");
    expect(args._fields.plan).toBe("pro");
    expect(args._checkout).toBe(true);
  });
  it("records an unknown price on an owned row without granting a plan from it", async () => {
    const d = webhookDeps({ id: "price_other", currency: "usd" }, { user_id: "user_x" });
    await processBillingEvent({ type: "customer.subscription.updated", created: 3, data: { object: { id: "sub_x" } } }, d);
    const f = d.db.rpc.mock.calls[0][1]._fields;
    expect(f.stripe_price_id).toBe("price_other");
    expect(hasActiveAccess(f.status, future, f.stripe_price_id)).toBe(false);
  });
});

describe("usage reads fail closed", () => {
  const db = (err: unknown) => ({ from: () => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "gte"]) q[m] = () => q;
    (q as { then: unknown }).then = (r: (v: unknown) => void) => r({ count: err ? null : 0, error: err });
    return q;
  } });
  it("throws instead of reporting unused allowance when the read fails", async () => {
    await expect(computeUsage(db(new Error("x")), "u", "starter", false)).rejects.toThrow("Could not load your listing usage");
  });
  it("reports real usage when reads succeed", async () => {
    expect((await computeUsage(db(null), "u", "starter", false)).remaining).toBe(15);
  });
});

describe("bounded Stripe requests", () => {
  it("turns timeouts into a retryable error after one retry", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
    const f = vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    vi.stubGlobal("fetch", f);
    await expect(getStripeSubscription("sub_x")).rejects.toBeInstanceOf(StripeRetryableError);
    expect(f).toHaveBeenCalledTimes(2);
    expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it("reuses the same idempotency key when retrying checkout creation", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
    const f = vi.fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await createSubscriptionCheckoutSession({ plan: "starter", priceId: "price_x", userId: "u", email: "", customerId: null, successUrl: "s", cancelUrl: "c", idempotencyKey: "quill-checkout-a1" });
    expect(f.mock.calls.map((c) => c[1].headers["Idempotency-Key"])).toEqual(["quill-checkout-a1", "quill-checkout-a1"]);
  });
  it("never offers payment_method_types allowlists at checkout", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: "u" }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await createSubscriptionCheckoutSession({ plan: "starter", priceId: "price_x", userId: "u", email: "", customerId: null, successUrl: "s", cancelUrl: "c", idempotencyKey: "k" });
    expect(String(f.mock.calls[0][1].body)).not.toContain("payment_method_types");
  });
});
