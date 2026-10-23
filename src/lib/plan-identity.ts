import { PLAN_PRICING, type PlanId } from "./config";

/**
 * Exact allowlist of Stripe prices that belong to Quill. The Stripe account
 * also hosts unrelated products, so entitlement is NEVER inferred from an
 * amount, a threshold, an env override or an unknown price/payment link.
 * Retired (grandfathered) Quill prices stay here so old rows keep a plan.
 */
export interface QuillPrice {
  plan: PlanId;
  currency: "gbp" | "usd";
  amount: number;
}

/** Exact Stripe-verified history. Retiring a price never migrates its subscribers. */
export const LEGACY_PRICES: Readonly<Record<string, QuillPrice>> = {
  price_1TqWz1AAj6LfwOUatt9zzYA1: { plan: "starter", currency: "gbp", amount: 3900 },
  price_1TqWz2AAj6LfwOUaQBZwZyJr: { plan: "pro", currency: "gbp", amount: 7900 },
  price_1TqWz3AAj6LfwOUat924mxdX: { plan: "growth", currency: "gbp", amount: 14900 },
  price_1Tj5eDAAj6LfwOUapbQ7yPiy: { plan: "starter", currency: "gbp", amount: 2499 },
  price_1TjkobAAj6LfwOUa7B5uOLuA: { plan: "pro", currency: "gbp", amount: 2999 },
  price_1TjkxPAAj6LfwOUapOSk4qbW: { plan: "growth", currency: "gbp", amount: 4999 },
  price_1Tst7KAAj6LfwOUap6nwwkT1: { plan: "starter", currency: "usd", amount: 4900 },
  price_1Tst7TAAj6LfwOUaTOG299iy: { plan: "pro", currency: "usd", amount: 9900 },
  price_1Tst7dAAj6LfwOUaD8AqhUVE: { plan: "growth", currency: "usd", amount: 19900 },
};

export const LEGACY_PRICE_PLAN: Readonly<Record<string, PlanId>> = Object.fromEntries(
  Object.entries(LEGACY_PRICES).map(([id, price]) => [id, price.plan]),
);

const PLAN_KEYS: PlanId[] = ["starter", "pro", "growth"];

/** Plan for an exact Quill price id, or null for anything unknown. */
export function priceForPriceId(priceId: string | null | undefined): QuillPrice | null {
  if (!priceId) return null;
  for (const plan of PLAN_KEYS) {
    if (PLAN_PRICING[plan].priceId === priceId)
      return { plan, currency: "gbp", amount: PLAN_PRICING[plan].amount };
  }
  return LEGACY_PRICES[priceId] ?? null;
}

export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  return priceForPriceId(priceId)?.plan ?? null;
}

/**
 * Identifies a Quill plan from Stripe data. Returns null (no entitlement) for
 * unknown prices/payment links or a mismatched currency. Amounts are ignored.
 */
export function identifyPlan(opts: {
  paymentLinkId?: string | null;
  priceId?: string | null;
  currency?: string | null;
  amount?: number | null;
}): PlanId | null {
  const price = priceForPriceId(opts.priceId);
  if (!price) return null;
  if (opts.currency != null && opts.currency.toLowerCase() !== price.currency) return null;
  return price.plan;
}

/** Never substitutes today's new-customer price for an existing account's price. */
export function subscriberPriceDisplay(priceId: string | null | undefined): string | null {
  const price = priceForPriceId(priceId);
  if (!price) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: price.currency.toUpperCase(),
    minimumFractionDigits: price.amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price.amount / 100);
}
