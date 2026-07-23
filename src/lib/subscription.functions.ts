import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  isCompedEmail,
  getPlan,
  TRIAL_DAYS,
  MARKETS,
  resolveMarketId,
  type PlanId,
} from "./config";

export interface SubscriptionInfo {
  status: string;
  rawStatus: string;
  plan: PlanId;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
  isComped: boolean;
  email: string | null;
}

export interface UsageInfo {
  plan: PlanId;
  planName: string;
  limit: number;
  used: number;
  remaining: number;
  unlimited: boolean;
  resetsOn: string;
}

function toInfo(
  row: {
    status: string;
    plan?: string | null;
    cancel_at_period_end: boolean;
    trial_end: string | null;
    current_period_end: string | null;
    email: string | null;
  } | null,
): SubscriptionInfo {
  const rawStatus = row?.status ?? "none";
  const comped = isCompedEmail(row?.email);
  return {
    status: comped ? "active" : rawStatus,
    rawStatus,
    plan: getPlan(row?.plan).id,
    cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
    trialEnd: row?.trial_end ?? null,
    currentPeriodEnd: row?.current_period_end ?? null,
    hasAccess: comped || hasActiveAccess(rawStatus, row?.current_period_end ?? null),
    isComped: comped,
    email: row?.email ?? null,
  };
}

/** First day of the current calendar month (UTC), as an ISO string. */
function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** First day of next calendar month (UTC) — when the listing allowance renews. */
function startOfNextMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/**
 * Determines whether a subscription grants paid access.
 * Only `active` and `trialing` grant access. All other statuses
 * (past_due, unpaid, canceled, incomplete, incomplete_expired,
 * payment_failed, none) restrict access. Access is always driven by the
 * database record, never by the post-checkout redirect URL.
 */
export function hasActiveAccess(status: string, _currentPeriodEnd: string | null): boolean {
  return status === "active" || status === "trialing";
}

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionInfo> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("subscribers")
      .select("status, plan, cancel_at_period_end, trial_end, current_period_end, email")
      .eq("user_id", userId)
      .maybeSingle();
    return toInfo(data);
  });

/**
 * Computes the user's listing usage for the current calendar month.
 * Comped accounts are unlimited. Limits come from the plan in PLANS.
 */
export async function computeUsage(
  supabase: { from: (t: string) => any },
  userId: string,
  plan: PlanId,
  comped: boolean,
): Promise<UsageInfo> {
  const planMeta = getPlan(plan);
  const nowIso = new Date().toISOString();
  // Count durable (completed) usage plus any unexpired reservations so
  // in-flight generations are reflected until they finalize or expire.
  const [{ count: completedCount }, { count: reservedCount }] = await Promise.all([
    supabase
      .from("generation_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("reservation_status", "completed")
      .gte("created_at", startOfMonthIso()),
    supabase
      .from("generation_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("reservation_status", "reserved")
      .gte("created_at", startOfMonthIso())
      .gte("reserved_until", nowIso),
  ]);

  const used = (completedCount ?? 0) + (reservedCount ?? 0);
  const limit = planMeta.monthlyListings;
  return {
    plan: planMeta.id,
    planName: planMeta.name,
    limit,
    used,
    remaining: comped ? -1 : Math.max(0, limit - used),
    unlimited: comped,
    resetsOn: startOfNextMonthIso(),
  };
}

export const getMyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsageInfo> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("subscribers")
      .select("plan, email")
      .eq("user_id", userId)
      .maybeSingle();
    const comped = isCompedEmail(data?.email);
    return computeUsage(supabase, userId, getPlan(data?.plan).id, comped);
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionInfo> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!row?.stripe_subscription_id) {
      throw new Error("No active subscription found to cancel.");
    }

    const { setSubscriptionCancelAtPeriodEnd, getStripeSubscription } =
      await import("./stripe.server");

    const current = await getStripeSubscription(row.stripe_subscription_id);
    if (current?.status === "canceled") {
      throw new Error("This subscription has already ended — there's nothing to cancel.");
    }

    const updated = await setSubscriptionCancelAtPeriodEnd(row.stripe_subscription_id, true);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved } = await supabaseAdmin
      .from("subscribers")
      .update({
        cancel_at_period_end: true,
        status: updated.status,
      })
      .eq("user_id", userId)
      .select("status, plan, cancel_at_period_end, trial_end, current_period_end, email")
      .maybeSingle();

    return toInfo(saved);
  });

