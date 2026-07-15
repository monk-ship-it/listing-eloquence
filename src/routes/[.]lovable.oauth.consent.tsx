import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";

// Beta namespace: local typed wrapper for the three helpers we use.
type OAuthDetailsResult = {
  data: {
    client?: { name?: string; redirect_uri?: string } | null;
    scope?: string;
    redirect_url?: string;
    redirect_to?: string;
  } | null;
  error: { message: string } | null;
};
type OAuthDecisionResult = {
  data: { redirect_url?: string; redirect_to?: string } | null;
  error: { message: string } | null;
};
interface SupabaseAuthOAuth {
  getAuthorizationDetails(id: string): Promise<OAuthDetailsResult>;
  approveAuthorization(id: string): Promise<OAuthDecisionResult>;
  denyAuthorization(id: string): Promise<OAuthDecisionResult>;
}
function oauthApi(): SupabaseAuthOAuth {
  return (supabase.auth as unknown as { oauth: SupabaseAuthOAuth }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="max-w-md p-6">
        <h1 className="font-display text-xl font-semibold">Couldn't load this request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </Card>
    </div>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthApi().approveAuthorization(authorization_id)
      : await oauthApi().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo showText />
        </div>
        <Card className="border-border/70 bg-card/80 p-7 backdrop-blur">
          <h1 className="font-display text-2xl font-semibold">
            Connect {clientName} to your Quill account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This lets {clientName} use Quill as you — it can read your listing history through
            Quill's tools. Your Quill permissions still apply.
          </p>
          {details?.client?.redirect_uri && (
            <p className="mt-3 text-xs text-muted-foreground break-all">
              Redirects to: {details.client.redirect_uri}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <Button className="flex-1" size="lg" disabled={busy} onClick={() => decide(true)}>
              {busy ? "Please wait…" : "Approve"}
            </Button>
            <Button
              className="flex-1"
              size="lg"
              variant="outline"
              disabled={busy}
              onClick={() => decide(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
