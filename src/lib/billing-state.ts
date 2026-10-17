/** Cancellation remains available even when payment problems restrict generation. */
export function canCancelSubscription(status: string, subscriptionId: string | null | undefined): boolean {
  return !!subscriptionId && !["none", "canceled", "incomplete_expired"].includes(status);
}

/** Stripe supports both older subscription-level and newer item-level period dates. */
export function subscriptionPeriodEnd(raw: Record<string, unknown>): string | null {
  const items = raw.items as { data?: Array<{ current_period_end?: unknown }> } | undefined;
  const end = raw.current_period_end ?? items?.data?.[0]?.current_period_end;
  if (typeof end !== "number" || !Number.isFinite(end)) return null;
  const date = new Date(end * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function safeBillingReturnUrl(value: string, appUrl: string): string {
  try {
    const url = new URL(value);
    const allowed = new Set([new URL(appUrl).origin, "https://copybymonk.com", "https://www.copybymonk.com", "https://listing-eloquence.lovable.app"]);
    if (allowed.has(url.origin) && !url.username && !url.password) return `${url.origin}/subscription`;
  } catch { /* Fall back to the configured application. */ }
  return `${appUrl.replace(/\/+$/, "")}/subscription`;
}