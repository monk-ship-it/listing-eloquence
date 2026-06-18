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

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
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
      toast.success("Listing generated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      if (msg.includes("SUBSCRIPTION_REQUIRED")) {
        toast.error("Your trial or subscription is required to generate.");
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
        <Button variant="outline" onClick={loadExample}>
          <Sparkles className="mr-2 h-4 w-4" /> Load example
        </Button>
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Property details</h2>

          <div className="mt-5">
            <Label>Brand voice</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tenure">
                <Input value={input.tenure} onChange={(e) => set("tenure", e.target.value)} placeholder="Freehold" />
              </Field>
              <Field label="Asking price (£)">
                <Input value={input.price} onChange={(e) => set("price", e.target.value)} placeholder="525,000" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-1 gap-3">
              <Field label="Area highlights">
                <Input value={input.areaHighlights} onChange={(e) => set("areaHighlights", e.target.value)} placeholder="Vibrant market town, riverside walks" />
              </Field>
              <Field label="Target audience">
                <Input value={input.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Growing families, professionals" />
              </Field>
            </div>
          </div>

          <Button className="mt-6 w-full" size="lg" onClick={run} disabled={busy || !hasAccess}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
