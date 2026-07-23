import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/config";
import { Check, ArrowRight, ShieldCheck, Mic, Sparkles, Copy } from "lucide-react";

const CANONICAL = "https://copybymonk.com/uk-property-listing-generator";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Does Quill follow Material Information guidance?",
    a: "Yes. Quill only writes from the facts you provide. If tenure, council tax band, EPC, price or lease details are supplied, they're woven in factually; if they're not, they're simply omitted rather than invented.",
  },
  {
    q: "Which portals is the copy suitable for?",
    a: "The listing description is structured for Rightmove, OnTheMarket, Zoopla and agency websites — an opening hook, then paragraphs covering the property, accommodation, outside space and location.",
  },
  {
    q: "Are the Key Features bullets portal-ready?",
    a: "Quill generates 6–10 short, non-duplicative Key Features bullets from your facts, written in the phrasing UK portals expect (no full sentences, no trailing full stops).",
  },
  {
    q: "What exactly does one generation produce?",
    a: "One run returns a Headline, 6–10 Key Features, a portal-ready Listing Description, a Short Teaser and one caption each for Instagram, Facebook and X. Nothing else is generated.",
  },
  {
    q: "Can I control the tone?",
    a: "Yes. Choose Professional, Premium, Luxury or Heritage. All voices observe the same style guard, avoiding filler like ‘nestled’ or ‘boasts’, and never inventing period claims.",
  },
  {
    q: "Is there a free trial?",
    a: "The Starter plan begins with a 14-day free trial. A card is required at secure checkout to start the trial, and you can cancel anytime before it ends without being charged.",
  },
];

export const Route = createFileRoute("/uk-property-listing-generator")({
  head: () => ({
    meta: [
      { title: `UK Property Listing Generator — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Turn one set of property notes into a portal-ready UK listing pack: Headline, 6–10 Key Features, Rightmove/OnTheMarket-style description, short teaser and Instagram, Facebook and X captions. Material Information aware.",
      },
      { property: "og:title", content: `UK Property Listing Generator — ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Headline, Key Features, portal-ready description, teaser and Instagram/Facebook/X captions — written from your facts, in your voice.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `UK Property Listing Generator — ${APP_NAME}` },
      {
        name: "twitter:description",
        content:
          "One set of notes becomes a full UK listing pack: Headline, Key Features, portal description, teaser and Instagram/Facebook/X captions.",
      },
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
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <Logo withByline />
          </div>
          <nav className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/us-real-estate-listing-generator">US version</Link>
            </Button>
            <Button asChild className="min-h-[44px]">
              <Link to="/auth" search={{ plan: "starter", market: "uk" }}>
                Get started
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          For UK estate agents
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          UK property listing generator that respects Material Information.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Speak or type property notes once. Quill writes a portal-ready description, generates the
          Headline and 6–10 Key Features bullets Rightmove and OnTheMarket expect, and produces a
          short teaser plus Instagram, Facebook and X captions — all from a single source of truth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-[44px]">
            <Link to="/auth" search={{ plan: "starter", market: "uk" }}>
              Create first pack <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-[44px]">
            <Link to="/">See the workflow</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          14-day Starter trial. Card required at secure checkout. Cancel anytime.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">What's in a UK listing pack</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Headline written for portal search results",
              "6–10 Key Features bullets (Rightmove/OnTheMarket phrasing)",
              "Portal-ready Listing Description",
              "Short Teaser summary",
              "Instagram, Facebook and X captions",
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
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Mic,
                title: "1. Dictate the facts",
                body: "Talk through tenure, accommodation, outside space, location and any Material Information you have to hand — or paste your notes.",
              },
              {
                icon: Sparkles,
                title: "2. Generate the pack",
                body: "Quill returns a Headline, 6–10 Key Features, a portal-ready description, a short teaser and Instagram, Facebook and X captions.",
              },
              {
                icon: Copy,
                title: "3. Copy to your portal",
                body: "Copy the whole pack or any single block into Rightmove, OnTheMarket, Zoopla or your agency site. Save it to history for later.",
              },
            ].map((step) => (
              <li key={step.title} className="list-none">
                <Card className="h-full p-5">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Facts to provide</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The more Material Information you supply, the more portal-ready the copy. Quill will
            never invent tenure, EPC, council tax band or period claims — missing facts are simply
            omitted.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Material Information</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Tenure (freehold, leasehold, share of freehold)",
                  "If leasehold: years remaining, ground rent, service charge",
                  "Council tax band and local authority",
                  "EPC rating and heating/fuel type",
                  "Guide price and any auction/tender terms",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Property & location</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Property type, style and approximate age",
                  "Bedrooms, bathrooms and reception rooms",
                  "Kitchen, utility, garden and parking arrangements",
                  "Distances to station, schools and amenities",
                  "Any private access notes to keep out of public copy",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Example generated Key Features</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quill writes each bullet strictly from the facts you supply — short, factual,
            non-duplicative.
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
                type explicitly says so. Any private viewing notes you type stay out of the public
                description and captions.
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
            14-day Starter trial. Card required at secure checkout. Cancel anytime.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="min-h-[44px]">
              <Link to="/auth" search={{ plan: "starter", market: "uk" }}>
                Create first pack
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[44px]">
              <Link to="/us-real-estate-listing-generator">US real estate version</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            <Link to="/" className="underline-offset-4 hover:underline">
              Back to {APP_NAME} home
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
