import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VOICES } from "@/lib/voices";
import { EXAMPLE_INPUT } from "@/lib/listing-types";
import { APP_NAME, LOGO_URL, PLANS, TRIAL_DAYS, CONTACT_EMAIL } from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";
import { Check, Sparkles, PenLine, Instagram, Facebook, Twitter, Home, Bed, Bath, Maximize, MapPin } from "lucide-react";

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
        <div className="relative mx-auto max-w-4xl px-5 pt-16 pb-24 text-center">
          <div className="mx-auto mb-6 inline-block">
            <img
              src={LOGO_URL}
              alt={`${APP_NAME} logo`}
              className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-primary/40 shadow-[0_12px_40px_-12px] shadow-primary/40"
            />
          </div>
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
            Plans from {PLANS[0].price}/month. Cancel anytime from your account.
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
            <Card
              key={v.id}
              className="group relative overflow-hidden border-border/70 bg-card/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_-20px] hover:shadow-primary/30"
            >
              <span className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-gradient-to-b from-primary to-gold transition-transform duration-300 group-hover:scale-y-100" />
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
              Enter the facts; {APP_NAME} writes every format you need. Here's a real
              Heritage-voice example with the headline, full listing, teaser and social pack.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => setShowOutput((s) => !s)}>
              {showOutput ? "Show the property details" : "Reveal the generated copy"}
            </Button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {/* Input */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
                <PenLine className="h-4 w-4" /> Property details (input)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat icon={Home} label="Type" value={EXAMPLE_INPUT.propertyType} />
                <Stat icon={MapPin} label="Location" value={EXAMPLE_INPUT.address} />
                <Stat icon={Bed} label="Bedrooms" value={EXAMPLE_INPUT.bedrooms} />
                <Stat icon={Bath} label="Bathrooms" value={EXAMPLE_INPUT.bathrooms} />
                <Stat icon={Maximize} label="Receptions" value={EXAMPLE_INPUT.receptions} />
                <Stat icon={Check} label="Tenure" value={EXAMPLE_INPUT.tenure} />
              </div>
              <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                <Row label="Voice" value={EXAMPLE_INPUT.voice} />
                <Row label="Price" value={`${EXAMPLE_INPUT.priceQualifier} £${EXAMPLE_INPUT.price}`} />
                <Row label="Tenure" value={`${EXAMPLE_INPUT.tenure}${EXAMPLE_INPUT.leaseYears ? ` (${EXAMPLE_INPUT.leaseYears} yrs)` : ""}`} />
                <Row label="EPC / Council Tax" value={`${EXAMPLE_INPUT.epc} / Band ${EXAMPLE_INPUT.councilTaxBand}`} />
                <Row label="Area highlights" value={EXAMPLE_INPUT.areaHighlights} />
                <Row label="Key features" value={EXAMPLE_INPUT.keyFeatures} />
                <Row label="Room dimensions" value={EXAMPLE_INPUT.dimensions} />
                <Row label="Outside space" value={EXAMPLE_INPUT.outsideSpace} />
                <Row label="Parking" value={EXAMPLE_INPUT.parking} />
                <Row label="Heating" value={EXAMPLE_INPUT.heating} />
                <Row label="Utilities / broadband" value={EXAMPLE_INPUT.utilities} />
                <Row label="Nearby" value={EXAMPLE_INPUT.nearby} />
                <Row label="Period features" value={EXAMPLE_INPUT.periodFeatures} />
                <Row label="Target audience" value={EXAMPLE_INPUT.targetAudience} />
              </dl>
            </Card>

            {/* Output */}
            <div className="space-y-5">
              {showOutput ? (
                <>
                  <Card className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" /> Headline
                    </div>
                    <p className="font-display text-xl font-semibold leading-snug">
                      {EXAMPLE_OUTPUT.headline}
                    </p>
                  </Card>

                  <Card className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                      <PenLine className="h-4 w-4" /> Full portal listing
                    </div>
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                      {EXAMPLE_OUTPUT.listing.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" /> Teaser
                    </div>
                    <p className="text-sm italic text-muted-foreground">{EXAMPLE_OUTPUT.summary}</p>
                  </Card>

                  <Card className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                      <Share2Icon /> Social pack
                    </div>
                    <div className="space-y-4">
                      {EXAMPLE_OUTPUT.social.map((s) => (
                        <div key={s.platform} className="rounded-lg border border-border/60 p-4">
                          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                            <s.icon className="h-3.5 w-3.5" /> {s.platform}
                          </div>
                          <p className="text-sm text-muted-foreground">{s.caption}</p>
                          <p className="mt-2 text-xs text-primary">{s.hashtags}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="flex h-full min-h-[320px] flex-col items-center justify-center p-10 text-center">
                  <Sparkles className="h-8 w-8 text-primary/60" />
                  <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                    Reveal the generated copy to see the headline, full listing, teaser and a
                    three-platform social pack — every format produced from the details on the left.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold">Plans that scale with your listings</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Every plan includes all four voices and the full social pack. Your listing allowance
            renews at the start of each month.
          </p>
        </div>
        <div className="mt-10 grid items-start gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-primary/50 bg-gradient-to-b from-card to-card/40 shadow-[0_30px_80px_-30px] shadow-primary/40"
                  : "border-border/70"
              }`}
            >
              {plan.popular && (
                <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-5 font-display text-4xl font-semibold">
                {plan.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="mt-1 text-sm text-primary">
                {plan.monthlyListings} listings / month · {TRIAL_DAYS}-day free trial
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" size="lg" variant={plan.popular ? "default" : "outline"}>
                <Link to={ctaTo}>Start free trial</Link>
              </Button>
            </Card>
          ))}
        </div>
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

const EXAMPLE_OUTPUT = {
  headline: "A Distinguished Grade II Listed Rectory in the Heart of Burford",
  listing: [
    "Set back from Church Lane behind a gravelled drive and a low honey-stone wall, The Old Rectory has watched over Burford since the early 18th century. It is a house of quiet confidence — Georgian additions softening its earlier origins — and one that rewards a slow, considered walk-through.",
    "Step inside and flagstone floors lead you between rooms of generous proportion. The drawing room (6.8m x 5.1m) is anchored by an inglenook fireplace, while exposed beams and original sash windows lend warmth and light in equal measure. At the heart of the home, a bespoke shaker kitchen and breakfast room (7.2m x 4.4m) opens onto the garden — the natural gathering place of the house.",
    "Three reception rooms, five bedrooms and three bathrooms are arranged over two principal floors, with a cellar below offering useful storage. Throughout, original joinery and fireplaces have been retained, the period character met with considered, everyday comfort.",
    "Beyond, a walled garden of around half an acre unfolds into mature herbaceous borders, a small orchard and a stone terrace made for long summer evenings. A gravel driveway and detached double cart shed complete the picture.",
    "Burford itself needs little introduction — a sought-after Cotswold market town with a honey-stone high street, independent shops and the River Windrush close by. Burford Primary (Ofsted Good) and The Burford School are within reach, with Charlbury station offering trains to London Paddington in around 80 minutes.",
  ],
  summary:
    "A characterful Grade II listed rectory with period detail, a half-acre walled garden and a coveted position in the heart of Burford — guide price £1,450,000.",
  social: [
    {
      platform: "Instagram",
      icon: Instagram,
      caption:
        "Period charm meets everyday comfort 🏡 A Grade II listed Cotswold rectory with an inglenook fireplace, flagstone floors and a half-acre walled garden in the heart of Burford. Guide £1,450,000.",
      hashtags: "#CotswoldHomes #BurfordProperty #PeriodHome #GradeIIListed #CountryLiving #PropertyForSale",
    },
    {
      platform: "Facebook",
      icon: Facebook,
      caption:
        "New to market — The Old Rectory, Burford. A distinguished 5-bedroom Grade II listed home of early 18th-century origins, with three reception rooms, a bespoke shaker kitchen and a half-acre walled garden. Charlbury station offers London Paddington in ~80 mins. Guide price £1,450,000 — get in touch to arrange a viewing.",
      hashtags: "#BurfordHomes #CotswoldsProperty #PeriodHome #ForSale",
    },
    {
      platform: "X",
      icon: Twitter,
      caption:
        "Just listed: a Grade II listed Cotswold rectory in the heart of Burford — 5 beds, half-acre walled garden, inglenook fireplace. Guide £1,450,000.",
      hashtags: "#PropertyForSale #Cotswolds #Burford",
    },
  ],
};

function Share2Icon() {
  return <Sparkles className="h-4 w-4" />;
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium" title={value}>{value || "—"}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-foreground">{value}</dd>
    </div>
  );
}
