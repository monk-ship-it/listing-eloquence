import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isCompedEmail, getPlan, type PlanId } from "./config";

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

function toInfo(row: {
  status: string;
  plan?: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  current_period_end: string | null;
  email: string | null;
} | null): SubscriptionInfo {
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
 * Determines whether a subscription grants access.
 * - `active` / `trialing` always grant access.
 * - `past_due` / `unpaid` keep access during a grace window: until the paid
 *   period (current_period_end) has actually elapsed.
 */
export function hasActiveAccess(
  status: string,
  currentPeriodEnd: string | null,
): boolean {
  if (status === "active" || status === "trialing") return true;
  if (status === "past_due" || status === "unpaid") {
    if (!currentPeriodEnd) return false;
    return new Date(currentPeriodEnd).getTime() > Date.now();
  }
  return false;
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
  const { count } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonthIso());

  const used = count ?? 0;
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

    const { setSubscriptionCancelAtPeriodEnd } = await import("./stripe.server");
    const updated = await setSubscriptionCancelAtPeriodEnd(row.stripe_subscription_id, true);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved } = await supabaseAdmin
      .from("subscribers")
      .update({
        cancel_at_period_end: true,
        status: updated.status,
      })
      .eq("user_id", userId)
      .select("status, cancel_at_period_end, trial_end, current_period_end, email")
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

    const { setSubscriptionCancelAtPeriodEnd } = await import("./stripe.server");
    const updated = await setSubscriptionCancelAtPeriodEnd(row.stripe_subscription_id, false);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved } = await supabaseAdmin
      .from("subscribers")
      .update({
        cancel_at_period_end: false,
        status: updated.status,
      })
      .eq("user_id", userId)
      .select("status, cancel_at_period_end, trial_end, current_period_end, email")
      .maybeSingle();

    return toInfo(saved);
  });
