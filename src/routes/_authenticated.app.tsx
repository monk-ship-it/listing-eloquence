import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { VOICES, type VoiceId } from "@/lib/voices";
import { EMPTY_INPUT, EXAMPLE_INPUT, type ListingInput, type ListingOutput } from "@/lib/listing-types";
import { generateListing } from "@/lib/listing.functions";
import { getMySubscription, getMyUsage } from "@/lib/subscription.functions";
import { APP_NAME } from "@/lib/config";
import { VoiceNotes } from "@/components/VoiceNotes";
import { Copy, Sparkles, RefreshCw, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: `Generator — ${APP_NAME}` }] }),
  component: GeneratorPage,
});

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard.");
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
  const [busy, setBusy] = useState(false);

  const hasAccess = subQuery.data?.hasAccess ?? false;
  const usage = usageQuery.data;
  const outOfListings = !!usage && !usage.unlimited && usage.remaining <= 0;

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function appendTo(key: keyof ListingInput) {
    return (text: string) =>
      setInput((prev) => {
        const current = (prev[key] as string) ?? "";
        const next = current.trim() ? `${current.trim()} ${text}` : text;
        return { ...prev, [key]: next };
      });
  }

  function loadExample() {
    setInput(EXAMPLE_INPUT);
    setOutput(null);
    toast.success("Example property loaded.");
  }

  async function run() {
    setBusy(true);
    try {
      const result = await generate({ data: input });
      setOutput(result);
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Listing generated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      if (msg.includes("SUBSCRIPTION_REQUIRED")) {
        toast.error("Your trial or subscription is required to generate.");
      } else if (msg.includes("LISTING_LIMIT_REACHED")) {
        toast.error("You've used all your listings this month. Upgrade your plan or wait for next month's renewal.");
        queryClient.invalidateQueries({ queryKey: ["usage"] });
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
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
          <Button variant="outline" onClick={loadExample}>
            <Sparkles className="mr-2 h-4 w-4" /> Load example
          </Button>
        </div>
      </div>

      {!subQuery.isLoading && !hasAccess && (
        <Card className="mt-6 border-primary/40 bg-primary/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <p className="text-sm">
                Start your free trial to generate listings.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/account">Start free trial</Link>
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
                It renews on {usage ? new Date(usage.resetsOn).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : ""}.
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
        <div className="space-y-6">
          <VoiceNotes value={input.voiceNotes} onChange={(v) => set("voiceNotes", v)} />

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">Structured property details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Type or paste exact facts below. These are used alongside your voice notes, and take
              priority if anything conflicts.
            </p>

            <div className="mt-5">
              <Label>Brand voice</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => set("voice", v.id as VoiceId)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      input.voice === v.id
                        ? "border-primary bg-primary/10"
                        : "border-border/70 hover:border-primary/50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{v.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{v.descriptor}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Address / location">
                <Input value={input.address} onChange={(e) => set("address", e.target.value)} placeholder="12 Park Avenue, Harrogate, HG1" />
              </Field>
              <Field label="Property type">
                <Input value={input.propertyType} onChange={(e) => set("propertyType", e.target.value)} placeholder="Victorian semi-detached house" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Bedrooms">
                  <Input value={input.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} placeholder="4" />
                </Field>
                <Field label="Bathrooms">
                  <Input value={input.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" />
                </Field>
                <Field label="Receptions">
                  <Input value={input.receptions} onChange={(e) => set("receptions", e.target.value)} placeholder="2" />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tenure">
                  <Input value={input.tenure} onChange={(e) => set("tenure", e.target.value)} placeholder="Freehold" />
                </Field>
                <Field label="Asking price (£)">
                  <Input value={input.price} onChange={(e) => set("price", e.target.value)} placeholder="525,000" />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Price qualifier">
                  <Input value={input.priceQualifier} onChange={(e) => set("priceQualifier", e.target.value)} placeholder="Guide Price / OIEO" />
                </Field>
                <Field label="Lease remaining (yrs)">
                  <Input value={input.leaseYears} onChange={(e) => set("leaseYears", e.target.value)} placeholder="If leasehold" />
                </Field>
              </div>
              <Field label="Key features">
                <Textarea value={input.keyFeatures} onChange={(e) => set("keyFeatures", e.target.value)} placeholder="Open-plan kitchen, log burner, south-facing garden…" rows={2} />
              </Field>
              <Field label="Room dimensions">
                <Textarea value={input.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="Living room 5.2m x 4.1m…" rows={2} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="EPC rating">
                  <Input value={input.epc} onChange={(e) => set("epc", e.target.value)} placeholder="C" />
                </Field>
                <Field label="Council Tax band">
                  <Input value={input.councilTaxBand} onChange={(e) => set("councilTaxBand", e.target.value)} placeholder="D" />
                </Field>
              </div>
              <Field label="Outside space / garden">
                <Input value={input.outsideSpace} onChange={(e) => set("outsideSpace", e.target.value)} placeholder="Landscaped rear garden, patio" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Parking">
                  <Input value={input.parking} onChange={(e) => set("parking", e.target.value)} placeholder="Driveway, garage" />
                </Field>
                <Field label="Heating">
                  <Input value={input.heating} onChange={(e) => set("heating", e.target.value)} placeholder="Gas central heating" />
                </Field>
              </div>
              <Field label="Utilities / broadband">
                <Input value={input.utilities} onChange={(e) => set("utilities", e.target.value)} placeholder="Mains services, Ultrafast broadband" />
              </Field>
              <Field label="Nearby (schools, transport, amenities)">
                <Textarea value={input.nearby} onChange={(e) => set("nearby", e.target.value)} placeholder="Outstanding primary, station 0.5 miles…" rows={2} />
              </Field>
              <Field label="Period / character features">
                <Textarea value={input.periodFeatures} onChange={(e) => set("periodFeatures", e.target.value)} placeholder="Original cornicing, sash windows…" rows={2} />
              </Field>
              <Field label="Area highlights">
                <Input value={input.areaHighlights} onChange={(e) => set("areaHighlights", e.target.value)} placeholder="Vibrant market town, riverside walks" />
              </Field>
              <Field label="Target audience">
                <Input value={input.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Growing families, professionals" />
              </Field>
            </div>
          </Card>
        </div>


          <Button className="mt-6 w-full" size="lg" onClick={run} disabled={busy || !hasAccess || outOfListings}>
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

        {/* Output */}
        <div className="space-y-6">
          {!output ? (
            <Card className="flex min-h-[300px] flex-col items-center justify-center p-10 text-center">
              <Sparkles className="h-8 w-8 text-primary/60" />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Your generated listing, teaser and social pack will appear here.
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">{output.headline}</h2>
                  <Button variant="ghost" size="icon" onClick={() => copy(`${output.headline}\n\n${output.listing}`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {output.listing.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Teaser</h3>
                  <Button variant="ghost" size="icon" onClick={() => copy(output.summary)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{output.summary}</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-display text-lg font-semibold">Social pack</h3>
                <div className="mt-4 space-y-4">
                  {output.social.map((post) => (
                    <div key={post.platform} className="rounded-lg border border-border/70 p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{post.platform}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copy(`${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{post.caption}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.hashtags.map((h) => (
                          <span key={h} className="text-xs text-primary">#{h}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Button variant="outline" className="w-full" onClick={run} disabled={busy}>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  onDictate,
  lang,
}: {
  label: string;
  children: React.ReactNode;
  onDictate?: (text: string) => void;
  lang?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {onDictate && <DictateButton onResult={onDictate} lang={lang} />}
      </div>
      {children}
    </div>
  );
}
