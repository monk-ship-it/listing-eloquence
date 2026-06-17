import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/config";
import { amIAdmin, getClaudeModelSetting, saveClaudeModelSetting } from "@/lib/admin.functions";
import { ShieldCheck, RefreshCw, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: `Admin — ${APP_NAME}` }] }),
  component: AdminPage,
});

function AdminPage() {
  const adminFn = useServerFn(amIAdmin);
  const getFn = useServerFn(getClaudeModelSetting);
  const saveFn = useServerFn(saveClaudeModelSetting);
  const navigate = useNavigate();

  const adminQuery = useQuery({ queryKey: ["am-i-admin"], queryFn: () => adminFn() });
  const isAdmin = adminQuery.data ?? false;

  const settingQuery = useQuery({
    queryKey: ["claude-model"],
    queryFn: () => getFn(),
    enabled: isAdmin,
  });

  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settingQuery.data?.model) setModel(settingQuery.data.model);
  }, [settingQuery.data?.model]);

  async function save() {
    setSaving(true);
    try {
      const result = await saveFn({ data: { model } });
      setModel(result.model);
      toast.success("Model validated and saved.");
      settingQuery.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the model.");
    } finally {
      setSaving(false);
    }
  }

  if (adminQuery.isLoading) {
    return <main className="mx-auto max-w-2xl px-5 py-10 text-sm text-muted-foreground">Loading…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have access to this page.</p>
        <Button className="mt-6" onClick={() => navigate({ to: "/app" })}>
          Back to generator
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage the Claude model used for listing generation. Changes are validated with a live test
        request before they're saved.
      </p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-xl font-semibold">Claude model</h2>
        <div className="mt-4 space-y-2">
          <Label>Model ID</Label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="claude-sonnet-4-5-20250929"
          />
          <p className="text-xs text-muted-foreground">
            {settingQuery.data?.updatedAt
              ? `Last updated ${new Date(settingQuery.data.updatedAt).toLocaleString("en-GB")}`
              : "Enter the exact Anthropic model identifier."}
          </p>
        </div>
        <Button className="mt-5" onClick={save} disabled={saving || !model.trim()}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Validating…
            </>
          ) : (
            "Validate & save"
          )}
        </Button>
      </Card>
    </main>
  );
}
