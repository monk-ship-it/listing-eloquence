import { createFileRoute } from "@tanstack/react-router";
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
import { listMyGenerations, deleteGeneration, type GenerationRecord } from "@/lib/generations.functions";
import { Copy, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: `History — ${APP_NAME}` }] }),
  component: HistoryPage,
});

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard.");
}

function HistoryPage() {
  const listFn = useServerFn(listMyGenerations);
  const delFn = useServerFn(deleteGeneration);
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["generations"], queryFn: () => listFn() });

  async function remove(id: string) {
    try {
      await delFn({ data: { id } });
      toast.success("Listing deleted.");
      qc.invalidateQueries({ queryKey: ["generations"] });
    } catch {
      toast.error("Could not delete the listing.");
    }
  }

  const items = query.data ?? [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="font-display text-3xl font-semibold">Saved listings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every listing you generate is stored here. Expand to view, copy or delete.
      </p>

      {query.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="mt-8 flex min-h-[200px] flex-col items-center justify-center p-10 text-center">
          <FileText className="h-8 w-8 text-primary/60" />
          <p className="mt-4 text-sm text-muted-foreground">No saved listings yet.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onDelete={() => remove(item.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function HistoryItem({
  item,
  open,
  onToggle,
  onDelete,
}: {
  item: GenerationRecord;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.propertyTitle ?? "Untitled property"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString("en-GB")}
            </p>
          </div>
        </button>
        <Badge variant="secondary" className="shrink-0">{item.voice}</Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the saved listing. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {open && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{item.output.headline}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copy(`${item.output.headline}\n\n${item.output.listing}`)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {item.output.listing.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {item.output.summary && (
            <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">{item.output.summary}</p>
          )}
        </div>
      )}
    </Card>
  );
}
