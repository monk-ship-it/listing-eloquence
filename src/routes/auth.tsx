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
import {
  APP_NAME,
  TRIAL_DAYS,
  getPlan,
  planPriceDisplay,
  resolveMarketId,
  readSavedMarket,
  type PlanId,
  type MarketId,
} from "@/lib/config";

const VALID_PLANS: PlanId[] = ["starter", "pro", "growth"];

// Only allow same-origin, path-only next targets (e.g. /.lovable/oauth/consent?...).
function sanitizeNext(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//"))
    return undefined;
  return value;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { plan?: PlanId; market?: MarketId; next?: string } => {
    const plan = search.plan as string | undefined;
    const out: { plan?: PlanId; market?: MarketId; next?: string } = {};
    if (plan && VALID_PLANS.includes(plan as PlanId)) out.plan = plan as PlanId;
    if (search.market === "us" || search.market === "uk") out.market = search.market as MarketId;
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
      { property: "og:url", content: "https://copybymonk.com/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://copybymonk.com/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { plan: planParam, market: marketParam, next } = Route.useSearch();
  const plan: PlanId = planParam ?? "starter";
  const [savedMarket, setSavedMarket] = useState<MarketId | null>(null);
  useEffect(() => setSavedMarket(readSavedMarket()), []);
  const market: MarketId = marketParam ? resolveMarketId(marketParam) : (savedMarket ?? "uk");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);
  const redirectedRef = useRef(false);

  function goPostAuth() {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (next) {
      // Same-origin relative path (validated above). Use window.location so we
      // land on non-router routes like /.lovable/oauth/consent cleanly.
      window.location.href = next;
      return;
    }
    navigate({ to: "/subscription", search: { plan, market } });
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
        const emailRedirectTo = next
          ? `${window.location.origin}${next}`
          : `${window.location.origin}/subscription?plan=${plan}&market=${market}`;
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!signUpData.session) {
          // Email confirmation required: the confirmation link returns them
          // to /subscription with the chosen plan and market.
          setCheckInbox(true);
          return;
        }
        toast.success("Account created — taking you to the next step.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
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
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 h-auto sm:h-9">
              <TabsTrigger value="signup" className="min-h-11 sm:min-h-0">
                Start free trial
              </TabsTrigger>
              <TabsTrigger value="login" className="min-h-11 sm:min-h-0">
                Log in
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-6">
              {mode === "signup" && (
                <h1 className="font-display text-2xl font-semibold">Create your account</h1>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                The {TRIAL_DAYS}-day Starter trial begins at secure checkout — card required. Cancel
                anytime before renewal from your account.
              </p>
              {selectedPlan && (
                <p className="mt-2 text-sm font-medium text-foreground">
                  {selectedPlan.name} · {planPriceDisplay(selectedPlan.id, market)}/month
                  {selectedPlan.id === "starter" ? ` after your ${TRIAL_DAYS}-day trial` : ""}
                </p>
              )}
            </TabsContent>
            <TabsContent value="login" className="mt-6">
              {mode === "login" && (
                <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
              )}
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
                  <button
                    type="button"
                    onClick={handleForgot}
                    disabled={busy}
                    className="w-full text-center text-sm text-muted-foreground min-h-11 sm:min-h-0 underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </form>
            )}
          </Tabs>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          The {TRIAL_DAYS}-day Starter trial starts at secure checkout — card required. Cancel
          anytime before renewal; access continues until your period ends.
        </p>
      </div>
    </div>
  );
}
