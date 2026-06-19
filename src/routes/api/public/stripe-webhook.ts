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

interface StripeEvent {
  type?: string;
  data?: {
    object?: unknown;
  };
}

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

function booleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function eventObject(event: StripeEvent): StripeRecord | null {
  return asRecord(event.data?.object);
}

function firstSubscriptionPrice(sub: unknown): StripeRecord | null {
  const record = asRecord(sub);
  const items = asRecord(record?.items);
  const firstItem = asRecord(asArray(items?.data)[0]);
  return asRecord(firstItem?.price);
}

function invoiceLinePeriodEnd(invoice: StripeRecord): number | null {
  const lines = asRecord(invoice.lines);
  const firstLine = asRecord(asArray(lines?.data)[0]);
  const period = asRecord(firstLine?.period);
  return numberValue(period?.end);
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

function logRuntimeSecretPresence() {
  console.info("Stripe webhook runtime secrets:", {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "present" : "missing",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "present" : "missing",
    SUPABASE_URL: process.env.SUPABASE_URL ? "present" : "missing",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "present" : "missing",
  });
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
        const secrets = secretEnv
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        const sig = request.headers.get("stripe-signature") ?? "";
        const payload = await request.text();

        if (!secrets.some((secret) => verifyStripeSignature(payload, sig, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: StripeEvent;
        try {
          event = JSON.parse(payload) as StripeEvent;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        logRuntimeSecretPresence();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.type === "checkout.session.completed") {
            const session = eventObject(event);
            if (!session) return new Response("Invalid payload", { status: 400 });

            // Only act on subscription-mode checkouts.
            const mode = stringValue(session.mode);
            if (mode && mode !== "subscription") {
              return new Response(JSON.stringify({ received: true, ignored: "mode" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            // Match the user by client_reference_id first; metadata is a fallback.
            const metadata = asRecord(session.metadata);
            const customerDetails = asRecord(session.customer_details);
            const userId: string | null =
              stringValue(session.client_reference_id) ?? stringValue(metadata?.user_id);
            const customerId: string | null = stringValue(session.customer);
            const subscriptionId: string | null = stringValue(session.subscription);
            const email: string | null =
              stringValue(customerDetails?.email) ?? stringValue(session.customer_email);
            const paymentLinkId: string | null = stringValue(session.payment_link);

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
              await supabaseAdmin.from("subscribers").update(fields).eq("email", email);
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
            const sub = eventObject(event);
            if (!sub) return new Response("Invalid payload", { status: 400 });

            const subscriptionId = stringValue(sub.id);
            if (!subscriptionId) return new Response("Invalid payload", { status: 400 });

            const status =
              event.type === "customer.subscription.deleted"
                ? "canceled"
                : (stringValue(sub.status) ?? "active");
            const metadata = asRecord(sub.metadata);
            const userId: string | null = stringValue(metadata?.user_id);

            const { identifyPlan } = await import("@/lib/config.server");
            const priceId = priceFromSubscription(sub);
            const plan = identifyPlan({
              priceId,
              amount: amountFromSubscription(sub),
            });

            const fields = {
              stripe_customer_id: stringValue(sub.customer),
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              status,
              plan,
              trial_end: toIso(numberValue(sub.trial_end)),
              current_period_end: toIso(numberValue(sub.current_period_end)),
              cancel_at_period_end: booleanValue(sub.cancel_at_period_end),
              updated_at: new Date().toISOString(),
            };

            // Prefer matching by subscription id; fall back to user id from metadata.
            const { data: updated } = await supabaseAdmin
              .from("subscribers")
              .update(fields)
              .eq("stripe_subscription_id", subscriptionId)
              .select("user_id");

            if ((!updated || updated.length === 0) && userId) {
              await supabaseAdmin.from("subscribers").update(fields).eq("user_id", userId);
            }
          } else if (event.type === "invoice.paid") {
            // Payment succeeded — ensure the subscription is active and clear
            // any prior failure state.
            const invoice = eventObject(event);
            if (!invoice) return new Response("Invalid payload", { status: 400 });

            const subscriptionId: string | null = stringValue(invoice.subscription);
            const periodEnd = toIso(invoiceLinePeriodEnd(invoice));
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
            const invoice = eventObject(event);
            if (!invoice) return new Response("Invalid payload", { status: 400 });

            const subscriptionId: string | null = stringValue(invoice.subscription);
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
