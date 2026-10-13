import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { VOICES, type VoiceId } from "@/lib/voices";
import {
  EMPTY_INPUT,
  EXAMPLE_INPUT,
  type ListingInput,
  type ListingOutput,
} from "@/lib/listing-types";
import { generateListing } from "@/lib/listing.functions";
import { getMySubscription, getMyUsage } from "@/lib/subscription.functions";
import { APP_NAME } from "@/lib/config";
import { VoiceNotes } from "@/components/VoiceNotes";
import {
  DictationProvider,
  useDictationContext,
  type DictationSink,
} from "@/components/dictation/DictationProvider";
import { FieldDictationStatus, FieldMic } from "@/components/dictation/FieldMic";
import { FIELD_DEFS, fieldRows, type FieldDef, type TextFieldKey } from "@/lib/listing-fields";
import { extractListingFields } from "@/lib/extract.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailBlastCard, GenerateMarketingButton } from "@/components/EmailBlastCard";
import {
  copyText,
  buildCopyAllText,
  formatKeyFeaturesBlock,
  formatSocialPost,
} from "@/lib/clipboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, Sparkles, RefreshCw, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [{ title: `Generator — ${APP_NAME}` }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: GeneratorPage,
});

async function copyToast(text: string, label = "Copied to clipboard.") {
  const ok = await copyText(text);
  if (ok) toast.success(label);
  else toast.error("Couldn't copy — please copy manually.");
}

function GeneratorPage() {
  return (
    <DictationProvider>
      <GeneratorInner />
    </DictationProvider>
  );
}

