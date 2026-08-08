/**
 * Server-only billing reconciliation.
 *
 * Reads the authoritative subscription state from Stripe using the
 * server-held `stripe_subscription_id` on the subscriber row and persists it
 * with the admin Supabase client. Client-supplied ids are never used.
 *
 * Failures are logged without secrets or customer PII and NEVER overwrite a
 * good database record with guessed values.
 */
import { identifyPlan } from "./config.server";

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
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toIso(seconds: number | null): string | null {
  return seconds == null ? null : new Date(seconds * 1000).toISOString();
}

function firstItem(sub: Record<string, unknown>): Record<string, unknown> | null {
  const items = asRecord(sub.items);
  const data = Array.isArray(items?.data) ? items!.data : [];
  return asRecord(data[0]);
}

/** Stripe moved `current_period_end` onto subscription items; support both. */
function periodEnd(sub: Record<string, unknown>): number | null {
  return num(sub.current_period_end) ?? num(firstItem(sub)?.current_period_end);
}

function priceOf(sub: Record<string, unknown>): Record<string, unknown> | null {
  return asRecord(firstItem(sub)?.price);
}

/** Safe log: subscription id prefix only, no keys, emails or customer PII. */
function logFailure(subscriptionId: string | null, err: unknown): void {
  const message = err instanceof Error ? err.message : "unknown error";
  console.error(
    `[billing-sync] reconciliation failed for subscription ${
      subscriptionId ? `${subscriptionId.slice(0, 12)}…` : "(none)"
    }: ${message.slice(0, 200)}`,
  );
}

export interface ReconcileResult {
  /** Row values to trust for access decisions (Stripe values when available). */
  row: SubscriberRow;
  /** True when Stripe was successfully consulted. */
  synced: boolean;
}

/**
 * Reconciles one subscriber row against Stripe.
 *
 * - No `stripe_subscription_id` → nothing to reconcile, row returned as-is.
 * - Stripe unavailable/erroring → row returned unchanged (no guessed writes).
 * - Success → authoritative values persisted via the admin client and returned.
 */
export async function reconcileSubscriberRow(
  row: SubscriberRow | null,
): Promise<ReconcileResult> {
  const current: SubscriberRow = row ?? {};
  const subscriptionId = str(current.stripe_subscription_id);
  const userId = str(current.user_id);
  if (!subscriptionId || !userId) return { row: current, synced: false };

  try {
    const { getStripeSubscription } = await import("./stripe.server");
    const raw = await getStripeSubscription(subscriptionId);
    const sub = asRecord(raw);
    if (!sub) return { row: current, synced: false };

    const price = priceOf(sub);
    const authoritative: SubscriberRow = {
      status: str(sub.status) ?? "canceled",
      cancel_at_period_end: sub.cancel_at_period_end === true,
      trial_end: toIso(num(sub.trial_end)),
      current_period_end: toIso(periodEnd(sub)),
      stripe_customer_id: str(sub.customer) ?? current.stripe_customer_id ?? null,
      stripe_price_id: str(price?.id) ?? current.stripe_price_id ?? null,
      plan: identifyPlan({
        priceId: str(price?.id),
        amount: num(price?.unit_amount),
      }),
    };

    const changed =
      authoritative.status !== (current.status ?? null) ||
      authoritative.cancel_at_period_end !== (current.cancel_at_period_end ?? false) ||
      authoritative.trial_end !== (current.trial_end ?? null) ||
      authoritative.current_period_end !== (current.current_period_end ?? null) ||
      authoritative.stripe_customer_id !== (current.stripe_customer_id ?? null) ||
      authoritative.stripe_price_id !== (current.stripe_price_id ?? null) ||
      authoritative.plan !== (current.plan ?? null);

    if (changed) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("subscribers")
        .update({
          status: authoritative.status!,
          cancel_at_period_end: authoritative.cancel_at_period_end!,
          trial_end: authoritative.trial_end,
          current_period_end: authoritative.current_period_end,
          stripe_customer_id: authoritative.stripe_customer_id,
          stripe_price_id: authoritative.stripe_price_id,
          plan: authoritative.plan!,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) {
        logFailure(subscriptionId, new Error(`db update failed: ${error.message}`));
      }
    }

    return { row: { ...current, ...authoritative }, synced: true };
  } catch (err) {
    logFailure(subscriptionId, err);
    return { row: current, synced: false };
  }
}
