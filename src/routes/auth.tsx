import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { APP_NAME, TRIAL_DAYS, type PlanId } from "@/lib/config";

const VALID_PLANS: PlanId[] = ["starter", "pro", "growth"];

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { plan?: PlanId } => {
    const plan = search.plan as string | undefined;
    return plan && VALID_PLANS.includes(plan as PlanId) ? { plan: plan as PlanId } : {};
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
  const { plan: planParam } = Route.useSearch();
  const plan: PlanId = planParam ?? "starter";
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/subscription", search: { plan } });
  }, [user, loading, navigate, plan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/subscription?plan=${plan}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created — taking you to secure checkout.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: "/subscription", search: { plan } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Start free trial</TabsTrigger>
              <TabsTrigger value="login">Log in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-6">
              <h2 className="font-display text-2xl font-semibold">Create your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The {TRIAL_DAYS}-day Starter trial begins at secure checkout — card required. Cancel
                anytime before renewal from your account.
              </p>

            </TabsContent>
            <TabsContent value="login" className="mt-6">
              <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">Log in to keep writing.</p>
            </TabsContent>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
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
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
              </Button>
            </form>
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
