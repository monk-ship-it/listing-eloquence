import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMySubscription, getMyUsage, createBillingPortalUrl } from "@/lib/subscription.functions";
import { APP_NAME, PLANS, getPlan, TRIAL_DAYS, buildCheckoutUrl } from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  CreditCard,
  ArrowLeft,
  
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({ meta: [{ title: `Subscription — ${APP_NAME}` }] }),
  component: SubscriptionPage,
});

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  trialing: {
    label: "Free trial",
    variant: "default",
    icon: <Clock className="h-4 w-4" />,
  },
  active: {
    label: "Active",
    variant: "default",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  past_due: {
    label: "Payment past due",
    variant: "destructive",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  unpaid: {
    label: "Payment unpaid",
    variant: "destructive",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  canceled: {
    label: "Cancelled",
    variant: "secondary",
    icon: <XCircle className="h-4 w-4" />,
  },
  none: {
    label: "No subscription",
    variant: "secondary",
    icon: <XCircle className="h-4 w-4" />,
  },
};

function SubscriptionPage() {
  const { user } = useAuth();
  const subFn = useServerFn(getMySubscription);
  const usageFn = useServerFn(getMyUsage);
  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subFn(),
  });
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });

  const portalFn = useServerFn(createBillingPortalUrl);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);

  // Calm message if the user came back from a cancelled checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancelled") {
      toast("Checkout cancelled. No payment was taken.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const { url } = await portalFn({ data: { returnUrl: window.location.href } });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing portal.");
      setPortalLoading(false);
    }
  }

  const status = sub?.status ?? "none";
  const rawStatus = sub?.rawStatus ?? "none";
  const hasAccess = sub?.hasAccess ?? false;
  const meta = STATUS_META[status] ?? STATUS_META.none;
  const remaining = daysLeft(sub?.currentPeriodEnd ?? null);
  const currentPlan = getPlan(sub?.plan);

  function startCheckout(planId: typeof PLANS[number]["id"] = currentPlan.id) {
    if (!user) {
      toast.error("Please log in to continue to checkout.");
      return;
    }
    setCheckoutBusy(planId);
    try {
      // Redirect to the plan's Stripe Payment Link with the logged-in user's
      // id attached as client_reference_id so the webhook activates the
      // correct account.
      window.location.href = buildCheckoutUrl(user.id, user.email ?? "", planId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setCheckoutBusy(null);
    }
  }


  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link
        to="/account"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to account
      </Link>

      <h1 className="font-display mt-4 text-3xl font-semibold">Subscription status</h1>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Access banner */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  hasAccess ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {hasAccess ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {hasAccess ? "You currently have access" : "You do not have access"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sub?.isComped
                    ? "Complimentary access — no billing"
                    : hasAccess && (rawStatus === "past_due" || rawStatus === "unpaid")
                      ? `Grace period active — access continues until ${fmtDate(sub?.currentPeriodEnd ?? null)}`
                      : hasAccess && status === "trialing"
                        ? `Free trial — ends ${fmtDate(sub?.trialEnd ?? null)}`
                        : hasAccess
                          ? `Full access — ${status === "active" && sub?.cancelAtPeriodEnd ? "cancelling at period end" : "renewing automatically"}`
                          : "Subscribe to restore access"}
                </p>
              </div>
            </div>
          </Card>

          {/* Details card */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">Details</h2>
            <Separator className="my-4" />
            <div className="space-y-4">
              <Row
                label="Status"
                value={
                  <Badge variant={meta.variant} className="gap-1">
                    {meta.icon}
                    {meta.label}
                  </Badge>
                }
              />
              {sub?.isComped && (
                <Row
                  label="Plan"
                  value={
                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                      <Crown className="h-4 w-4 text-primary" /> Complimentary
                    </span>
                  }
                />
              )}
              {!sub?.isComped && (
                <Row
                  label="Plan"
                  value={`${currentPlan.name} — ${currentPlan.price} / month`}
                />
              )}
              {!sub?.isComped && usage && (
                <Row
                  label="Listings this month"
                  value={
                    <span className="text-sm">
                      {usage.used} of {usage.limit} used
                      <span className="ml-2 text-xs text-muted-foreground">
                        (renews {fmtDate(usage.resetsOn)})
                      </span>
                    </span>
                  }
                />
              )}
              {status === "trialing" && (
                <Row
                  label="Trial ends"
                  value={
                    <span className="text-sm">
                      {fmtDate(sub?.trialEnd ?? null)}
                      {remaining !== null && (
                        <span className="ml-2 text-xs text-muted-foreground">({remaining} days left)</span>
                      )}
                    </span>
                  }
                />
              )}
              {status !== "trialing" && (
                <Row
                  label={sub?.cancelAtPeriodEnd ? "Access until" : "Next billing date"}
                  value={
                    <span className="text-sm">
                      {fmtDate(sub?.currentPeriodEnd ?? null)}
                      {remaining !== null && status !== "none" && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({remaining} days left)
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              {(rawStatus === "past_due" || rawStatus === "unpaid") && (
                <Row
                  label="Grace period"
                  value={
                    <span className="text-sm text-amber-600">
                      <AlertTriangle className="mr-1 inline h-4 w-4" />
                      Access continues until {fmtDate(sub?.currentPeriodEnd ?? null)}
                    </span>
                  }
                />
              )}
              {sub?.cancelAtPeriodEnd && status !== "none" && (
                <Row
                  label="Cancellation"
                  value={
                    <span className="text-sm text-muted-foreground">
                      Set to cancel — access ends {fmtDate(sub?.currentPeriodEnd ?? null)}
                    </span>
                  }
                />
              )}
            </div>
          </Card>

          {/* Plans */}
          {!sub?.isComped && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold">
                {hasAccess ? "Change your plan" : "Choose a plan"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Listings renew at the start of each month. {TRIAL_DAYS}-day free trial on the Growth plan.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {PLANS.map((plan) => {
                  const isCurrent = hasAccess && plan.id === currentPlan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col rounded-lg border p-4 ${
                        isCurrent ? "border-primary bg-primary/5" : "border-border/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display text-base font-semibold">{plan.name}</p>
                        {isCurrent && <Badge variant="default">Current</Badge>}
                      </div>
                      <p className="mt-1 font-display text-2xl font-semibold">
                        {plan.price}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                      <p className="mt-1 text-xs text-primary">{plan.monthlyListings} listings / month</p>
                      <Button
                        className="mt-4 w-full"
                        size="sm"
                        variant={isCurrent ? "outline" : "default"}
                        disabled={isCurrent || checkoutBusy !== null}
                        onClick={() => startCheckout(plan.id)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {checkoutBusy === plan.id
                          ? "Starting…"
                          : isCurrent
                            ? "Current plan"
                            : hasAccess
                              ? "Switch"
                              : plan.id === "growth"
                                ? "Start trial"
                                : "Subscribe"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {hasAccess && !sub?.isComped && status !== "trialing" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold">Billing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your payment method, view invoices, or cancel your
                subscription in the secure Stripe billing portal. Any change is
                reflected here automatically.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                disabled={portalLoading}
                onClick={openBillingPortal}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {portalLoading ? "Opening…" : "Manage or cancel subscription"}
              </Button>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
