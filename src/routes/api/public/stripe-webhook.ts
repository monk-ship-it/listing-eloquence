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

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook not configured", { status: 500 });
        }

        const sig = request.headers.get("stripe-signature") ?? "";
        const payload = await request.text();

        if (!verifyStripeSignature(payload, sig, secret)) {
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
            const userId: string | null = session.client_reference_id ?? null;
            const customerId: string | null = session.customer ?? null;
            const subscriptionId: string | null = session.subscription ?? null;
            const email: string | null =
              session.customer_details?.email ?? session.customer_email ?? null;

            let status = "active";
            let trialEnd: string | null = null;
            let periodEnd: string | null = null;
            let cancelAtPeriodEnd = false;

            if (subscriptionId) {
              const { getStripeSubscription } = await import("@/lib/stripe.server");
              const sub = await getStripeSubscription(subscriptionId);
              status = sub.status;
              trialEnd = toIso(sub.trial_end);
              periodEnd = toIso(sub.current_period_end);
              cancelAtPeriodEnd = !!sub.cancel_at_period_end;
            }

            if (userId) {
              await supabaseAdmin
                .from("subscribers")
                .update({
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  status,
                  trial_end: trialEnd,
                  current_period_end: periodEnd,
                  cancel_at_period_end: cancelAtPeriodEnd,
                  ...(email ? { email } : {}),
                })
                .eq("user_id", userId);
            } else if (customerId) {
              await supabaseAdmin
                .from("subscribers")
                .update({
                  stripe_subscription_id: subscriptionId,
                  status,
                  trial_end: trialEnd,
                  current_period_end: periodEnd,
                  cancel_at_period_end: cancelAtPeriodEnd,
                })
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

            await supabaseAdmin
              .from("subscribers")
              .update({
                status,
                trial_end: toIso(sub.trial_end),
                current_period_end: toIso(sub.current_period_end),
                cancel_at_period_end: !!sub.cancel_at_period_end,
              })
              .eq("stripe_subscription_id", sub.id);
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
