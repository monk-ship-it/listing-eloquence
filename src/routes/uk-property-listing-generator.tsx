import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/config";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";

const CANONICAL = "https://copybymonk.com/uk-property-listing-generator";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Does Quill follow Material Information guidance?",
    a: "Yes. Quill only writes from the facts you provide. If tenure, council tax band, EPC, price or lease details are supplied, they're woven in factually; if they're not, they're simply omitted rather than invented.",
  },
  {
    q: "Which portals is the copy suitable for?",
    a: "The listing body is structured for Rightmove, OnTheMarket, Zoopla and agency websites — an opening hook, then paragraphs covering the property, accommodation, outside space and location.",
  },
  {
    q: "Are the Key Features bullets portal-ready?",
    a: "Quill generates 6–10 short, non-duplicative Key Features bullets from your facts, written in the phrasing UK portals expect (no full sentences, no trailing full stops).",
  },
  {
    q: "Can I control the tone?",
    a: "Yes. Choose Professional, Premium, Luxury or Heritage. All voices observe the same style guard, avoiding filler like ‘nestled’ or ‘boasts’, and never inventing period claims.",
  },
];

export const Route = createFileRoute("/uk-property-listing-generator")({
  head: () => ({
    meta: [
      { title: `UK Property Listing Generator — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Turn one set of property notes into a portal-ready UK listing pack: Rightmove/OnTheMarket-style description, Key Features bullets, teaser, social captions and buyer email. Material Information aware.",
      },
      { property: "og:title", content: `UK Property Listing Generator — ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Rightmove/OnTheMarket-style descriptions, Key Features bullets, teasers and social captions — written from your facts, in your voice.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: UKPage,
});

function UKPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Logo withByline />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/us-real-estate-listing-generator">US version</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ plan: "starter", market: "uk" }}>
                Start free trial
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">For UK estate agents</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          UK property listing generator that respects Material Information.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Speak or type property notes once. Quill writes a portal-ready description, generates the
          Key Features bullets Rightmove and OnTheMarket expect, and produces the teaser, social
          captions and buyer email — all from a single source of truth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ plan: "starter", market: "uk" }}>
              Create first pack <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">See the workflow</Link>
          </Button>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">What's in a UK listing pack</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Portal-ready description (Rightmove/OnTheMarket style)",
              "6–10 Key Features bullets",
              "Short teaser summary",
              "Instagram, Facebook and X captions",
              "Buyer follow-up email",
              "Four brand voices: Professional, Premium, Luxury, Heritage",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Example generated Key Features</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quill writes each bullet strictly from the facts you supply — short, factual, non-duplicative.
          </p>
          <Card className="mt-4 p-5">
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                "Freehold Victorian semi-detached",
                "Four double bedrooms, two bathrooms",
                "Open-plan kitchen/dining room",
                "South-facing landscaped garden",
                "Off-street parking for two cars",
                "Gas central heating, EPC rating C",
                "Council Tax band D",
                "Within 0.5 miles of the mainline station",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Compliance & accuracy</h2>
          <Card className="mt-4 flex gap-4 p-5">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
            <div className="text-sm text-muted-foreground">
              <p>
                Quill's master prompt refuses to invent tenure, EPC, council tax or period claims.
                A descriptor attached to a specific feature (e.g. “Victorian fireplace”) stays
                scoped to that feature — it never becomes “a Victorian house” unless the property
                type explicitly says so. Viewing notes stay out of the public description.
              </p>
            </div>
          </Card>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">FAQs</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((f) => (
              <Card key={f.q} className="p-5">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">Try it on your next instruction</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            14-day free trial. No CRM migration. Cancel anytime.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ plan: "starter", market: "uk" }}>
                Create first pack
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/us-real-estate-listing-generator">US version</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
