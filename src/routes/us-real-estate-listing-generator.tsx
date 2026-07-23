import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/config";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";

const CANONICAL = "https://copybymonk.com/us-real-estate-listing-generator";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the copy MLS-ready?",
    a: "Yes. The listing body reads as MLS remarks — an opening hook, then organised paragraphs on the home, layout, outdoor space and location, with US English throughout.",
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
    q: "Where do showing notes go?",
    a: "Showing and access instructions stay out of the public MLS remarks and social captions. Quill uses them only in the buyer email where scheduling is appropriate.",
  },
];

export const Route = createFileRoute("/us-real-estate-listing-generator")({
  head: () => ({
    meta: [
      { title: `US Real Estate Listing Generator — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Turn one set of property notes into an MLS-ready US listing pack: remarks, Key Features highlights, teaser, social captions and buyer email. Fair Housing aware.",
      },
      { property: "og:title", content: `US Real Estate Listing Generator — ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "MLS-ready remarks, Key Features highlights, teasers and social captions — written from your facts, in your voice.",
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
  component: USPage,
});

function USPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Logo withByline />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/uk-property-listing-generator">UK version</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ plan: "starter", market: "us" }}>
                Start free trial
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">For US real estate teams</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          US real estate listing generator with Fair Housing guardrails.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Dictate or paste the facts once. Quill writes MLS-ready remarks, generates Key Features
          highlights, and produces the teaser, social captions and buyer email — all in US English,
          all from a single source of truth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ plan: "starter", market: "us" }}>
              Create first pack <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">See the workflow</Link>
          </Button>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">What's in a US listing pack</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "MLS-ready public remarks",
              "6–10 Key Features highlights",
              "Short teaser summary",
              "Instagram, Facebook and X captions",
              "Buyer follow-up email with showing notes",
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
          <h2 className="font-display text-2xl font-semibold">Example generated Key Features</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quill writes each highlight strictly from the facts you supply — short, factual, non-duplicative.
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
                Disclosures are only mentioned when the facts are provided; showing notes stay in
                the buyer email, never in public MLS remarks.
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
            14-day free trial. No MLS migration. Cancel anytime.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ plan: "starter", market: "us" }}>
                Create first pack
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/uk-property-listing-generator">UK version</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