export const resumeMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionInfo> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!row?.stripe_subscription_id) {
      throw new Error("No subscription found.");
    }

    const { setSubscriptionCancelAtPeriodEnd, getStripeSubscription } =
      await import("./stripe.server");

    // A fully canceled Stripe subscription can't be updated/resumed — the user
    // must re-subscribe via checkout. Detect that and surface a clear message.
    const current = await getStripeSubscription(row.stripe_subscription_id);
    if (current?.status === "canceled") {
      throw new Error(
        "This subscription has already ended and can't be resumed. Please choose a plan above to re-subscribe.",
      );
    }

    const updated = await setSubscriptionCancelAtPeriodEnd(row.stripe_subscription_id, false);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved } = await supabaseAdmin
      .from("subscribers")
      .update({
        cancel_at_period_end: false,
        status: updated.status,
      })
      .eq("user_id", userId)
      .select("status, plan, cancel_at_period_end, trial_end, current_period_end, email")
      .maybeSingle();

    return toInfo(saved);
  });

/**
 * Creates a Stripe Billing Portal session for the signed-in user and returns
 * the URL. The user manages/cancels there; the Stripe webhook syncs the result
 * back into the app on `customer.subscription.updated`/`deleted`.
 */
export const createBillingPortalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string }) => data)
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!row?.stripe_customer_id) {
      throw new Error("No billing account found. Subscribe first to manage billing.");
    }

    const { createBillingPortalSession } = await import("./stripe.server");
    const session = await createBillingPortalSession(row.stripe_customer_id, data.returnUrl);
    return { url: session.url as string };
  });

/**
 * Creates a Stripe Checkout Session for the signed-in user and selected plan,
 * returning the hosted checkout URL. The session carries the app user id in
 * `client_reference_id`, `metadata.user_id` and `subscription_data.metadata`
 * so the webhook can activate the correct account.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { plan: PlanId; origin: string; market?: string }) => data)
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    const { supabase, userId, claims } = context;
    const plan = getPlan(data.plan).id;
    // Never trust a client-provided price id: validate the market and resolve
    // the authoritative Stripe price id server-side from plan + market.
    const market = resolveMarketId(data.market);
    const currency = MARKETS[market].currency;

    const { data: row } = await supabase
      .from("subscribers")
      .select("stripe_customer_id, email, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    const email = (claims as { email?: string } | undefined)?.email ?? row?.email ?? "";

    if (
      isCompedEmail(email) ||
      hasActiveAccess(row?.status ?? "none", row?.current_period_end ?? null)
    ) {
      throw new Error(
        "You already have subscription access. Manage billing or contact support to change plan.",
      );
    }

    const { resolvePriceId, createSubscriptionCheckoutSession } = await import("./stripe.server");
    const { getAppUrl } = await import("./config.server");
    const priceId = await resolvePriceId(plan, market);

    // Never trust a client-supplied origin verbatim for Stripe redirect URLs.
    // Allowlist known public app origins; otherwise fall back to APP_URL.
    const rawOrigin = (data.origin ?? "").replace(/\/+$/, "");
    const ALLOWED_ORIGINS = new Set([
      getAppUrl(),
      "https://copybymonk.com",
      "https://www.copybymonk.com",
      "https://listing-eloquence.lovable.app",
    ]);
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : getAppUrl();

    const session = await createSubscriptionCheckoutSession({
      plan,
      priceId,
      userId,
      email,
      customerId: row?.stripe_customer_id ?? null,
      successUrl: `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/subscription?checkout=cancelled&market=${market}`,
      trialDays: plan === "starter" ? TRIAL_DAYS : 0,
      market,
      currency,
    });

    if (!session?.url) throw new Error("Could not start checkout. Please try again.");
    return { url: session.url as string };
  });

/**
 * Verifies a completed Checkout Session belongs to the signed-in user and
 * returns the latest subscription info. Used by the account page after the
 * post-payment redirect. Access is always derived from the DB record, never
 * from the redirect URL alone.
 */
export const verifyCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) => data)
  .handler(
    async ({
      context,
      data,
    }): Promise<{ ok: boolean; activated: boolean; subscription: SubscriptionInfo }> => {
      const { supabase, userId } = context;

      const { getCheckoutSession } = await import("./stripe.server");
      let belongs = false;
      try {
        const session = await getCheckoutSession(data.sessionId);
        const sessionUser = session?.metadata?.user_id ?? session?.client_reference_id ?? null;
        belongs = sessionUser === userId;
      } catch (err) {
        console.error("verifyCheckoutSession: failed to retrieve session", err);
      }

      const { data: dbRow } = await supabase
        .from("subscribers")
        .select("status, plan, cancel_at_period_end, trial_end, current_period_end, email")
        .eq("user_id", userId)
        .maybeSingle();

      const subscription = toInfo(dbRow);
      return { ok: belongs, activated: subscription.hasAccess, subscription };
    },
  );
