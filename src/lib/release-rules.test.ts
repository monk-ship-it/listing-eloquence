import { describe, expect, it, vi, afterEach } from "vitest";
import { canCancelSubscription, safeBillingReturnUrl, subscriptionPeriodEnd } from "./billing-state";
import { sanitizeAuthNext, isRecoveryLink } from "./auth-state";
import { setSubscriptionCancelAtPeriodEnd } from "./stripe.server";

vi.mock("./config", () => ({ PLAN_PRICING: {} }));

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("release account safeguards", () => {
  it("allows cancellation even when payment problems block access", () => {
    for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]) expect(canCancelSubscription(status, "sub_synthetic")).toBe(true);
    expect(canCancelSubscription("canceled", "sub_synthetic")).toBe(false);
    expect(canCancelSubscription("active", null)).toBe(false);
  });
  it("keeps cancellation at period end, without an immediate cancellation or charge", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "synthetic-test-key");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "active", cancel_at_period_end: true }) });
    vi.stubGlobal("fetch", fetchMock);
    await setSubscriptionCancelAtPeriodEnd("sub_synthetic", true);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/subscriptions/sub_synthetic");
    expect(request.method).toBe("POST");
    expect(request.body).toBe("cancel_at_period_end=true");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("uses the authoritative paid access end date in both Stripe formats", () => {
    expect(subscriptionPeriodEnd({ current_period_end: 1792281600 })).toBe("2026-10-18T00:00:00.000Z");
    expect(subscriptionPeriodEnd({ items: { data: [{ current_period_end: 1792281600 }] } })).toBe("2026-10-18T00:00:00.000Z");
    expect(subscriptionPeriodEnd({})).toBeNull();
  });
  it("never returns billing customers to an external or credential-bearing URL", () => {
    expect(safeBillingReturnUrl("https://evil.example/subscription", "https://copybymonk.com")).toBe("https://copybymonk.com/subscription");
    expect(safeBillingReturnUrl("https://www.copybymonk.com/account?private=1", "https://copybymonk.com")).toBe("https://www.copybymonk.com/subscription");
    expect(safeBillingReturnUrl("https://user@copybymonk.com/", "https://copybymonk.com")).toBe("https://copybymonk.com/subscription");
  });
  it("rejects external authentication redirect tricks", () => {
    expect(sanitizeAuthNext("/app?g=synthetic")).toBe("/app?g=synthetic");
    for (const path of ["//evil.example", "/\\evil.example", "/\nevil.example", "https://evil.example"]) expect(sanitizeAuthNext(path)).toBeUndefined();
  });
  it("requires a recovery link, not an ordinary session or failed link", () => {
    expect(isRecoveryLink("#type=recovery&access_token=synthetic")).toBe(true);
    expect(isRecoveryLink("#type=signup&access_token=synthetic")).toBe(false);
    expect(isRecoveryLink("#type=recovery&error=expired")).toBe(false);
    expect(isRecoveryLink("")).toBe(false);
  });
});