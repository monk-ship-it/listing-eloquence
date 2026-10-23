import { identifyPlan } from "./config.server";
import { getStripeSubscription } from "./stripe.server";
import {
  persistSubscriptionSnapshot,
  SUBSCRIBER_COLUMNS,
  type BillingDeps,
  type SubscriberRow,
} from "./billing-sync.server";

type RecordValue = Record<string, any>;
export async function processBillingEvent(
  event: { type?: string; created?: number; data?: { object?: RecordValue } },
  supplied?: BillingDeps,
) {
  const checkoutEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  const supported = [
    ...checkoutEvents,
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
  ];
  if (!supported.includes(event.type ?? "")) return;
  const object = event.data?.object;
  if (!object) throw new Error("Missing event object");
  const checkout = checkoutEvents.includes(event.type ?? "");
  const invoice = event.type?.startsWith("invoice.");
  if (checkout && object.mode !== "subscription") return;
  const id = checkout
    ? object.subscription
    : invoice
      ? (object.subscription ?? object.parent?.subscription_details?.subscription)
      : object.id;
  const subscriptionId = typeof id === "string" ? id : id?.id;
  // This Stripe account hosts other products and one-off invoices. A non-
  // subscription invoice is unrelated and needs no database/provider calls.
  if (!subscriptionId) {
    if (checkout || invoice) return;
    throw new Error("Missing subscription identity");
  }
  const db = supplied?.db ?? (await import("@/integrations/supabase/client.server")).supabaseAdmin;
  const getSubscription = supplied?.getSubscription ?? getStripeSubscription;
  for (let attempt = 0; attempt < 3; attempt++) {
    // Capture the database version BEFORE starting the potentially slow GET.
    const { data: owned, error } = await db
      .from("subscribers")
      .select(SUBSCRIBER_COLUMNS)
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (error) throw error;
    let before: SubscriberRow | null = owned;
    if (!before && checkout) {
      const userId = object.client_reference_id ?? object.metadata?.user_id;
      if (typeof userId !== "string" || !userId) return;
      const { data: candidate, error: readError } = await db
        .from("subscribers")
        .select(SUBSCRIBER_COLUMNS)
        .eq("user_id", userId)
        .maybeSingle();
      if (readError) throw readError;
      before = candidate;
    }
    if (!before) return; // No email/customer/ordinary subscription metadata fallback.
    const sub = await getSubscription(subscriptionId);
    if (sub.id !== subscriptionId) throw new Error("Subscription identity mismatch");
    const price = sub.items?.data?.[0]?.price;
    const plan = identifyPlan({ priceId: price?.id, currency: price?.currency ?? sub.currency });
    if (!owned && !plan) return;
    const result = await persistSubscriptionSnapshot(db, before, sub, {
      checkout,
      eventCreated: event.created ?? 0,
    });
    if (result.applied) return;
    // An older event or superseded subscription is intentionally ignored.
    // A changed version needs a fresh GET, never a retry of the stale response.
    if (
      result.row.updated_at === before.updated_at ||
      (result.row.stripe_subscription_id === subscriptionId &&
        (event.created ?? 0) < (result.row.stripe_event_created ?? 0))
    )
      return;
    if (result.row.stripe_subscription_id !== subscriptionId && !checkout) return;
  }
  throw new Error("Concurrent billing update; retry the webhook");
}
