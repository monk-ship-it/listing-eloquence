import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { copyText, buildCopyAllText, formatKeyFeaturesBlock } from "@/lib/clipboard";
import {
  Copy,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: `Saved listings — ${APP_NAME}` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: HistoryPage,
});

async function doCopy(text: string, label = "Copied to clipboard.") {
  const ok = await copyText(text);
  if (ok) toast.success(label);
  else toast.error("Couldn't copy — please copy manually.");
}

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

  const query = useQuery({ queryKey: ["generations"], queryFn: () => listFn() });

  async function remove(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    // Optimistic removal
    const previous = qc.getQueryData<GenerationRecord[]>(["generations"]);
    qc.setQueryData<GenerationRecord[]>(["generations"], (prev) =>
      (prev ?? []).filter((x) => x.id !== id),
    );
    try {
      const res = await delFn({ data: { id } });
      if (!res.deleted) {
        toast.info("That listing was already removed.");
      } else {
        toast.success("Listing deleted.");
      }
      qc.invalidateQueries({ queryKey: ["generations"] });
    } catch (err) {
      // Roll back optimistic update
      if (previous) qc.setQueryData(["generations"], previous);
      const msg = err instanceof Error ? err.message : "Could not delete the listing.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  const items = query.data ?? [];

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
  const features = item.output.keyFeatures ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-3 sm:p-4">
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

      {open && (
        <div id={panelId} className="border-t border-border/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 break-words font-display text-lg font-semibold leading-tight">
              {item.output.headline}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              title="Copy full pack"
              aria-label="Copy full listing pack"
              onClick={() => doCopy(buildCopyAllText(item.output), "Full pack copied.")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {features.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Key features
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Copy key features"
                  onClick={() => doCopy(formatKeyFeaturesBlock(features), "Key features copied.")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="break-words">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Copy description"
                onClick={() => doCopy(item.output.listing, "Description copied.")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {item.output.listing.split("\n\n").map((p, i) => (
                <p key={i} className="break-words">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {item.output.summary && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Teaser summary
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Copy teaser summary"
                  onClick={() => doCopy(item.output.summary, "Teaser copied.")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-1 break-words rounded-lg bg-muted/50 p-3 text-sm">
                {item.output.summary}
              </p>
            </div>
          )}

          {item.output.social && item.output.social.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Social pack
              </h3>
              <div className="mt-2 space-y-3">
                {item.output.social.map((post, i) => {
                  const tags = (post.hashtags ?? [])
                    .map((t) => `#${t.replace(/^#/, "")}`)
                    .join(" ");
                  return (
                    <div key={i} className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary">{post.platform}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          aria-label={`Copy ${post.platform} post`}
                          onClick={() =>
                            doCopy(`${post.caption}${tags ? `\n\n${tags}` : ""}`, "Post copied.")
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="mt-2 break-words text-sm">{post.caption}</p>
                      {tags && (
                        <p className="mt-2 break-words text-xs text-primary">{tags}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
