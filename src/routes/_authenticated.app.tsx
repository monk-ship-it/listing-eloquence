import { createFileRoute, Link } from "@tanstack/react-router";
import { cloneElement, useId, useRef, useState, type ReactElement, type FormEvent } from "react";

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

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function loadExample() {
    if (inFlight.current) return;
    setInput(EXAMPLE_INPUT);
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
    const snapshot = JSON.stringify(input);
    try {
      const result = await generate({ data: input });
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
            <VoiceNotes value={input.voiceNotes} onChange={(v) => set("voiceNotes", v)} />

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
                <Field label="Address / location">
                  <Input
                    value={input.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="12 Park Avenue, Harrogate, HG1"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Property type">
                    <Input
                      value={input.propertyType}
                      onChange={(e) => set("propertyType", e.target.value)}
                      placeholder="Victorian semi-detached house"
                    />
                  </Field>
                  <Field label="Year built">
                    <Input
                      value={input.yearBuilt}
                      onChange={(e) => set("yearBuilt", e.target.value)}
                      placeholder="1901"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Bedrooms">
                    <Input
                      value={input.bedrooms}
                      onChange={(e) => set("bedrooms", e.target.value)}
                      placeholder="4"
                    />
                  </Field>
                  <Field label="Bathrooms">
                    <Input
                      value={input.bathrooms}
                      onChange={(e) => set("bathrooms", e.target.value)}
                      placeholder="2"
                    />
                  </Field>
                  <Field label="Receptions">
                    <Input
                      value={input.receptions}
                      onChange={(e) => set("receptions", e.target.value)}
                      placeholder="2"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Tenure">
                    <Input
                      value={input.tenure}
                      onChange={(e) => set("tenure", e.target.value)}
                      placeholder="Freehold"
                    />
                  </Field>
                  <Field label="Asking price (£)">
                    <Input
                      value={input.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="525,000"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Price qualifier">
                    <Input
                      value={input.priceQualifier}
                      onChange={(e) => set("priceQualifier", e.target.value)}
                      placeholder="Guide Price / OIEO"
                    />
                  </Field>
                  <Field label="Lease remaining (yrs)">
                    <Input
                      value={input.leaseYears}
                      onChange={(e) => set("leaseYears", e.target.value)}
                      placeholder="If leasehold"
                    />
                  </Field>
                </div>
                <Field label="Key features">
                  <Textarea
                    value={input.keyFeatures}
                    onChange={(e) => set("keyFeatures", e.target.value)}
                    placeholder="Open-plan kitchen, log burner, south-facing garden…"
                    rows={2}
                  />
                </Field>
                <Field label="Room dimensions">
                  <Textarea
                    value={input.dimensions}
                    onChange={(e) => set("dimensions", e.target.value)}
                    placeholder="Living room 5.2m x 4.1m…"
                    rows={2}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="EPC rating">
                    <Input
                      value={input.epc}
                      onChange={(e) => set("epc", e.target.value)}
                      placeholder="C"
                    />
                  </Field>
                  <Field label="Council Tax band">
                    <Input
                      value={input.councilTaxBand}
                      onChange={(e) => set("councilTaxBand", e.target.value)}
                      placeholder="D"
                    />
                  </Field>
                </div>
                <Field label="Outside space / garden">
                  <Input
                    value={input.outsideSpace}
                    onChange={(e) => set("outsideSpace", e.target.value)}
                    placeholder="Landscaped rear garden, patio"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Parking">
                    <Input
                      value={input.parking}
                      onChange={(e) => set("parking", e.target.value)}
                      placeholder="Driveway, garage"
                    />
                  </Field>
                  <Field label="Heating">
                    <Input
                      value={input.heating}
                      onChange={(e) => set("heating", e.target.value)}
                      placeholder="Gas central heating"
                    />
                  </Field>
                </div>
                <Field label="Utilities / broadband">
                  <Input
                    value={input.utilities}
                    onChange={(e) => set("utilities", e.target.value)}
                    placeholder="Mains services, Ultrafast broadband"
                  />
                </Field>
                <Field label="Nearby (schools, transport, amenities)">
                  <Textarea
                    value={input.nearby}
                    onChange={(e) => set("nearby", e.target.value)}
                    placeholder="Outstanding primary, station 0.5 miles…"
                    rows={2}
                  />
                </Field>
                <Field label="Period / character features">
                  <Textarea
                    value={input.periodFeatures}
                    onChange={(e) => set("periodFeatures", e.target.value)}
                    placeholder="Original cornicing, sash windows…"
                    rows={2}
                  />
                </Field>
                <Field label="Area highlights">
                  <Input
                    value={input.areaHighlights}
                    onChange={(e) => set("areaHighlights", e.target.value)}
                    placeholder="Vibrant market town, riverside walks"
                  />
                </Field>
                <Field label="Disclosures / condition notes">
                  <Textarea
                    value={input.disclosures}
                    onChange={(e) => set("disclosures", e.target.value)}
                    placeholder="Recent rewire; survey available…"
                    rows={2}
                  />
                </Field>
                <Field label="Viewing / access notes (kept out of the listing)">
                  <Textarea
                    value={input.showingNotes}
                    onChange={(e) => set("showingNotes", e.target.value)}
                    placeholder="By appointment; key with branch…"
                    rows={2}
                  />
                </Field>
                <Field label="Media / photo / floor-plan notes">
                  <Textarea
                    value={input.mediaNotes}
                    onChange={(e) => set("mediaNotes", e.target.value)}
                    placeholder="Photos + floor plan booked…"
                    rows={2}
                  />
                </Field>
                <Field label="Target audience">
                  <Input
                    value={input.targetAudience}
                    onChange={(e) => set("targetAudience", e.target.value)}
                    placeholder="Growing families, professionals"
                  />
                </Field>
              </div>

              <Button
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={busy || !hasAccess || outOfListings}
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
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const autoId = useId();
  const id = children.props.id ?? autoId;
  const controlled = cloneElement(children, { id });
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {controlled}
    </div>
  );
}
