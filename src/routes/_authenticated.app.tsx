import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

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
  coerceLegacyInput,
  EMPTY_INPUT,
  EXAMPLE_INPUT,
  type ListingInput,
  type ListingOutput,
} from "@/lib/listing-types";
import { getGeneration } from "@/lib/generations.functions";
import { useAuth } from "@/hooks/use-auth";
import { generateListing } from "@/lib/listing.functions";
import { getMySubscription, getMyUsage } from "@/lib/subscription.functions";
import { APP_NAME } from "@/lib/config";
import { VoiceNotes } from "@/components/VoiceNotes";
import { DictationProvider, useDictationContext, type DictationSink } from "@/components/dictation/DictationProvider";
import { FieldDictationStatus, FieldMic } from "@/components/dictation/FieldMic";
import {
  FIELD_BY_KEY,
  FIELD_DEFS,
  SECTIONS,
  fieldRows,
  type FieldDef,
  type SectionId,
  type TextFieldKey,
} from "@/lib/listing-fields";
import { ListingPack } from "@/components/pack/ListingPack";
import { WorkbenchExportMenu } from "@/components/admin/WorkbenchExportMenu";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkMaterialInfo, summariseChecks } from "@/lib/material-info";
import { extractListingFields } from "@/lib/extract.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Sparkles, RefreshCw, Lock, ChevronDown, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  // ?g=<id> opens a saved listing (from Saved listings → "Open in generator").
  validateSearch: (search: Record<string, unknown>): { g?: string } =>
    typeof search.g === "string" && /^[0-9a-f-]{36}$/i.test(search.g) ? { g: search.g } : {},
  head: () => ({
    meta: [{ title: `Generator — ${APP_NAME}` }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: GeneratorPage,
});

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
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() => new Set(SECTIONS.map((x) => x.id)));
  // On phones only the first two sections start open (after hydration).
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      setOpenSections(new Set(SECTIONS.filter((x) => x.mobileOpen).map((x) => x.id)));
    }
  }, []);

  // ---- Never lose a draft: the form autosaves per user, in this browser only. ----
  const { user } = useAuth();
  const { g: openId } = Route.useSearch();
  const getGenerationFn = useServerFn(getGeneration);
  const draftKey = user ? `quill:draft:v1:${user.id}` : null;
  const [draftOffer, setDraftOffer] = useState<SavedDraft | null>(null);
  const draftChecked = useRef(false);

  useEffect(() => {
    if (!draftKey || draftChecked.current || openId) return;
    draftChecked.current = true;
    const d = readDraft(draftKey);
    if (d && hasDraftContent(d.input) && !hasDraftContent(inputRef.current)) setDraftOffer(d);
  }, [draftKey, openId]);

  useEffect(() => {
    if (!draftKey || draftOffer) return;
    const t = window.setTimeout(() => {
      const cur = inputRef.current;
      const snapshot = JSON.stringify(cur);
      // Nothing unsaved when the form matches the pack it produced (or the example).
      if (snapshot === generatedFrom || snapshot === JSON.stringify(EXAMPLE_INPUT)) {
        if (snapshot === generatedFrom) removeDraft(draftKey);
        return;
      }
      if (hasDraftContent(cur)) writeDraft(draftKey, { savedAt: Date.now(), input: cur });
    }, 1500);
    return () => window.clearTimeout(t);
  }, [input, draftKey, draftOffer, generatedFrom]);

  // Typing something new means the agent has moved on from the old draft.
  useEffect(() => {
    if (draftOffer && hasDraftContent(input)) setDraftOffer(null);
  }, [input, draftOffer]);

  function restoreDraft() {
    if (!draftOffer) return;
    const next = { ...EMPTY_INPUT, ...draftOffer.input };
    inputRef.current = next;
    setInput(next);
    setFromNotes({});
    setConflicts([]);
    setDraftOffer(null);
    toast.success("Draft restored.");
  }

  function discardDraft() {
    if (draftKey) removeDraft(draftKey);
    setDraftOffer(null);
  }

  // ---- "Open in generator" from Saved listings (?g=<id>). ----
  const openedId = useRef<string | null>(null);
  useEffect(() => {
    if (!openId || openedId.current === openId) return;
    openedId.current = openId;
    const requestedId = openId;
    // Anything typed after the request started must not be overwritten.
    const before = JSON.stringify(inputRef.current);
    let cancelled = false;
    getGenerationFn({ data: { id: requestedId } })
      .then((rec) => {
        if (cancelled || openedId.current !== requestedId) return; // stale or unmounted
        if (!rec) {
          toast.error("That saved listing couldn't be found.");
          return;
        }
        if (inFlight.current || JSON.stringify(inputRef.current) !== before) {
          toast.info("Saved listing not loaded because you'd already started editing. Reopen it from Saved listings.");
          return;
        }
        const loaded = coerceLegacyInput(rec.inputs);
        inputRef.current = loaded;
        setInput(loaded);
        setFromNotes({});
        setConflicts([]);
        setOutput(rec.output);
        setGenerationId(rec.id);
        setGeneratedFrom(JSON.stringify(loaded));
        setDraftOffer(null);
        toast.success(`Opened “${rec.propertyTitle ?? "saved listing"}” — edit and regenerate, or copy again.`);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't open that saved listing. Please try again.");
      });
    return () => {
      // Navigated away or a different listing was requested: drop this
      // response, and allow a fresh load if the same id is opened again.
      cancelled = true;
      if (openedId.current === requestedId) openedId.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  function toggleSection(id: SectionId) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function jumpToField(field: string) {
    const sec = FIELD_BY_KEY[field]?.section;
    if (sec && sec !== "voice") setOpenSections((prev) => new Set(prev).add(sec));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el =
          document.getElementById(`field-${field}`) ?? document.querySelector<HTMLElement>(`[data-field="${field}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.focus({ preventScroll: true });
        }
      }),
    );
  }

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
        toast.success(`Filled ${n} field${n === 1 ? "" : "s"}${found.length ? ` · ${found.length} to review` : ""}`);
      }
      if (firstKey && window.matchMedia("(max-width: 1023px)").matches && found.length === 0) {
        requestAnimationFrame(() =>
          document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
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
    try {
      // Let any in-progress dictation finish and land before sending. Inside
      // try/finally so a failure here can never leave busy/inFlight locked.
      await dictation.finishPending();
      const current = inputRef.current;
      const snapshot = JSON.stringify(current);
      const result = await generate({ data: current });
      if (myId !== requestId.current) return; // stale response — ignore
      setOutput(result.output);
      setGenerationId(result.generationId);
      setGeneratedFrom(snapshot);
      if (draftKey) removeDraft(draftKey);
      if (result.output.marketingStatus === "failed") {
        toast.warning("Listing ready. The email & social didn't generate — you can add them free below.");
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
        toast.error("You've used all your listings this month. Upgrade your plan or wait for next month's renewal.");
        queryClient.invalidateQueries({ queryKey: ["usage"] });
      } else if (msg.includes("MALFORMED_AI_OUTPUT") || msg.includes("AI_TRUNCATED")) {
        toast.error("The writer returned an incomplete draft. Please try again — this didn't use a listing.");
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

  const packInput = useMemo<ListingInput>(
    () => (generatedFrom ? (JSON.parse(generatedFrom) as ListingInput) : input),
    [generatedFrom, input],
  );

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
        <div className="flex flex-wrap items-center gap-3">
          {usage && hasAccess && (
            <div className="rounded-lg border border-border/70 bg-card/50 px-4 py-2 text-right">
              <p className="text-xs text-muted-foreground">{usage.planName} plan</p>
              <p className="text-sm font-semibold">
                {usage.unlimited ? "Unlimited listings" : `${usage.remaining} of ${usage.limit} listings left`}
              </p>
            </div>
          )}
          <Button type="button" variant="outline" onClick={loadExample} disabled={busy}>
            <Sparkles className="mr-2 h-4 w-4" /> Load example
          </Button>
        </div>
      </div>

      {draftOffer && (
        <Card className="mt-6 border-primary/40 bg-primary/5 p-4" role="status">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-sm">
              You have an unsaved draft from {formatDraftTime(draftOffer.savedAt)}
              {draftOffer.input.address ? ` (${draftOffer.input.address})` : ""}. Restore it?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" className="min-h-11 sm:min-h-9" onClick={restoreDraft}>
                Restore draft
              </Button>
              <Button type="button" size="sm" variant="outline" className="min-h-11 sm:min-h-9" onClick={discardDraft}>
                Discard
              </Button>
            </div>
          </div>
        </Card>
      )}

      {subQuery.isError && (
        <Card className="mt-6 border-destructive/40 bg-destructive/5 p-5" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">We couldn't load your subscription. Check your connection and try again.</p>
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
                You've used all {usage?.limit} listings on your {usage?.planName} plan this month. It renews on{" "}
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
              <ReadyMeter input={input} onJump={jumpToField} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-semibold">Structured property details</h2>
                <WorkbenchExportMenu input={input} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Type or paste exact facts below. These are used alongside your voice notes, and take priority if
                anything conflicts.
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
                          selected ? "border-primary bg-primary/10" : "border-border/70 hover:border-primary/50"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{v.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{v.descriptor}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {SECTIONS.map((sec) => {
                  const defs = FIELD_DEFS.filter((d) => d.section === sec.id && (!d.showIf || d.showIf(input)));
                  const filled = defs.filter((d) => String(input[d.key] ?? "").trim()).length;
                  const isOpen = openSections.has(sec.id);
                  return (
                    <section
                      key={sec.id}
                      className="rounded-xl border border-border/60"
                      aria-labelledby={`sec-${sec.id}`}
                    >
                      <button
                        type="button"
                        id={`sec-${sec.id}`}
                        aria-expanded={isOpen}
                        onClick={() => toggleSection(sec.id)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="font-display text-base font-semibold">{sec.title}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {filled}/{defs.length}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="grid gap-4 px-4 pb-4">
                          {fieldRows(defs).map((row) => (
                            <div
                              key={row[0].key}
                              className={
                                row.length === 1
                                  ? ""
                                  : `grid gap-3 ${row.length === 3 ? "grid-cols-2 min-[400px]:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`
                              }
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
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              <div
                id="field-sellerApproved"
                className="mt-5 flex items-start gap-3 rounded-xl border border-border/60 p-4"
              >
                <Switch
                  id="seller-approved"
                  checked={input.sellerApproved === true}
                  onCheckedChange={(v) => set("sellerApproved", v)}
                />
                <div>
                  <Label htmlFor="seller-approved" className="text-sm font-medium">
                    Seller has approved these particulars
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Leave off until they confirm — Quill adds a seller approval email to the pack.
                  </p>
                </div>
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
                <div role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
                  You've changed the details since this pack was generated — Regenerate to update.
                </div>
              )}
              <ListingPack
                output={output}
                input={packInput}
                generationId={generationId}
                onOutputChange={onMarketingGenerated}
                onJumpToField={jumpToField}
              />

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
              Your notes say something different from what's already in the form. Nothing has been changed yet.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {conflicts.map((c) => (
              <li key={c.key} className="rounded-lg border border-border/70 p-3">
                <p className="text-sm font-semibold">{c.label}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  You typed <span className="font-medium text-foreground">{c.mine}</span> · notes say{" "}
                  <span className="font-medium text-foreground">{c.notes}</span>
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
            <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={() => setConflicts([])}>
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

function ReadyMeter({ input, onJump }: { input: ListingInput; onJump: (field: string) => void }) {
  const [open, setOpen] = useState(false);
  const s = summariseChecks(checkMaterialInfo(input));
  return (
    <div className="sticky top-16 z-20 -mx-1 rounded-lg border border-border/70 bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 w-full items-center justify-between gap-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <span className="font-medium">Ready to publish?</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Material information {s.done}/{s.total}
          {s.mustFix > 0 && <span className="font-semibold text-destructive"> · {s.mustFix} must-fix</span>}
        </span>
      </button>
      {open && s.open.length > 0 && (
        <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto border-t border-border/60 pt-2 text-sm">
          {s.open.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onJump(i.field);
                }}
                className="flex min-h-10 w-full items-center gap-2 rounded px-1 text-left hover:bg-muted"
              >
                <Badge
                  variant={i.severity === "block" ? "destructive" : "secondary"}
                  className="shrink-0 text-[10px] uppercase"
                >
                  {i.severity === "block"
                    ? "Must fix"
                    : i.severity === "conflict"
                      ? "Conflict"
                      : i.severity === "warn"
                        ? "Add"
                        : "Confirm"}
                </Badge>
                <span className="min-w-0 truncate">{i.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && s.open.length === 0 && (
        <p className="mt-2 border-t border-border/60 pt-2 text-sm text-muted-foreground">Everything's in. Nice work.</p>
      )}
    </div>
  );
}

function SelectControl({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const options = def.options ?? [];
  // Keep legacy free-text values selectable so old listings still show them.
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={`field-${def.key}`} className="min-w-0 flex-1">
        <SelectValue placeholder={def.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {all.map((o) => (
          <SelectItem key={o} value={o}>
            {o === "From" ? "From (new homes only)" : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TriControl({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const none = /^none known$/i.test(value);
  const yes = !!value && !none;
  const details = yes ? value.replace(/^yes\s*[–\-:]?\s*/i, "") : "";
  const btn = (active: boolean) =>
    `min-h-11 rounded-md border px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-9 ${
      active ? "border-primary bg-primary/10 font-medium" : "border-border/70 hover:border-primary/50"
    }`;
  return (
    <div className="space-y-2" data-field={def.key}>
      <div role="radiogroup" aria-label={def.label} className="flex flex-wrap gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={none}
          className={btn(none)}
          onClick={() => onChange(none ? "" : "None known")}
        >
          None known
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={yes}
          className={btn(yes)}
          onClick={() => onChange(yes ? "" : "Yes – ")}
        >
          Yes – details
        </button>
        {!value && <span className="self-center text-xs text-muted-foreground">Unanswered</span>}
      </div>
      {yes && (
        <Textarea
          id={`field-${def.key}`}
          value={details}
          onChange={(e) => onChange(`Yes – ${e.target.value}`)}
          placeholder={def.placeholder}
          rows={2}
        />
      )}
    </div>
  );
}

function ChipsControl({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const toggle = (o: string) => {
    const has = parts.some((p) => p.toLowerCase() === o.toLowerCase());
    const next = has ? parts.filter((p) => p.toLowerCase() !== o.toLowerCase()) : [...parts, o];
    onChange(next.join(", "));
  };
  const extra = parts.filter((p) => !(def.options ?? []).some((o) => o.toLowerCase() === p.toLowerCase()));
  return (
    <div data-field={def.key}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={def.label}>
        {(def.options ?? []).map((o) => {
          const on = parts.some((p) => p.toLowerCase() === o.toLowerCase());
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o)}
              className={`min-h-11 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-8 ${
                on ? "border-primary bg-primary/10 font-medium" : "border-border/70 hover:border-primary/50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {extra.length > 0 && <p className="mt-1.5 text-xs text-muted-foreground">Also noted: {extra.join(", ")}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{def.placeholder}</p>
    </div>
  );
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
  const labelRowMic = def.kind === "textarea" || def.kind === "tri" || def.kind === "chips";
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
        {labelRowMic && <span className="-my-2 ml-auto">{mic}</span>}
      </div>
      {def.kind === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          rows={def.rows ?? 2}
        />
      ) : def.kind === "select" ? (
        <div className="flex items-center gap-1">
          <SelectControl def={def} value={value} onChange={onChange} />
          {mic}
        </div>
      ) : def.kind === "tri" ? (
        <TriControl def={def} value={value} onChange={onChange} />
      ) : def.kind === "chips" ? (
        <ChipsControl def={def} value={value} onChange={onChange} />
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

// ---------------------------------------------------------------------------
// Draft autosave (localStorage, per user). Storage can be unavailable (private
// mode, blocked site data) — every access is wrapped and failures are ignored.
// ---------------------------------------------------------------------------

interface SavedDraft {
  savedAt: number;
  input: ListingInput;
}

const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** True when the agent has typed anything worth keeping (voice choice alone isn't). */
function hasDraftContent(input: ListingInput | null | undefined): boolean {
  if (!input) return false;
  return Object.entries(input).some(([k, v]) => k !== "voice" && typeof v === "string" && v.trim().length > 0);
}

function readDraft(key: string): SavedDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<SavedDraft>;
    if (typeof d?.savedAt !== "number" || !d.input || typeof d.input !== "object") return null;
    if (Date.now() - d.savedAt > DRAFT_MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return { savedAt: d.savedAt, input: coerceLegacyInput(d.input) };
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: SavedDraft) {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // storage full or unavailable — drafts are a convenience only
  }
}

function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function formatDraftTime(ts: number): string {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return sameDay
    ? `today at ${time}`
    : `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at ${time}`;
}
