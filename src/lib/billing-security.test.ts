import { describe, expect, it, vi, afterEach } from "vitest";
import { isCompedUserId } from "./comped.server";
import { processBillingEvent } from "./billing-webhook.server";
import { createSubscriptionCheckoutSession } from "./stripe.server";
vi.mock("./config", () => ({ PLAN_PRICING: {} }));
vi.mock("./config.server", () => ({ identifyPlan: () => "starter" }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const event = {
  type: "checkout.session.completed",
  created: 100,
  data: {
    object: {
      mode: "subscription",
      subscription: "sub_current",
      client_reference_id: "user_synthetic",
      customer_details: { email: "domenico@copybymonk.com" },
    },
  },
};
const sub = {
  id: "sub_current",
  created: 90,
  status: "past_due",
  customer: "cus_synthetic",
  items: {
    data: [{ price: { id: "price_synthetic", unit_amount: 3900 }, current_period_end: 1792281600 }],
  },
};
function deps(row: unknown = null, readError: unknown = null, writeError: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data: true, error: writeError });
  const db = {
    from: vi.fn(() => ({
      select: () => ({
        eq: (key: string) => ({
          maybeSingle: async () => ({
            data:
              row ?? (key === "user_id" ? { user_id: "user_synthetic", updated_at: null } : null),
            error: readError,
          }),
        }),
      }),
    })),
    rpc,
  };
  return { db, getSubscription: vi.fn().mockResolvedValue(sub) };
}
describe("billing security", () => {
  it("never grants complimentary access by self-entered or checkout email", () => {
    expect(isCompedUserId("domenico@copybymonk.com")).toBe(false);
    expect(isCompedUserId("user_synthetic")).toBe(false);
    expect(isCompedUserId("ac5319e0-b05c-4ec8-99fc-e52559637b5f")).toBe(true);
  });
  it("never persists checkout email or trusts its status for entitlement", async () => {
    const d = deps();
    await processBillingEvent(event, d);
    const args = d.db.rpc.mock.calls[0][1];
    expect(args._user_id).toBe("user_synthetic");
    expect(args._fields.email).toBeUndefined();
    expect(args._fields.status).toBe("past_due");
    expect(args._subscription_id).toBe("sub_current");
    expect(args._event_created).toBe(100);
  });
  it("throws returned database read errors for webhook retry", async () => {
    await expect(processBillingEvent(event, deps(null, new Error("read failed")))).rejects.toThrow(
      "read failed",
    );
  });
  it("throws returned database write errors for webhook retry", async () => {
    await expect(
      processBillingEvent(event, deps(null, null, new Error("write failed"))),
    ).rejects.toThrow("write failed");
  });
  it("does not attach an old subscription via user metadata or customer fallback", async () => {
    const d = deps();
    await processBillingEvent(
      {
        type: "customer.subscription.deleted",
        created: 99,
        data: {
          object: {
            id: "sub_current",
            customer: "cus_synthetic",
            metadata: { user_id: "user_synthetic" },
          },
        },
      },
      d,
    );
    expect(d.db.rpc).not.toHaveBeenCalled();
  });
  it("reads current Stripe state instead of invoice paid snapshots", async () => {
    const d = deps({ user_id: "user_synthetic" });
    await processBillingEvent(
      { type: "invoice.paid", created: 99, data: { object: { subscription: "sub_current" } } },
      d,
    );
    expect(d.db.rpc.mock.calls[0][1]._fields.status).toBe("past_due");
  });
  it("fails instead of inventing active access when Stripe lookup fails", async () => {
    const d = deps();
    d.getSubscription.mockRejectedValue(new Error("Stripe unavailable"));
    await expect(processBillingEvent(event, d)).rejects.toThrow("Stripe unavailable");
    expect(d.db.rpc).not.toHaveBeenCalled();
  });
  it("reuses the durable checkout attempt key and omits repeat trial", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "synthetic-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ url: "https://checkout.stripe.com/synthetic" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    await createSubscriptionCheckoutSession({
      plan: "starter",
      priceId: "price_synthetic",
      userId: "user_synthetic",
      email: "synthetic@example.invalid",
      customerId: null,
      successUrl: "https://copybymonk.com/account",
      cancelUrl: "https://copybymonk.com/subscription",
      trialDays: 0,
      idempotencyKey: "quill-checkout-synthetic",
    });
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("quill-checkout-synthetic");
    expect(fetchMock.mock.calls[0][1].body).not.toContain("trial_period_days");
  });
});
