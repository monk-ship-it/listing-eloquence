import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { amIAdmin, exportWorkbenchRequest, type WorkbenchExport } from "@/lib/admin.functions";
import { copyText } from "@/lib/clipboard";
import type { ListingInput } from "@/lib/listing-types";
import { PROMPT_VERSION } from "@/lib/prompts/version.gen";

type Item = "system" | "userCore" | "userMarketing" | "tools" | "variables" | "full";

const LABELS: Record<Item, string> = {
  system: "System",
  userCore: "User (core)",
  userMarketing: "User (marketing)",
  tools: "Tools JSON",
  variables: "Variables JSON",
  full: "Full API request JSON",
};

function pick(x: WorkbenchExport, item: Item): string {
  const core = JSON.parse(x.requests.core);
  const mkt = JSON.parse(x.requests.marketing);
  const ext = x.requests.extract ? JSON.parse(x.requests.extract) : null;
  switch (item) {
    case "system":
      return core.system;
    case "userCore":
      return core.messages[0].content;
    case "userMarketing":
      return mkt.messages[0].content;
    case "tools":
      return JSON.stringify([...core.tools, ...mkt.tools, ...(ext ? ext.tools : [])], null, 2);
    case "variables":
      return JSON.stringify(x.variables, null, 2);
    case "full":
      return JSON.stringify({ core, marketing: mkt, extract: ext }, null, 2);
  }
}

/**
 * Admin-only "Copy for Workbench" dropdown. Renders nothing for non-admins
 * (the server function re-checks the role).
 */
export function WorkbenchExportMenu({
  input,
  generationId,
  storedPromptVersion,
}: {
  input?: ListingInput;
  generationId?: string | null;
  storedPromptVersion?: string | null;
}) {
  const adminFn = useServerFn(amIAdmin);
  const exportFn = useServerFn(exportWorkbenchRequest);
  const adminQuery = useQuery({ queryKey: ["am-i-admin"], queryFn: () => adminFn() });
  const [busy, setBusy] = useState(false);
  if (adminQuery.data !== true) return null;

  const outdated = !!storedPromptVersion && storedPromptVersion !== PROMPT_VERSION;

  const copy = async (item: Item) => {
    setBusy(true);
    try {
      const x = await exportFn({
        data: generationId ? { generationId } : { input },
      });
      const ok = await copyText(pick(x, item));
      if (!ok) throw new Error("copy");
      const stale =
        x.storedPromptVersion && x.storedPromptVersion !== x.promptVersion
          ? ` Note: this listing was made with prompt ${x.storedPromptVersion}; this is today's prompt ${x.promptVersion}.`
          : "";
      toast.success(`Copied ${LABELS[item]} (model ${x.model}).${stale}`);
    } catch {
      toast.error("Couldn't copy the Workbench request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 gap-1.5 sm:min-h-9"
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          Copy for Workbench
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Admin · prompt {PROMPT_VERSION}
        </DropdownMenuLabel>
        {outdated && (
          <p className="px-2 pb-1.5 text-xs text-warning">
            Made with older prompt {storedPromptVersion} — copies use today's prompt.
          </p>
        )}
        <DropdownMenuSeparator />
        {(Object.keys(LABELS) as Item[]).map((k) => (
          <DropdownMenuItem key={k} onSelect={() => void copy(k)}>
            Copy: {LABELS[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
