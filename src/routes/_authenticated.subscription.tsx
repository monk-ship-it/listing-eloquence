import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMySubscription, getMyUsage } from "@/lib/subscription.functions";
import { APP_NAME, PLANS, getPlan, TRIAL_DAYS, buildCheckoutUrl } from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  CreditCard,
  ArrowLeft,
  Calendar,
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

  const status = sub?.status ?? "none";
  const rawStatus = sub?.rawStatus ?? "none";
  const hasAccess = sub?.hasAccess ?? false;
  const meta = STATUS_META[status] ?? STATUS_META.none;
  const remaining = daysLeft(sub?.currentPeriodEnd ?? null);
  const currentPlan = getPlan(sub?.plan);

  function startCheckout(planId: typeof PLANS[number]["id"] = currentPlan.id) {
    if (!user) return;
    window.location.href = buildCheckoutUrl(user.id, user.email ?? "", planId);
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
                  value={`${PRICE_MONTHLY} / month`}
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

          {/* Actions */}
          {!hasAccess && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold">Start a subscription</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Begin your {TRIAL_DAYS}-day free trial. Cancel anytime.
              </p>
              <Button className="mt-4" size="lg" onClick={startCheckout}>
                <CreditCard className="mr-2 h-4 w-4" /> Start {TRIAL_DAYS}-day free trial
              </Button>
            </Card>
          )}

          {hasAccess && !sub?.isComped && status !== "trialing" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold">Billing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your subscription, payment method and invoices in your billing portal.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/account">
                  <Calendar className="mr-2 h-4 w-4" /> Go to account settings
                </Link>
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
