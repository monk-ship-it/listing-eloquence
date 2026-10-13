import process from "node:process";
import { PLAN_PRICING } from "./config";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
  };
}

export type PlanKey = "starter" | "pro" | "growth";

/** The public base URL of the app, used for post-checkout redirects. */
export function getAppUrl(): string {
  return (process.env.APP_URL || "https://copybymonk.com").replace(/\/+$/, "");
}

/**
 * Returns an env value only when it is present AND matches the expected id
 * prefix. This guards against the historically swapped
 * STRIPE_*_PRICE_ID / STRIPE_*_PAYMENT_LINK_ID secrets, where a price-id slot
 * actually held a `plink_` value (and vice-versa). A mismatched value is
 * treated as missing so the hardcoded public constants are used instead.
 */
function envWithPrefix(name: string, prefix: "price_" | "plink_"): string | null {
  const v = process.env[name];
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.startsWith(prefix) ? trimmed : null;
}

/**
 * Reads the Stripe Payment Link ID and Price ID for each plan. Env secrets are
 * used only when they carry the correct prefix; otherwise the authoritative
 * public constants in PLAN_PRICING (config.ts) are used. Amounts are the
 * current live pence amounts.
 */
export function getStripePlanConfig(): Record<
  PlanKey,
  { paymentLinkId: string | null; priceId: string | null; amount: number }
> {
  return {
    starter: {
      paymentLinkId:
        envWithPrefix("STRIPE_STARTER_PAYMENT_LINK_ID", "plink_") ??
        PLAN_PRICING.starter.paymentLinkId,
      priceId:
        envWithPrefix("STRIPE_STARTER_PRICE_ID", "price_") ?? PLAN_PRICING.starter.priceId,
      amount: PLAN_PRICING.starter.amount,
    },
    pro: {
      paymentLinkId:
        envWithPrefix("STRIPE_PRO_PAYMENT_LINK_ID", "plink_") ?? PLAN_PRICING.pro.paymentLinkId,
      priceId: envWithPrefix("STRIPE_PRO_PRICE_ID", "price_") ?? PLAN_PRICING.pro.priceId,
      amount: PLAN_PRICING.pro.amount,
    },
    growth: {
      paymentLinkId:
        envWithPrefix("STRIPE_GROWTH_PAYMENT_LINK_ID", "plink_") ??
        PLAN_PRICING.growth.paymentLinkId,
      priceId: envWithPrefix("STRIPE_GROWTH_PRICE_ID", "price_") ?? PLAN_PRICING.growth.priceId,
      amount: PLAN_PRICING.growth.amount,
    },
  };
}

/**
 * Retired Stripe price ids that may still appear on old subscriber rows.
 * Kept so historical records always map to a plan.
 */
const LEGACY_PRICE_PLAN: Record<string, PlanKey> = {
  price_1Tst7KAAj6LfwOUap6nwwkT1: "starter",
  price_1Tst7TAAj6LfwOUaTOG299iy: "pro",
  price_1Tst7dAAj6LfwOUaD8AqhUVE: "growth",
  price_1Tj5eDAAj6LfwOUapbQ7yPiy: "starter",
};

/**
 * Identifies the plan key from a Stripe checkout/subscription using, in
 * priority order: Payment Link ID, Price ID, then the recurring amount.
 * Matches both the new live ids/amounts and (via exact amount) the legacy
 * amounts so existing subscriptions still map to the right plan.
 */
export function identifyPlan(opts: {
  paymentLinkId?: string | null;
  priceId?: string | null;
  amount?: number | null;
}): PlanKey {
  const cfg = getStripePlanConfig();
  const keys: PlanKey[] = ["starter", "pro", "growth"];

  if (opts.paymentLinkId) {
    for (const k of keys) {
      if (cfg[k].paymentLinkId && cfg[k].paymentLinkId === opts.paymentLinkId) return k;
    }
  }
  if (opts.priceId) {
    for (const k of keys) {
      if (cfg[k].priceId && cfg[k].priceId === opts.priceId) return k;
    }
    const legacy = LEGACY_PRICE_PLAN[opts.priceId];
    if (legacy) return legacy;
  }
  if (opts.amount != null) {
    for (const k of keys) {
      if (opts.amount === PLAN_PRICING[k].amount) return k;
    }

    // Legacy amounts (£24.99 / £29.99 / £49.99) for grandfathered subs.
    if (opts.amount === 4999) return "growth";
    if (opts.amount === 2999) return "pro";
    if (opts.amount === 2499) return "starter";
    // Threshold fallback for anything else.
    if (opts.amount >= 14900) return "growth";
    if (opts.amount >= 7900) return "pro";
    return "starter";
  }
  return "starter";
}
