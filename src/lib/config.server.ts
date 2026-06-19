import process from "node:process";

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
 * Reads the Stripe Payment Link ID and Price ID for each plan from the
 * environment. All values are optional — plan identification gracefully
 * falls back (payment link ID -> price ID -> price amount).
 */
export function getStripePlanConfig(): Record<
  PlanKey,
  { paymentLinkId: string | null; priceId: string | null; amount: number }
> {
  return {
    starter: {
      paymentLinkId: process.env.STRIPE_STARTER_PAYMENT_LINK_ID || null,
      priceId: process.env.STRIPE_STARTER_PRICE_ID || null,
      amount: 2499,
    },
    pro: {
      paymentLinkId: process.env.STRIPE_PRO_PAYMENT_LINK_ID || null,
      priceId: process.env.STRIPE_PRO_PRICE_ID || null,
      amount: 2999,
    },
    growth: {
      paymentLinkId: process.env.STRIPE_GROWTH_PAYMENT_LINK_ID || null,
      priceId: process.env.STRIPE_GROWTH_PRICE_ID || null,
      amount: 4999,
    },
  };
}

/**
 * Identifies the plan key from a Stripe checkout/subscription using, in
 * priority order: Payment Link ID, Price ID, then the recurring amount.
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
    if (opts.amount >= 4999) return "growth";
    if (opts.amount >= 2999) return "pro";
    return "starter";
  }
  return "starter";
}
