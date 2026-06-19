import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

type StripeRecord = Record<string, unknown>;

function asRecord(value: unknown): StripeRecord | null {
  return typeof value === "object" && value !== null ? (value as StripeRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function firstSubscriptionPrice(sub: unknown): StripeRecord | null {
  const record = asRecord(sub);
  const items = asRecord(record?.items);
  const firstItem = asRecord(asArray(items?.data)[0]);
  return asRecord(firstItem?.price);
}

/** Extract the recurring amount (in pence) from a subscription object. */
function amountFromSubscription(sub: unknown): number | null {
  return numberValue(firstSubscriptionPrice(sub)?.unit_amount);
}

/** Extract the Stripe price id from a subscription object. */
function priceFromSubscription(sub: unknown): string | null {
  return stringValue(firstSubscriptionPrice(sub)?.id);
}

function priceFromCheckoutSession(session: StripeRecord): string | null {
  const metadata = asRecord(session.metadata);
  const lineItems = asRecord(session.line_items);
  const firstLineItem = asRecord(asArray(lineItems?.data)[0]);
  const lineItemPrice = asRecord(firstLineItem?.price);
  const firstDisplayItem = asRecord(asArray(session.display_items)[0]);
  const displayItemPrice = asRecord(firstDisplayItem?.price);

  return (
    stringValue(metadata?.price_id) ??
    stringValue(lineItemPrice?.id) ??
    stringValue(displayItemPrice?.id) ??
    null
  );
}

function amountFromCheckoutSession(session: StripeRecord): number | null {
  const lineItems = asRecord(session.line_items);
  const firstLineItem = asRecord(asArray(lineItems?.data)[0]);
  const lineItemPrice = asRecord(firstLineItem?.price);
  const firstDisplayItem = asRecord(asArray(session.display_items)[0]);

  return (
    numberValue(session.amount_total) ??
    numberValue(lineItemPrice?.unit_amount) ??
    numberValue(firstDisplayItem?.amount) ??
    null
  );
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretEnv = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secretEnv) {
          return new Response("Webhook not configured", { status: 500 });
        }
        // Support multiple endpoint signing secrets (comma/whitespace separated).
        const secrets = secretEnv.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

        const sig = request.headers.get("stripe-signature") ?? "";
        const payload = await request.text();

        if (!secrets.some((secret) => verifyStripeSignature(payload, sig, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // Only act on subscription-mode checkouts.
            if (session.mode && session.mode !== "subscription") {
              return new Response(JSON.stringify({ received: true, ignored: "mode" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            // Match the user by client_reference_id first; metadata is a fallback.
            const userId: string | null =
              session.client_reference_id ?? session.metadata?.user_id ?? null;
            const customerId: string | null = session.customer ?? null;
            const subscriptionId: string | null = session.subscription ?? null;
            const email: string | null =
              session.customer_details?.email ?? session.customer_email ?? null;
            const paymentLinkId: string | null = session.payment_link ?? null;

            const { identifyPlan } = await import("@/lib/config.server");

            let status = "active";
            let trialEnd: string | null = null;
            let periodEnd: string | null = null;
            let cancelAtPeriodEnd = false;
            let priceId: string | null = priceFromCheckoutSession(session);
            let amount: number | null = amountFromCheckoutSession(session);

            if (subscriptionId) {
              try {
                const { getStripeSubscription } = await import("@/lib/stripe.server");
                const sub = await getStripeSubscription(subscriptionId);
                status = sub.status;
                trialEnd = toIso(sub.trial_end);
                periodEnd = toIso(sub.current_period_end);
                cancelAtPeriodEnd = !!sub.cancel_at_period_end;
                priceId = priceFromSubscription(sub) ?? priceId;
                amount = amountFromSubscription(sub) ?? amount;
              } catch (err) {
                console.warn(
                  "Stripe subscription lookup failed; recording checkout payload only:",
                  err,
                );
              }
            }

            // Plan from payment link id first, then price id, then amount.
            const plan = identifyPlan({ paymentLinkId, priceId, amount });

            const fields = {
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              stripe_payment_link_id: paymentLinkId,
              status,
              plan,
              trial_end: trialEnd,
              current_period_end: periodEnd,
              cancel_at_period_end: cancelAtPeriodEnd,
              updated_at: new Date().toISOString(),
            };

            // Idempotent: keyed UPDATE on an existing row, so duplicate
            // webhook deliveries simply re-apply the same values.
            // Match by user id (client_reference_id) first, then email,
            // then customer id.
            if (userId) {
              await supabaseAdmin
                .from("subscribers")
                .update({ ...fields, ...(email ? { email } : {}) })
                .eq("user_id", userId);
            } else if (email) {
              await supabaseAdmin
                .from("subscribers")
                .update(fields)
                .eq("email", email);
            } else if (customerId) {
              await supabaseAdmin
                .from("subscribers")
                .update(fields)
                .eq("stripe_customer_id", customerId);
            }
          } else if (
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.created" ||
            event.type === "customer.subscription.deleted"
          ) {
            const sub = event.data.object;
            const status =
              event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
            const userId: string | null = sub.metadata?.user_id ?? null;

            const { identifyPlan } = await import("@/lib/config.server");
            const priceId = priceFromSubscription(sub);
            const plan = identifyPlan({
              priceId,
              amount: amountFromSubscription(sub),
            });

            const fields = {
              stripe_customer_id: sub.customer ?? null,
              stripe_subscription_id: sub.id,
              stripe_price_id: priceId,
              status,
              plan,
              trial_end: toIso(sub.trial_end),
              current_period_end: toIso(sub.current_period_end),
              cancel_at_period_end: !!sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            };

            // Prefer matching by subscription id; fall back to user id from metadata.
            const { data: updated } = await supabaseAdmin
              .from("subscribers")
              .update(fields)
              .eq("stripe_subscription_id", sub.id)
              .select("user_id");

            if ((!updated || updated.length === 0) && userId) {
              await supabaseAdmin
                .from("subscribers")
                .update(fields)
                .eq("user_id", userId);
            }
          } else if (event.type === "invoice.paid") {
            // Payment succeeded — ensure the subscription is active and clear
            // any prior failure state.
            const invoice = event.data.object;
            const subscriptionId: string | null = invoice.subscription ?? null;
            const periodEnd = toIso(invoice.lines?.data?.[0]?.period?.end);
            if (subscriptionId) {
              await supabaseAdmin
                .from("subscribers")
                .update({
                  status: "active",
                  ...(periodEnd ? { current_period_end: periodEnd } : {}),
                })
                .eq("stripe_subscription_id", subscriptionId)
                .in("status", ["past_due", "unpaid", "incomplete", "active", "trialing"]);
            }
          } else if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object;
            const subscriptionId: string | null = invoice.subscription ?? null;
            if (subscriptionId) {
              await supabaseAdmin
                .from("subscribers")
                .update({ status: "past_due" })
                .eq("stripe_subscription_id", subscriptionId);
            }
          }
        } catch (err) {
          console.error("Webhook handler error:", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
