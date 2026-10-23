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

/** Reviewed current catalogue; stale environment prices/payment links are ignored. */
export function getStripePlanConfig(): Record<PlanKey, { priceId: string; amount: number }> {
  return {
    starter: {
      priceId: PLAN_PRICING.starter.priceId,
      amount: PLAN_PRICING.starter.amount,
    },
    pro: {
      priceId: PLAN_PRICING.pro.priceId,
      amount: PLAN_PRICING.pro.amount,
    },
    growth: {
      priceId: PLAN_PRICING.growth.priceId,
      amount: PLAN_PRICING.growth.amount,
    },
  };
}

// Plan identification uses exact Quill price allowlists only (see plan-identity.ts).
// Env price ids are deliberately NOT trusted for entitlement: a stale or
// unrelated id must never grant Quill access.
export { identifyPlan, planForPriceId, LEGACY_PRICE_PLAN } from "./plan-identity";
