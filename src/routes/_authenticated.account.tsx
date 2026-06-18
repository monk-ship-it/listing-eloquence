import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getMySubscription, cancelMySubscription, resumeMySubscription } from "@/lib/subscription.functions";
import { APP_NAME, PRICE_MONTHLY, TRIAL_DAYS, CONTACT_EMAIL, getPlan } from "@/lib/config";
import { CheckCircle2, CreditCard, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: `Account — ${APP_NAME}` }] }),
  component: AccountPage,
});

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  canceled: "Cancelled",
  past_due: "Payment due",
  none: "No subscription",
};

function AccountPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const subFn = useServerFn(getMySubscription);
  const cancelFn = useServerFn(cancelMySubscription);
  const resumeFn = useServerFn(resumeMySubscription);
  const [busy, setBusy] = useState(false);

  const { data: sub, isLoading } = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });

  const status = sub?.status ?? "none";
  const hasAccess = sub?.hasAccess ?? false;
  const inactive = !hasAccess;

  async function cancel() {
    setBusy(true);
    try {
      await cancelFn();
      await qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription will end at the period close.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setBusy(true);
    try {
      await resumeFn();
      await qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription resumed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resume.");
    } finally {
      setBusy(false);
    }
  }

  const plan = getPlan(sub?.plan);


  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      <Card className="mt-8 p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Subscription</h2>
          <Badge variant={hasAccess ? "default" : "secondary"}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : inactive ? (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Start your {TRIAL_DAYS}-day free trial to unlock listing generation. Plans from {PRICE_MONTHLY}/month —
              cancel anytime.
            </p>
            <Button asChild className="mt-5" size="lg">
              <a href="/subscription">
                <CreditCard className="mr-2 h-4 w-4" /> Choose a plan & start free trial
              </a>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Plan" value={`${plan.name} — ${plan.price} / month`} />
              <Info label="Listings" value={`${plan.monthlyListings} per month`} />

              {status === "trialing" ? (
                <Info label="Trial ends" value={fmtDate(sub?.trialEnd ?? null)} />
              ) : (
                <Info
                  label={sub?.cancelAtPeriodEnd ? "Access until" : "Renews on"}
                  value={fmtDate(sub?.currentPeriodEnd ?? null)}
                />
              )}
            </div>

            {sub?.cancelAtPeriodEnd ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Your subscription is set to cancel. You'll keep access until {fmtDate(sub?.currentPeriodEnd ?? null)}.
                </p>
                <Button className="mt-3" variant="outline" onClick={resume} disabled={busy}>
                  Resume subscription
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Active — you have full access.
              </div>
            )}

            {!sub?.cancelAtPeriodEnd && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground" disabled={busy}>
                    Cancel subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll keep access until the end of your current billing period
                      {sub?.currentPeriodEnd ? ` (${fmtDate(sub.currentPeriodEnd)})` : ""}. You can resume
                      anytime before then.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={cancel}>Confirm cancellation</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </Card>

      <Card className="mt-6 p-7">
        <h2 className="font-display text-xl font-semibold">Need help?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Questions about billing or your account? Get in touch and we'll help.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
        </a>
      </Card>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
