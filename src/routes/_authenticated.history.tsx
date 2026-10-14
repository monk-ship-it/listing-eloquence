import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { APP_NAME } from "@/lib/config";
import {
  listMyGenerations,
  deleteGeneration,
  type GenerationRecord,
} from "@/lib/generations.functions";
import { ListingPack } from "@/components/pack/ListingPack";
import { WorkbenchExportMenu } from "@/components/admin/WorkbenchExportMenu";
import { coerceLegacyInput } from "@/lib/listing-types";
import { Trash2, FileText, ChevronDown, ChevronUp, Loader2, Plus, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: `Saved listings — ${APP_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HistoryPage,
});

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function HistoryPage() {
  const listFn = useServerFn(listMyGenerations);
  const delFn = useServerFn(deleteGeneration);
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const PAGE = 100;
  const [limit, setLimit] = useState(PAGE);
  // Fetch one extra row so we know whether a "Load more" is needed.
  const query = useQuery({
    queryKey: ["generations", limit],
    queryFn: () => listFn({ data: { limit: limit + 1 } }),
    placeholderData: (prev) => prev,
  });

  async function remove(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await delFn({ data: { id } });
      // Only remove from cache after the server confirms the delete.
      qc.setQueryData<GenerationRecord[]>(["generations", limit], (prev) =>
        (prev ?? []).filter((x) => x.id !== id),
      );
      if (!res.deleted) toast.info("That listing was already removed.");
      else toast.success("Listing deleted.");
      qc.invalidateQueries({ queryKey: ["generations"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete the listing.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  const allItems = query.data ?? [];
  const hasMore = allItems.length > limit;
  const items = hasMore ? allItems.slice(0, limit) : allItems;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5">
      <h1 className="font-display text-3xl font-semibold">Saved listings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every listing you generate is stored here. Expand to view, copy or delete.
      </p>

      {query.isLoading ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">Couldn't load your saved listings.</p>
          <Button size="sm" onClick={() => query.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="mt-8 flex min-h-[220px] flex-col items-center justify-center gap-4 p-10 text-center">
          <FileText className="h-8 w-8 text-primary/60" />
          <div>
            <p className="text-sm text-muted-foreground">No saved listings yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generated packs appear here automatically.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/app">
              <Plus className="mr-2 h-4 w-4" /> Create a listing
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              open={openId === item.id}
              deleting={deletingId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onDelete={() => remove(item.id)}
            />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 sm:min-h-0"
                disabled={query.isFetching}
                onClick={() => setLimit((l) => l + PAGE)}
              >
                {query.isFetching ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/5 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
      </div>
    </Card>
  );
}

function HistoryItem({
  item,
  open,
  deleting,
  onToggle,
  onDelete,
}: {
  item: GenerationRecord;
  open: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const panelId = `history-panel-${item.id}`;
  const dateLabel = formatDate(item.createdAt);
  const inputs = useMemo(() => coerceLegacyInput(item.inputs), [item.inputs]);
  const qc = useQueryClient();
  const onGenerated = (output: GenerationRecord["output"]) => {
    qc.setQueriesData<GenerationRecord[]>({ queryKey: ["generations"] }, (prev) =>
      prev?.map((g) => (g.id === item.id ? { ...g, output } : g)),
    );
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-[44px] min-w-0 items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted/60 text-muted-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {item.propertyTitle ?? "Untitled property"}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span>{dateLabel}</span>
              <span aria-hidden="true">·</span>
              <Badge variant="secondary" className="max-w-[9rem] truncate capitalize">
                {item.voice}
              </Badge>
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1">
        <WorkbenchExportMenu
          generationId={item.id}
          storedPromptVersion={item.output.meta?.promptVersion ?? null}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Delete listing: ${item.propertyTitle ?? "Untitled property"}`}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the saved listing. Your monthly usage stays the same —
                deletion doesn't refund a generation. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      {open && (
        <div id={panelId} className="border-t border-border/60 p-4 sm:p-5">
          <ListingPack
            output={item.output}
            input={inputs}
            generationId={item.id}
            onOutputChange={onGenerated}
          />
        </div>
      )}
    </Card>
  );
}
