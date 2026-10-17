import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === "t") timestamp = v;
    else if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;

  // Replay protection: reject signatures older/newer than the tolerance.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"),
  );
  // Accept a match on ANY v1 signature (Stripe sends several during secret rolls).
  return signatures.some((sig) => {
    const b = Buffer.from(sig);
    return b.length === expected.length && timingSafeEqual(expected, b);
  });
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

/** current_period_end now lives on subscription items in newer API versions. */
function subscriptionPeriodEnd(sub: unknown): number | null {
  const record = asRecord(sub);
  const top = numberValue(record?.current_period_end);
  if (top) return top;
  const items = asRecord(record?.items);
  return numberValue(asRecord(asArray(items?.data)[0])?.current_period_end);
}

/** Invoice subscription id: legacy `subscription` or newer `parent.subscription_details`. */
function invoiceSubscriptionId(invoice: StripeRecord): string | null {
  const direct = invoice.subscription;
  if (typeof direct === "string" && direct) return direct;
  const directObj = stringValue(asRecord(direct)?.id);
  if (directObj) return directObj;
  const details = asRecord(asRecord(invoice.parent)?.subscription_details);
  const nested = details?.subscription;
  return stringValue(nested) ?? stringValue(asRecord(nested)?.id);
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
        console.info("Stripe webhook received:", { type: event.type });

        try {
          const { processBillingEvent } = await import("@/lib/billing-webhook.server");
          await processBillingEvent(event as Parameters<typeof processBillingEvent>[0]);
        } catch (err) {
          console.error("Webhook processing failed", err);
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
