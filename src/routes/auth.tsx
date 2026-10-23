import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { APP_NAME, TRIAL_DAYS, getPlan, planPriceDisplay, type PlanId } from "@/lib/config";

const VALID_PLANS: PlanId[] = ["starter", "pro", "growth"];

import { sanitizeAuthNext as sanitizeNext, resolveAuthMode, resolveSameOriginNext } from "@/lib/auth-state";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { plan?: PlanId; next?: string; mode?: "login" | "signup" } => {
    const plan = search.plan as string | undefined;
    const out: { plan?: PlanId; next?: string; mode: "login" | "signup" } = {
      mode: resolveAuthMode(search.mode, search.plan),
    };
    if (plan && VALID_PLANS.includes(plan as PlanId)) out.plan = plan as PlanId;
    const next = sanitizeNext(search.next);
    if (next) out.next = next;
    return out;
  },
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      {
        name: "description",
        content: `Sign in or create your ${APP_NAME} account to generate AI property listings.`,
      },
      { property: "og:title", content: `Sign in — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Sign in or create your ${APP_NAME} account to generate AI property listings.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://copybymonk.com/auth" },
      { name: "twitter:title", content: `Sign in — ${APP_NAME}` },
      {
        name: "twitter:description",
        content: `Sign in or create your ${APP_NAME} account to generate AI property listings.`,
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://copybymonk.com/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { plan: planParam, next, mode: requestedMode } = Route.useSearch();
  const plan: PlanId = planParam ?? "starter";
  const mode = resolveAuthMode(requestedMode, planParam);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);
  const redirectedRef = useRef(false);

  function goPostAuth() {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const safeNext = next ? resolveSameOriginNext(next, window.location.origin) : undefined;
    if (safeNext) {
      // Re-validated against the resolved origin before a full-page navigation.
      window.location.href = safeNext;
      return;
    }
    navigate({ to: "/subscription", search: { plan } });
  }

  useEffect(() => {
    if (!loading && user) goPostAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}/auth?plan=${plan}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!signUpData.session) {
          // Email confirmation required: the confirmation link returns them
          // to /subscription with the chosen plan.
          setCheckInbox(true);
          return;
        }
        toast.success("Account created — taking you to the next step.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      goPostAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      toast.error("Enter your email above first, then tap “Forgot password?”.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your inbox for a password reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  const selectedPlan = planParam ? getPlan(planParam) : null;
  const isStarterPlan = plan === "starter";

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Logo showText />
          </Link>
        </div>
        <Card className="border-border/70 bg-card/80 p-7 backdrop-blur">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setCheckInbox(false);
              navigate({
                to: "/auth",
                search: { plan: planParam, next, mode: resolveAuthMode(v, planParam) },
                replace: true,
              });
            }}
          >
            <TabsList className="grid w-full grid-cols-2 h-auto sm:h-9">
              <TabsTrigger value="signup" className="min-h-11 sm:min-h-0">
                {isStarterPlan ? "Start free trial" : "Create account"}
              </TabsTrigger>
              <TabsTrigger value="login" className="min-h-11 sm:min-h-0">
                Log in
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-6">
              {mode === "signup" && <h1 className="font-display text-2xl font-semibold">Create your account</h1>}
              <p className="mt-1 text-sm text-muted-foreground">
                {isStarterPlan ? (
                  <>
                    Eligible first-time subscribers can start a {TRIAL_DAYS}-day Starter trial at secure checkout — card
                    required. Cancel before it ends to avoid the first charge.
                  </>
                ) : (
                  <>
                    Create your account, then continue to secure checkout for {getPlan(plan).name}. Payment is due at
                    checkout and renews monthly. Cancel anytime from your account.
                  </>
                )}
              </p>
              {selectedPlan && (
                <p className="mt-2 text-sm font-medium text-foreground">
                  {selectedPlan.name} · {planPriceDisplay(selectedPlan.id)}/month
                  {isStarterPlan ? ` after an eligible ${TRIAL_DAYS}-day trial` : " · paid at checkout"}
                </p>
              )}
            </TabsContent>
            <TabsContent value="login" className="mt-6">
              {mode === "login" && <h1 className="font-display text-2xl font-semibold">Welcome back</h1>}
              <p className="mt-1 text-sm text-muted-foreground">Log in to keep writing.</p>
            </TabsContent>

            {checkInbox ? (
              <div className="mt-6 rounded-md border border-border/70 p-4 text-sm" role="status">
                <p className="font-medium">Check your inbox to confirm your email</p>
                <p className="mt-1 text-muted-foreground">
                  We sent a confirmation link to {email}. Open it to continue to checkout.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agency.co.uk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <Button type="submit" className="w-full min-h-11 sm:min-h-0" size="lg" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
                </Button>
                {mode === "login" && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleForgot}
                    disabled={busy}
                    className="w-full text-center text-sm text-muted-foreground min-h-11 sm:min-h-0 underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Button>
                )}
              </form>
            )}
          </Tabs>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>Access your saved listings and manage your subscription from your account.</>
          ) : isStarterPlan ? (
            <>
              The {TRIAL_DAYS}-day Starter trial is for eligible first-time subscribers and requires a card. Cancel
              anytime before renewal; access continues until your period ends.
            </>
          ) : (
            <>
              {getPlan(plan).name} costs {planPriceDisplay(plan)}/month, paid at checkout. Cancel anytime before
              renewal; access continues until your period ends.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
