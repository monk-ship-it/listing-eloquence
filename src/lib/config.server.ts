import process from "node:process";
import { STRIPE_PLAN_IDS, PLAN_PRICING } from "./config";

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
 * public constants in STRIPE_PLAN_IDS (config.ts) are used. Amounts are the
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
        STRIPE_PLAN_IDS.starter.paymentLinkId,
      priceId:
        envWithPrefix("STRIPE_STARTER_PRICE_ID", "price_") ?? STRIPE_PLAN_IDS.starter.priceId,
      amount: STRIPE_PLAN_IDS.starter.amount,
    },
    pro: {
      paymentLinkId:
        envWithPrefix("STRIPE_PRO_PAYMENT_LINK_ID", "plink_") ?? STRIPE_PLAN_IDS.pro.paymentLinkId,
      priceId: envWithPrefix("STRIPE_PRO_PRICE_ID", "price_") ?? STRIPE_PLAN_IDS.pro.priceId,
      amount: STRIPE_PLAN_IDS.pro.amount,
    },
    growth: {
      paymentLinkId:
        envWithPrefix("STRIPE_GROWTH_PAYMENT_LINK_ID", "plink_") ??
        STRIPE_PLAN_IDS.growth.paymentLinkId,
      priceId: envWithPrefix("STRIPE_GROWTH_PRICE_ID", "price_") ?? STRIPE_PLAN_IDS.growth.priceId,
      amount: STRIPE_PLAN_IDS.growth.amount,
    },
  };
}

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
  }
  if (opts.amount != null) {
    // Exact new-price amounts first.
    for (const k of keys) {
      if (opts.amount === cfg[k].amount) return k;
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
