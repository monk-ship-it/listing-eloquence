import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/config";
import { Check, ArrowRight, ShieldCheck, Mic, Sparkles, Copy } from "lucide-react";

const CANONICAL = "https://copybymonk.com/us-real-estate-listing-generator";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the copy MLS-ready?",
    a: "Yes. The Listing Description reads as MLS public remarks — an opening hook, then organised paragraphs on the home, layout, outdoor space and location, with US English throughout.",
  },
  {
    q: "Does Quill follow Fair Housing?",
    a: "Yes. The master prompt forbids protected-class references and school/safety overclaims. Copy describes the home, not the ideal buyer.",
  },
  {
    q: "How are Key Features generated?",
    a: "Quill produces 6–10 short, factual highlights drawn strictly from the facts you provide — square footage, HOA, taxes, notable features — with no invented claims.",
  },
  {
    q: "What exactly does one generation produce?",
    a: "One run returns a Headline, 6–10 Key Features, MLS-ready remarks, a Short Teaser and one caption each for Instagram, Facebook and X. Nothing else is generated.",
  },
  {
    q: "Where do private showing notes go?",
    a: "Private showing and access notes you type are treated as internal only — Quill keeps them out of the public MLS remarks, teaser and social captions.",
  },
  {
    q: "Is there a free trial?",
    a: "The Starter plan begins with a 14-day free trial. A card is required at secure checkout to start the trial, and you can cancel anytime before it ends without being charged.",
  },
];

export const Route = createFileRoute("/us-real-estate-listing-generator")({
  head: () => ({
    meta: [
      { title: `US Real Estate Listing Generator — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Turn one set of property notes into an MLS-ready US listing pack: Headline, 6–10 Key Features, MLS remarks, short teaser and Instagram, Facebook and X captions. Fair Housing aware.",
      },
      { property: "og:title", content: `US Real Estate Listing Generator — ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Headline, Key Features, MLS-ready remarks, teaser and Instagram/Facebook/X captions — written from your facts, in your voice.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `US Real Estate Listing Generator — ${APP_NAME}` },
      {
        name: "twitter:description",
        content:
          "One set of notes becomes a full US listing pack: Headline, Key Features, MLS remarks, teaser and Instagram/Facebook/X captions.",
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
  component: USPage,
});

function USPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <Logo withByline />
          </div>
          <nav className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/uk-property-listing-generator">UK version</Link>
            </Button>
            <Button asChild className="min-h-[44px]">
              <Link to="/auth" search={{ plan: "starter", market: "us" }}>
                Get started
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          For US real estate teams
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          US real estate listing generator with Fair Housing guardrails.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Dictate or paste the facts once. Quill writes MLS-ready remarks, generates the Headline
          and 6–10 Key Features highlights, and produces a short teaser plus Instagram, Facebook
          and X captions — all in US English, all from a single source of truth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-[44px]">
            <Link to="/auth" search={{ plan: "starter", market: "us" }}>
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
          <h2 className="font-display text-2xl font-semibold">What's in a US listing pack</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Headline written for MLS and search results",
              "6–10 Key Features highlights",
              "MLS-ready public remarks",
              "Short Teaser summary",
              "Instagram, Facebook and X captions",
              "Four brand voices tuned to US real estate",
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
                body: "Talk through beds, baths, square footage, lot, HOA, taxes and any disclosures you have to hand — or paste your notes.",
              },
              {
                icon: Sparkles,
                title: "2. Generate the pack",
                body: "Quill returns a Headline, 6–10 Key Features, MLS-ready remarks, a short teaser and Instagram, Facebook and X captions.",
              },
              {
                icon: Copy,
                title: "3. Paste into the MLS",
                body: "Copy the whole pack or any single block into your MLS, brokerage site or social scheduler. Save it to history for later.",
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
            The more accurate detail you supply, the more MLS-ready the copy. Quill will never
            invent square footage, HOA, taxes or year built — missing facts are omitted rather than
            fabricated.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Listing & MLS facts</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Beds, baths and approximate square footage",
                  "Lot size, year built and any recent renovations",
                  "HOA/COA fees, frequency and what they cover",
                  "Property taxes and any tax district notes",
                  "List price and financing terms accepted",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Disclosures & Fair Housing</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Known disclosures (flood zone, lead paint, permits)",
                  "Utilities, heating/cooling and appliance inclusions",
                  "Community amenities and access notes",
                  "Facts about the home — never about who should live there",
                  "Private showing/access notes stay internal, out of public remarks",
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
            Quill writes each highlight strictly from the facts you supply — short, factual,
            non-duplicative.
          </p>
          <Card className="mt-4 p-5">
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                "Fee simple single-family home",
                "4 beds, 3.5 baths, approx. 3,200 sq ft",
                "First-floor primary suite",
                "Chef's kitchen with quartz counters",
                "Heated saltwater pool on 0.25-acre lot",
                "Three-car attached garage",
                "HOA approx. $90 / month",
                "Built 2016; roof replaced 2021",
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
                Quill's master prompt refuses to invent square footage, HOA, taxes or year built.
                Fair Housing rules forbid protected-class targeting or school/safety overclaims.
                Disclosures are only mentioned when the facts are provided, and any private showing
                notes you type stay internal — never surfaced in public MLS remarks or captions.
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
          <h2 className="font-display text-2xl font-semibold">Try it on your next listing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            14-day Starter trial. Card required at secure checkout. Cancel anytime.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="min-h-[44px]">
              <Link to="/auth" search={{ plan: "starter", market: "us" }}>
                Create first pack
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[44px]">
              <Link to="/uk-property-listing-generator">UK property version</Link>
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
