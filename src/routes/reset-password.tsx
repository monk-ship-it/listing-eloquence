import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/config";
import { isRecoveryLink } from "@/lib/auth-state";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: `Reset password — ${APP_NAME}` },
      { name: "description", content: `Choose a new password for your ${APP_NAME} account.` },
      { property: "og:title", content: `Reset password — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Choose a new password for your ${APP_NAME} account.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: `Reset password — ${APP_NAME}` },
      {
        name: "twitter:description",
        content: `Choose a new password for your ${APP_NAME} account.`,
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const recoveryLink = isRecoveryLink(window.location.hash);
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setReady(true);
    });
    if (recoveryLink) {
      supabase.auth.getUser().then(({ data, error }) => {
        if (!cancelled && !error && data.user) setReady(true);
      }).catch(() => { if (!cancelled) setReady(false); });
    }
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      navigate({ to: "/app", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

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
          <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? "Choose a new password for your account."
              : "This page needs a valid password reset link from your email. Request a new link if yours has expired."}
          </p>
          {!ready && <Button asChild variant="link" className="mt-2 px-0"><Link to="/auth">Back to sign in</Link></Button>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full min-h-11 sm:min-h-0"
              size="lg"
              disabled={busy || !ready}
            >
              {busy ? "Please wait…" : "Update password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
