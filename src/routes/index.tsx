import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VOICES } from "@/lib/voices";
import { EXAMPLE_INPUT } from "@/lib/listing-types";
import { APP_NAME, PRICE_MONTHLY, TRIAL_DAYS, CONTACT_EMAIL } from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";
import { Check, Sparkles, PenLine, Share2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quill — AI Property Listing Generator for UK Estate Agents" },
      {
        name: "description",
        content:
          "Generate polished UK property listings in four brand voices — Professional, Premium, Luxury and Heritage — plus social captions. 14-day free trial, then £24.99/month.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const [showOutput, setShowOutput] = useState(false);
  const ctaTo = user ? "/app" : "/auth";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link to="/app">Open app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Start free trial</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {TRIAL_DAYS}-day free trial — no commitment
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            Property listings that sound like your{" "}
            <span className="italic font-light text-primary">best negotiator</span> wrote them.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {APP_NAME} turns property details into portal-ready UK listings in four distinct brand
            voices — plus ready-to-post social captions with hashtags.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={ctaTo}>Start your free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#example">See an example</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Then {PRICE_MONTHLY}/month. Cancel anytime from your account.
          </p>
        </div>
      </section>

      {/* Voices */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-semibold">Four crafted voices</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Pick the tone that fits the property and your brand.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VOICES.map((v) => (
            <Card key={v.id} className="border-border/70 bg-card/70 p-6">
              <h3 className="font-display text-xl font-semibold">{v.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-primary">{v.tagline}</p>
              <p className="mt-3 text-sm text-muted-foreground">{v.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Example */}
      <section id="example" className="border-y border-border/60 bg-card/30 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-3xl font-semibold">From details to dazzling — instantly</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Enter the facts; {APP_NAME} writes the listing. Here's a Heritage-voice example.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => setShowOutput((s) => !s)}
            >
              {showOutput ? "Show the input" : "Reveal the listing"}
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <PenLine className="h-4 w-4" /> Input
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><span className="text-foreground">Type:</span> {EXAMPLE_INPUT.propertyType}</li>
                <li><span className="text-foreground">Location:</span> {EXAMPLE_INPUT.address}</li>
                <li><span className="text-foreground">Price:</span> {EXAMPLE_INPUT.priceQualifier} £{EXAMPLE_INPUT.price}</li>
                <li><span className="text-foreground">Beds/Baths:</span> {EXAMPLE_INPUT.bedrooms} / {EXAMPLE_INPUT.bathrooms}</li>
                <li><span className="text-foreground">Features:</span> {EXAMPLE_INPUT.keyFeatures}</li>
                <li><span className="text-foreground">Garden:</span> {EXAMPLE_INPUT.outsideSpace}</li>
              </ul>
            </Card>
            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" /> Output
              </div>
              {showOutput ? (
                <div className="space-y-3 text-sm">
                  <p className="font-display text-lg font-semibold text-foreground">
                    A Distinguished Cotswold Rectory, Quietly Commanding the Heart of Burford
                  </p>
                  <p className="text-muted-foreground">
                    Set back from Church Lane behind a gravelled drive, The Old Rectory has watched
                    over Burford since the early 18th century. Step inside and flagstone floors give
                    way to an inglenook fireplace, exposed beams and a bespoke shaker kitchen — period
                    character met with considered, everyday comfort.
                  </p>
                  <p className="text-muted-foreground">
                    Beyond, a walled garden of around half an acre unfolds into mature borders and a
                    small orchard, with a stone terrace made for long summer evenings.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-xs text-primary">
                    <Share2 className="h-3.5 w-3.5" /> #BurfordHomes #CotswoldsProperty #PeriodHome
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click “Reveal the listing” to see the generated Heritage-voice copy and social pack.
                </p>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold">Simple pricing</h2>
        <Card className="mx-auto mt-8 max-w-md border-primary/40 p-8 text-left">
          <p className="font-display text-4xl font-semibold">
            {PRICE_MONTHLY}
            <span className="text-base font-normal text-muted-foreground">/month</span>
          </p>
          <p className="mt-1 text-sm text-primary">{TRIAL_DAYS}-day free trial included</p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Unlimited listings in all four voices",
              "Social captions with hashtags",
              "Saved listing history",
              "Material Information-aware copy",
              "Cancel anytime, self-service",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 w-full" size="lg">
            <Link to={ctaTo}>Start free trial</Link>
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row">
          <Logo showText />
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
          <p>© {new Date().getFullYear()} {APP_NAME}. Crafted for UK estate agents.</p>
        </div>
      </footer>
    </div>
  );
}
