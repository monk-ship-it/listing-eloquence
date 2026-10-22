import { identifyPlan } from "./config.server";
import { getStripeSubscription } from "./stripe.server";
import { subscriptionPeriodEnd } from "./billing-state";

type RecordValue = Record<string, any>;
export async function processBillingEvent(event: { type?: string; created?: number; data?: { object?: RecordValue } }, deps?: { db: any; getSubscription: typeof getStripeSubscription }) {
  const checkoutEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  const supported = [...checkoutEvents, "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"];
  if (!supported.includes(event.type ?? "")) return;
  const object = event.data?.object;
  if (!object) throw new Error("Missing event object");
  const checkout = checkoutEvents.includes(event.type ?? "");
  if (checkout && object.mode !== "subscription") return;
  const id = checkout ? object.subscription : event.type?.startsWith("invoice.")
    ? object.subscription ?? object.parent?.subscription_details?.subscription : object.id;
  const subscriptionId = typeof id === "string" ? id : id?.id;
  if (!subscriptionId) {
    if (checkout) return; // e.g. unpaid async checkout without a subscription yet
    throw new Error("Missing subscription identity");
  }
  // Event snapshots may be stale, including paid/failed invoices. Always read current Stripe state.
  const sub = await (deps?.getSubscription ?? getStripeSubscription)(subscriptionId);
  if (sub.id !== subscriptionId) throw new Error("Subscription identity mismatch");
  const price = sub.items?.data?.[0]?.price;
  const plan = identifyPlan({ priceId: price?.id, currency: price?.currency ?? sub.currency });
  const supabaseAdmin = deps?.db ?? (await import("@/integrations/supabase/client.server")).supabaseAdmin;
  const { data: row, error } = await supabaseAdmin.from("subscribers").select("user_id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (error) throw error;
  // Only signed checkout metadata may attach a new subscription, and only for a
  // known Quill price. Never match by billing email/customer.
  const userId = row?.user_id ?? (checkout && plan ? object.client_reference_id ?? object.metadata?.user_id : null);
  if (!userId) return; // unowned, superseded or non-Quill subscriptions never attach
  const fields = {
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    // An unknown price is recorded as-is so access checks deny it (no entitlement)
    // while the owner can still cancel/manage billing.
    stripe_price_id: price?.id ?? null,
    status: sub.status,
    plan: plan ?? "starter",
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_end: subscriptionPeriodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end === true,
  };
  const { error: applyError } = await supabaseAdmin.rpc("apply_billing_event", {
    _user_id: userId, _subscription_id: subscriptionId, _subscription_created: sub.created,
    _event_created: event.created ?? 0, _fields: fields, _checkout: checkout,
  });
  if (applyError) throw applyError;
}