function GeneratorInner() {
  const dictation = useDictationContext();
  const extract = useServerFn(extractListingFields);
  const generate = useServerFn(generateListing);
  const subFn = useServerFn(getMySubscription);
  const usageFn = useServerFn(getMyUsage);
  const subQuery = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });
  const usageQuery = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const queryClient = useQueryClient();

  const [input, setInput] = useState<ListingInput>(EMPTY_INPUT);
  const [output, setOutput] = useState<ListingOutput | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  // Snapshot of the details the current pack was generated from.
  const [generatedFrom, setGeneratedFrom] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  // Immediate lock so rapid double-submits can't race the disabled UI state.
  const inFlight = useRef(false);
  // Bumped on every request; late responses whose id doesn't match are ignored.
  const requestId = useRef(0);

  const hasAccess = subQuery.data?.hasAccess ?? false;
  const usage = usageQuery.data;
  const outOfListings = !!usage && !usage.unlimited && usage.remaining <= 0;

  // Latest input, updated synchronously so dictation sinks and Generate never
  // read a stale value while React is still re-rendering.
  const inputRef = useRef<ListingInput>(input);
  // Fields filled from voice notes: key → previous value (for undo).
  const [fromNotes, setFromNotes] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [filling, setFilling] = useState(false);

  function setField(key: TextFieldKey, value: string) {
    inputRef.current = { ...inputRef.current, [key]: value };
    setInput(inputRef.current);
  }

  /** A change the agent typed: also drops any "From notes" chip. */
  function userEdit(key: TextFieldKey, value: string) {
    setField(key, value);
    setFromNotes((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    inputRef.current = { ...inputRef.current, [key]: value };
    setInput(inputRef.current);
  }

  const sinks = useMemo(() => {
    const out = {} as Record<TextFieldKey, DictationSink>;
    for (const d of FIELD_DEFS) {
      out[d.key] = {
        get: () => String(inputRef.current[d.key] ?? ""),
        set: (v: string) => userEdit(d.key, v),
      };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fillFromNotes() {
    if (filling) return;
    const notes = inputRef.current.voiceNotes.trim();
    if (notes.length < 10) return;
    setFilling(true);
    try {
      const res = await extract({ data: { voiceNotes: notes } });
      const filled: Record<string, string> = {};
      const found: Conflict[] = [];
      let firstKey: string | null = null;
      for (const def of FIELD_DEFS) {
        const v = res.fields[def.key];
        if (!v) continue;
        const cur = String(inputRef.current[def.key] ?? "").trim();
        if (!cur) {
          filled[def.key] = "";
          setField(def.key, v);
          firstKey ??= def.key;
        } else if (cur.toLowerCase() !== v.trim().toLowerCase()) {
          found.push({ key: def.key, label: def.label, mine: cur, notes: v });
        }
      }
      setFromNotes((prev) => ({ ...prev, ...filled }));
      setConflicts(found);
      const n = Object.keys(filled).length;
      if (n === 0 && found.length === 0) {
        toast.info("No new details found in your notes.");
      } else {
        toast.success(
          `Filled ${n} field${n === 1 ? "" : "s"}${found.length ? ` · ${found.length} to review` : ""}`,
        );
      }
      if (firstKey && window.matchMedia("(max-width: 1023px)").matches && found.length === 0) {
        requestAnimationFrame(() =>
          document
            .getElementById(`field-${firstKey}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg.includes("EXTRACT_LIMIT_REACHED")
          ? "You've reached today's limit for filling the form from notes. Try again tomorrow."
          : msg.includes("SUBSCRIPTION_REQUIRED")
            ? "Your trial or subscription is required."
            : msg.includes("RATE_LIMIT")
              ? "Lots of requests right now — please wait a moment and try again."
              : msg.includes("AI_TIMEOUT")
                ? "That took too long. Please try again."
                : /^(AI_|MALFORMED)/.test(msg) || !msg
                  ? "Couldn't read your notes just now. Please try again."
                  : msg,
      );
    } finally {
      setFilling(false);
    }
  }

  function resolveConflict(key: string, useNotes: boolean) {
    const c = conflicts.find((x) => x.key === key);
    if (!c) return;
    if (useNotes) {
      setField(c.key, c.notes);
      setFromNotes((prev) => ({ ...prev, [c.key]: c.mine }));
    }
    setConflicts((prev) => prev.filter((x) => x.key !== key));
  }

  function useAllFromNotes() {
    for (const c of conflicts) setField(c.key, c.notes);
    setFromNotes((prev) => ({
      ...prev,
      ...Object.fromEntries(conflicts.map((c) => [c.key, c.mine])),
    }));
    setConflicts([]);
  }

  function undoFromNotes(key: TextFieldKey) {
    const prev = fromNotes[key];
    if (prev === undefined) return;
    setField(key, prev);
    setFromNotes((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  }

  function loadExample() {
    if (inFlight.current) return;
    inputRef.current = EXAMPLE_INPUT;
    setInput(EXAMPLE_INPUT);
    setFromNotes({});
    setConflicts([]);
    setOutput(null);
    setGenerationId(null);
    setGeneratedFrom(null);
    toast.success("Example property loaded.");
  }

  async function run() {
    if (inFlight.current) return;
    inFlight.current = true;
    const myId = ++requestId.current;
    setBusy(true);
    // Let any in-progress dictation finish and land before sending.
    await dictation.finishPending();
    const current = inputRef.current;
    const snapshot = JSON.stringify(current);
    try {
      const result = await generate({ data: current });
      if (myId !== requestId.current) return; // stale response — ignore
      setOutput(result.output);
      setGenerationId(result.generationId);
      setGeneratedFrom(snapshot);
      if (result.output.marketingStatus === "failed") {
        toast.warning(
          "Listing ready. The email & social didn't generate — you can add them free below.",
        );
      }
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      if (result.output.marketingStatus !== "failed") toast.success("Listing generated.");
      // On mobile the results sit below the form — bring them into view.
      requestAnimationFrame(() => {
        if (window.matchMedia("(max-width: 1023px)").matches) {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          resultsRef.current?.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "start",
          });
        }
      });
    } catch (err) {
      if (myId !== requestId.current) return;
      const msg = err instanceof Error ? err.message : "Generation failed.";
      if (msg.includes("SUBSCRIPTION_REQUIRED")) {
        toast.error("Your trial or subscription is required to generate.");
      } else if (msg.includes("LISTING_LIMIT_REACHED")) {
        toast.error(
          "You've used all your listings this month. Upgrade your plan or wait for next month's renewal.",
        );
        queryClient.invalidateQueries({ queryKey: ["usage"] });
      } else if (msg.includes("MALFORMED_AI_OUTPUT") || msg.includes("AI_TRUNCATED")) {
        toast.error(
          "The writer returned an incomplete draft. Please try again — this didn't use a listing.",
        );
      } else if (msg.includes("RATE_LIMIT")) {
        toast.error("Lots of requests right now — please wait a moment and try again.");
      } else if (msg.includes("AI_TIMEOUT")) {
        toast.error("That took too long to write. Please try again.");
      } else if (msg.includes("AI_UNAVAILABLE") || /claude api error/i.test(msg)) {
        toast.error("The listing writer is temporarily unavailable. Please try again shortly.");
      } else {
        toast.error(msg);
      }
    } finally {
      if (myId === requestId.current) setBusy(false);
      inFlight.current = false;
    }
  }

  function requestRegenerate() {
    if (inFlight.current) return;
    if (usage && !usage.unlimited) setConfirmOpen(true);
    else void run();
  }

  function onMarketingGenerated(next: ListingOutput) {
    setOutput(next);
    queryClient.invalidateQueries({ queryKey: ["generations"] });
  }

  const isStale = !!output && generatedFrom !== null && generatedFrom !== JSON.stringify(input);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void run();
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Listing generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the property facts, choose a voice, and generate portal-ready copy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {usage && hasAccess && (
            <div className="rounded-lg border border-border/70 bg-card/50 px-4 py-2 text-right">
              <p className="text-xs text-muted-foreground">{usage.planName} plan</p>
              <p className="text-sm font-semibold">
                {usage.unlimited
                  ? "Unlimited listings"
                  : `${usage.remaining} of ${usage.limit} listings left`}
              </p>
            </div>
          )}
          <Button type="button" variant="outline" onClick={loadExample} disabled={busy}>
            <Sparkles className="mr-2 h-4 w-4" /> Load example
          </Button>
        </div>
      </div>

      {subQuery.isError && (
        <Card className="mt-6 border-destructive/40 bg-destructive/5 p-5" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              We couldn't load your subscription. Check your connection and try again.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 sm:min-h-9"
              onClick={() => subQuery.refetch()}
              disabled={subQuery.isFetching}
            >
              {subQuery.isFetching ? "Retrying…" : "Retry"}
            </Button>
          </div>
        </Card>
      )}

      {!subQuery.isLoading && !subQuery.isError && !hasAccess && (
        <Card className="mt-6 border-primary/40 bg-primary/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <p className="text-sm">Start your free trial to generate listings.</p>
            </div>
            <Button asChild size="sm" className="min-h-11 sm:min-h-0">
              <Link to="/subscription">Start free trial</Link>
            </Button>
          </div>
        </Card>
      )}

      {hasAccess && outOfListings && (
        <Card className="mt-6 border-destructive/40 bg-destructive/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-destructive" />
              <p className="text-sm">
                You've used all {usage?.limit} listings on your {usage?.planName} plan this month.
                It renews on{" "}
                {usage
                  ? new Date(usage.resetsOn).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                    })
                  : ""}
                .
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/subscription">Upgrade plan</Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
            <VoiceNotes
              value={input.voiceNotes}
              onChange={(v) => userEdit("voiceNotes", v)}
              sink={sinks.voiceNotes}
              onFill={fillFromNotes}
              filling={filling}
            />

            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold">Structured property details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Type or paste exact facts below. These are used alongside your voice notes, and take
                priority if anything conflicts.
              </p>

              <div className="mt-5">
                <Label id="voice-label">Brand voice</Label>
                <div
                  role="radiogroup"
                  aria-labelledby="voice-label"
                  className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {VOICES.map((v) => {
                    const selected = input.voice === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-pressed={selected}
                        onClick={() => set("voice", v.id as VoiceId)}
                        className={`rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 hover:border-primary/50"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{v.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {v.descriptor}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {fieldRows(FIELD_DEFS.filter((d) => d.section === "details")).map((row) =>
                  row.length === 1 ? (
                    <DetailField
                      key={row[0].key}
                      def={row[0]}
                      value={String(input[row[0].key] ?? "")}
                      onChange={(v) => userEdit(row[0].key, v)}
                      sink={sinks[row[0].key]}
                      fromNotes={row[0].key in fromNotes}
                      onUndo={() => undoFromNotes(row[0].key)}
                    />
                  ) : (
                    <div
                      key={row[0].key}
                      className={`grid gap-3 ${row.length === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
                    >
                      {row.map((def) => (
                        <DetailField
                          key={def.key}
                          def={def}
                          value={String(input[def.key] ?? "")}
                          onChange={(v) => userEdit(def.key, v)}
                          sink={sinks[def.key]}
                          fromNotes={def.key in fromNotes}
                          onUndo={() => undoFromNotes(def.key)}
                        />
                      ))}
                    </div>
                  ),
                )}
              </div>

              <Button
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={
                  busy ||
                  !hasAccess ||
                  outOfListings ||
                  (dictation.activeKey !== null && dictation.status === "processing")
                }
              >
                {busy ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate listing
                  </>
                )}
              </Button>
            </Card>
          </fieldset>
        </form>

        {/* Output */}
        <div ref={resultsRef} className="scroll-mt-20 space-y-6">
          {!output ? (
            <Card className="flex min-h-[300px] flex-col items-center justify-center p-10 text-center">
              <Sparkles className="h-8 w-8 text-primary/60" />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Your generated listing, teaser and social pack will appear here.
              </p>
            </Card>
          ) : (
            <>
              {isStale && (
                <div
                  role="status"
                  className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm"
                >
                  You've changed the details since this pack was generated — Regenerate to update.
                </div>
              )}
              <Card className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">{output.headline}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label="Copy full listing pack"
                    onClick={() => copyToast(buildCopyAllText(output), "Full pack copied.")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {output.keyFeatures && output.keyFeatures.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Key features</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      aria-label="Copy key features"
                      onClick={() =>
                        copyToast(
                          formatKeyFeaturesBlock(output.keyFeatures),
                          "Key features copied.",
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {output.keyFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="break-words">{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Description</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label="Copy description"
                    onClick={() => copyToast(output.listing, "Description copied.")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {output.listing.split("\n\n").map((p, i) => (
                    <p key={i} className="break-words">
                      {p}
                    </p>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Teaser</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label="Copy teaser"
                    onClick={() => copyToast(output.summary, "Teaser copied.")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{output.summary}</p>
              </Card>

              <EmailBlastCard
                emailBlast={output.emailBlast}
                keyFeatures={output.keyFeatures}
                generationId={generationId}
                marketingStatus={output.marketingStatus}
                onGenerated={onMarketingGenerated}
              />

              <Card className="p-6">
                <h3 className="font-display text-lg font-semibold">Social pack</h3>
                {output.social.length === 0 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The social posts didn't generate this time.
                    </p>
                    <GenerateMarketingButton
                      generationId={generationId}
                      label="Generate social posts — free, doesn't use a listing"
                      onGenerated={onMarketingGenerated}
                    />
                  </>
                )}
                <div className="mt-4 space-y-4">
                  {output.social.map((post) => (
                    <div key={post.platform} className="rounded-lg border border-border/70 p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{post.platform}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 shrink-0"
                          aria-label={`Copy ${post.platform} post`}
                          onClick={() => copyToast(formatSocialPost(post), "Post copied.")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground break-words">
                        {post.caption}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.hashtags.map((h) => (
                          <span key={h} className="text-xs text-primary">
                            #{h}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={requestRegenerate}
                disabled={busy || !hasAccess || outOfListings}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate this listing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This uses 1 of your {usage?.remaining ?? 0} remaining listings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void run()}>Regenerate</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
      <Dialog
        open={conflicts.length > 0}
        onOpenChange={(open) => {
          if (!open) setConflicts([]);
        }}
      >
        <DialogContent className="max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check these details</DialogTitle>
            <DialogDescription>
              Your notes say something different from what's already in the form. Nothing has been
              changed yet.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {conflicts.map((c) => (
              <li key={c.key} className="rounded-lg border border-border/70 p-3">
                <p className="text-sm font-semibold">{c.label}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  You typed <span className="font-medium text-foreground">{c.mine}</span> · notes
                  say <span className="font-medium text-foreground">{c.notes}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 sm:min-h-9"
                    onClick={() => resolveConflict(c.key, false)}
                  >
                    Keep mine
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-11 sm:min-h-9"
                    onClick={() => resolveConflict(c.key, true)}
                  >
                    Use notes
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => setConflicts([])}
            >
              Keep all mine
            </Button>
            <Button type="button" className="min-h-11 sm:min-h-10" onClick={useAllFromNotes}>
              Use all from notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface Conflict {
  key: TextFieldKey;
  label: string;
  mine: string;
  notes: string;
}

/** One form field rendered from its FIELD_DEFS entry, with its own mic. */
function DetailField({
  def,
  value,
  onChange,
  sink,
  fromNotes,
  onUndo,
}: {
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
  sink: DictationSink;
  fromNotes: boolean;
  onUndo: () => void;
}) {
  const id = `field-${def.key}`;
  const mic = <FieldMic fieldKey={def.key} label={def.label} sink={sink} mode={def.dictateMode} />;
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {def.label}
        </Label>
        <FieldDictationStatus fieldKey={def.key} />
        {fromNotes && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            From notes
            <button
              type="button"
              onClick={onUndo}
              className="-my-2 -mr-1.5 min-h-8 rounded-full px-1.5 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Undo ${def.label} from notes`}
            >
              Undo
            </button>
          </span>
        )}
        {def.kind === "textarea" && <span className="ml-auto -my-2">{mic}</span>}
      </div>
      {def.kind === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          rows={def.rows ?? 2}
        />
      ) : (
        <div className="relative">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={def.placeholder}
            className="pr-12"
          />
          <span className="absolute inset-y-0 right-0.5 flex items-center">{mic}</span>
        </div>
      )}
    </div>
  );
}
