import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isCompedEmail } from "./config";

export interface SubscriptionInfo {
  status: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
  email: string | null;
}

function toInfo(row: {
  status: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  current_period_end: string | null;
  email: string | null;
} | null): SubscriptionInfo {
  const status = row?.status ?? "none";
  const comped = isCompedEmail(row?.email);
  return {
    status: comped ? "active" : status,
    cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
    trialEnd: row?.trial_end ?? null,
    currentPeriodEnd: row?.current_period_end ?? null,
    hasAccess: comped || status === "trialing" || status === "active",
    email: row?.email ?? null,
  };
}

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionInfo> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("subscribers")
      .select("status, cancel_at_period_end, trial_end, current_period_end, email")
      .eq("user_id", userId)
      .maybeSingle();
    return toInfo(data);
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
