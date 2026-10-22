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
      priceId: envWithPrefix("STRIPE_STARTER_PRICE_ID", "price_") ?? PLAN_PRICING.starter.priceId,
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

// Plan identification uses exact Quill price allowlists only (see plan-identity.ts).
// Env price ids are deliberately NOT trusted for entitlement: a stale or
// unrelated id must never grant Quill access.
export { identifyPlan, planForPriceId, LEGACY_PRICE_PLAN } from "./plan-identity";
