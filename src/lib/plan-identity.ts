import { PLAN_PRICING, type PlanId } from "./config";

/**
 * Exact allowlist of Stripe prices that belong to Quill. The Stripe account
 * also hosts unrelated products, so entitlement is NEVER inferred from an
 * amount, a threshold, an env override or an unknown price/payment link.
 * Retired (grandfathered) Quill prices stay here so old rows keep a plan.
 */
export const LEGACY_PRICE_PLAN: Readonly<Record<string, PlanId>> = {
  price_1Tst7KAAj6LfwOUap6nwwkT1: "starter",
  price_1Tst7TAAj6LfwOUaTOG299iy: "pro",
  price_1Tst7dAAj6LfwOUaD8AqhUVE: "growth",
  price_1Tj5eDAAj6LfwOUapbQ7yPiy: "starter",
};

const PLAN_KEYS: PlanId[] = ["starter", "pro", "growth"];

/** Plan for an exact Quill price id, or null for anything unknown. */
export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const k of PLAN_KEYS) if (PLAN_PRICING[k].priceId === priceId) return k;
  return LEGACY_PRICE_PLAN[priceId] ?? null;
}

/**
 * Identifies a Quill plan from Stripe data. Returns null (no entitlement) for
 * unknown prices/payment links or a non-GBP currency. Amounts are ignored.
 */
export function identifyPlan(opts: {
  paymentLinkId?: string | null;
  priceId?: string | null;
  currency?: string | null;
  amount?: number | null;
}): PlanId | null {
  if (opts.currency != null && String(opts.currency).toLowerCase() !== "gbp") return null;
  if (opts.priceId) return planForPriceId(opts.priceId);
  if (opts.paymentLinkId) {
    for (const k of PLAN_KEYS) if (PLAN_PRICING[k].paymentLinkId === opts.paymentLinkId) return k;
  }
  return null;
}
