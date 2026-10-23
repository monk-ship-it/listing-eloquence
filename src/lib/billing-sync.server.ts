/**
 * Reconcile Stripe state without letting a delayed response overwrite a newer
 * webhook or user action. Every write compares the version read before the GET.
 */
import { identifyPlan } from "./config.server";
import { subscriptionPeriodEnd } from "./billing-state";
import type { Database } from "@/integrations/supabase/types";

export interface SubscriberRow {
  user_id?: string | null;
  email?: string | null;
  status?: string | null;
  plan?: string | null;
  cancel_at_period_end?: boolean | null;
  trial_end?: string | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  stripe_subscription_created?: number | null;
  stripe_event_created?: number | null;
  updated_at?: string | null;
}

export const SUBSCRIBER_COLUMNS =
  "user_id,status,plan,cancel_at_period_end,trial_end,current_period_end,email,stripe_customer_id,stripe_subscription_id,stripe_price_id,stripe_subscription_created,stripe_event_created,updated_at";

// The Supabase user/admin clients share this fluent API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BillingDatabase {
  from: (table: string) => any;
  rpc: (
    name: "apply_billing_event",
    args: Database["public"]["Functions"]["apply_billing_event"]["Args"],
  ) => PromiseLike<any>;
}
export interface BillingDeps {
  db: BillingDatabase;
  getSubscription: (id: string) => Promise<Record<string, any>>;
}
export interface ReconcileResult {
  row: SubscriberRow;
  synced: boolean;
}

export async function readBillingRow(
  db: BillingDatabase,
  userId: string,
): Promise<SubscriberRow | null> {
  const { data, error } = await db
    .from("subscribers")
    .select(SUBSCRIBER_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Returns the persisted version, including on conflict; never returns an unsaved snapshot. */
export async function persistSubscriptionSnapshot(
  db: BillingDatabase,
  before: SubscriberRow,
  sub: Record<string, any>,
  options: { checkout?: boolean; eventCreated?: number } = {},
): Promise<{ row: SubscriberRow; applied: boolean }> {
  if (!before.user_id || typeof sub.id !== "string")
    throw new Error("Missing subscription identity");
  const price = sub.items?.data?.[0]?.price;
  const fields = {
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? null),
    stripe_price_id: price?.id ?? null,
    status: sub.status ?? "canceled",
    plan:
      identifyPlan({ priceId: price?.id, currency: price?.currency ?? sub.currency }) ?? "starter",
    trial_end:
      typeof sub.trial_end === "number" ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_end: subscriptionPeriodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end === true,
  };
  const { data: applied, error } = await db.rpc("apply_billing_event", {
    _user_id: before.user_id,
    _subscription_id: sub.id,
    _subscription_created: sub.created ?? before.stripe_subscription_created ?? 0,
    _event_created: options.eventCreated ?? before.stripe_event_created ?? 0,
    _fields: fields,
    _checkout: options.checkout ?? false,
    _expected_updated_at: before.updated_at ?? null,
    _check_version: true,
  });
  if (error) throw error;
  const row = await readBillingRow(db, before.user_id);
  if (!row) throw new Error("Could not reload subscription state");
  return { row, applied: applied === true };
}

async function dependencies(): Promise<BillingDeps> {
  const [{ supabaseAdmin }, { getStripeSubscription }] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("./stripe.server"),
  ]);
  return { db: supabaseAdmin, getSubscription: getStripeSubscription };
}

/**
 * A conflict causes a new database read AND a fresh Stripe GET. Reusing the
 * rejected Stripe response would merely move the delayed overwrite into a retry.
 */
export async function reconcileSubscriberRow(
  row: SubscriberRow | null,
  supplied?: BillingDeps,
): Promise<ReconcileResult> {
  let current: SubscriberRow = row ?? {};
  const subscriptionId = current.stripe_subscription_id;
  if (!subscriptionId || !current.user_id) return { row: current, synced: false };
  try {
    const deps = supplied ?? (await dependencies());
    for (let attempt = 0; attempt < 2; attempt++) {
      // A newer checkout may already have replaced the original subscription.
      if (current.stripe_subscription_id !== subscriptionId) return { row: current, synced: false };
      const sub = await deps.getSubscription(subscriptionId);
      if (sub?.id !== subscriptionId) throw new Error("Subscription identity mismatch");
      const result = await persistSubscriptionSnapshot(deps.db, current, sub);
      current = result.row;
      if (result.applied) return { row: current, synced: true };
    }
  } catch {
    // Do not log Stripe responses, keys, email addresses or customer data.
    console.error("[billing-sync] Could not refresh subscription state");
  }
  return { row: current, synced: false };
}

/** Persist a confirmed cancel/resume response under the same version guard. */
export async function persistSubscriptionMutation(
  before: SubscriberRow,
  sub: Record<string, any>,
  supplied?: BillingDeps,
): Promise<SubscriberRow> {
  try {
    const deps = supplied ?? (await dependencies());
    const result = await persistSubscriptionSnapshot(deps.db, before, sub);
    if (result.applied) return result.row;
    // Re-read Stripe after a competing webhook/action. Never show an old success
    // snapshot over a newer account state, even if our own POST succeeded.
    const latest = await reconcileSubscriberRow(result.row, deps);
    if (latest.synced) return latest.row;
  } catch {
    console.error("[billing-sync] Could not confirm accepted billing change");
  }
  throw new Error(
    "Your billing request was accepted, but its latest state could not be confirmed. Check Manage billing before trying again.",
  );
}
