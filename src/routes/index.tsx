import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME, PLANS, TRIAL_DAYS, CONTACT_EMAIL } from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";
import {
  Check,
  Mic,
  ArrowRight,
  Pencil,
  Sparkles,
  FileText,
  Instagram,
  Facebook,
  Mail,
  Music2,
  Loader2,
  Quote,
  Building2,
  AudioLines,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quill — Voice-to-Listing AI for UK Estate Agents" },
      {
        name: "description",
        content:
          "Speak your property notes into Quill and generate portal-ready listings, social captions and buyer emails in minutes. Premium AI listing writer with voice dictation for UK estate agents.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/app" : "/auth";

  return (
    <div className="min-h-screen">
      <Header user={!!user} />
      <Hero ctaTo={ctaTo} />
      <VoiceValue />
      <HowItWorks />
      <Voices />
      <LiveExample />
      <VoiceDictation ctaTo={ctaTo} />
      <Pricing ctaTo={ctaTo} />
      <FinalCta ctaTo={ctaTo} />
      <Footer />
    </div>
  );
}

/* ---------------------------------- Header --------------------------------- */

function Header({ user }: { user: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Logo withByline />
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <Button asChild className="shadow-[0_8px_30px_-12px] shadow-primary/60">
              <Link to="/app">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="Log in">
                <Link to="/auth">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="shadow-[0_8px_30px_-12px] shadow-primary/60 transition-shadow hover:shadow-[0_10px_36px_-10px] hover:shadow-primary/70"
              >
                <Link to="/auth">Start free trial</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ----------------------------------- Hero ---------------------------------- */

function Hero({ ctaTo }: { ctaTo: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
        {/* Left */}
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <AudioLines className="h-3.5 w-3.5" /> AI listing writer with voice dictation
            </span>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mt-6 text-balance font-display text-[2.6rem] font-semibold leading-[1.04] text-gradient sm:text-5xl lg:text-6xl">
              Speak it, type it, or paste it — {APP_NAME} turns property details into polished listing
              copy.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {APP_NAME} lets UK estate agents dictate, type or paste property details, choose a brand
              voice, and generate portal-ready listings, social captions and buyer emails in minutes —
              without another CRM to manage.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                asChild
                size="lg"
                className="shadow-[0_14px_44px_-16px] shadow-primary/70 transition-shadow hover:shadow-[0_18px_52px_-14px] hover:shadow-primary/80"
              >
                <Link to={ctaTo}>Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15">
                <a href="#voice-demo">Try voice dictation</a>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="#example">Type or paste an example</a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-4 text-sm text-muted-foreground">
              Built for busy UK estate agents. Cancel anytime.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {["Voice notes in", "Listing copy out", "Editable before generation"].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/90"
                >
                  <Check className="h-3.5 w-3.5 text-primary" /> {chip}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right — product mockup */}
        <Reveal delay={120} className="relative">
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-radial-glow blur-2xl" />
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="glass-strong glow-primary mx-auto w-full max-w-md rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <Mic className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-medium">Voice capture</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Listening…
        </span>
      </div>

      {/* Mic + waveform */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/50 p-4">
        <span className="mic-pulse grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_8px] shadow-primary/15">
          <Mic className="h-5 w-5" />
        </span>
        <div className="flex h-9 flex-1 items-center gap-1">
          {WAVE_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className="wave-bar w-1 rounded-full bg-primary/70"
              style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Spoken note */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-background/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">Spoken note</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          "Five-bedroom detached home, walled garden, period features, gravel driveway…"
        </p>
      </div>

      {/* Transcribing */}
      <div className="mt-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Transcribing…
      </div>

      {/* Structured field */}
      <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
        <p className="text-xs font-medium text-primary">Property details</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          Five-bedroom detached home with a walled garden, period features and a gravel driveway.
        </p>
      </div>

      {/* Generated preview */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-background/50 p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Listing preview
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A handsome five-bedroom detached home set behind a gravel driveway, with period character
          throughout and a private walled garden made for long summer evenings.
        </p>
      </div>
    </div>
  );
}

const WAVE_HEIGHTS = [40, 70, 95, 60, 85, 50, 75, 100, 55, 80, 45, 90, 60, 70, 40];

/* ------------------------------ Voice value -------------------------------- */

function VoiceValue() {
  const cards = [
    {
      icon: Mic,
      title: "Dictate property details",
      body: "Speak room notes, features, garden details, parking, local highlights and agent observations.",
    },
    {
      icon: Pencil,
      title: "Edit before generating",
      body: "Quill keeps the agent in control. Clean the notes, add missing facts, then generate.",
    },
    {
      icon: Sparkles,
      title: "Create the full pack",
      body: "Portal description, social captions, buyer email and vendor update from one set of spoken notes.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Built for agents who do not have time to type.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Between valuations, viewings and vendor calls, typing listing notes is dead time. Quill
          lets agents speak naturally, clean up the details, and generate the full marketing pack
          from there.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 90}>
            <Card className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-30px] hover:shadow-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ How it works ------------------------------- */

function HowItWorks() {
  const steps = [
    {
      icon: Mic,
      title: "Speak or paste the details",
      body: "Add notes by voice, typed text or copied property information.",
    },
    {
      icon: Building2,
      title: "Choose the brand voice",
      body: "Select Professional, Premium, Luxury or Heritage depending on the property.",
    },
    {
      icon: Sparkles,
      title: "Generate and edit",
      body: "Quill creates the listing, social captions and emails. You stay in control before using the copy.",
    },
  ];
  return (
    <section className="border-y border-white/10 bg-card/30 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            From spoken notes to finished listing pack.
          </h2>
        </Reveal>
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {/* connecting line on desktop */}
          <div className="pointer-events-none absolute left-0 right-0 top-[2.25rem] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 110} className="relative">
              <div className="flex flex-col items-center text-center">
                <span className="relative z-10 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl border border-primary/30 bg-background text-primary shadow-[0_16px_40px_-20px] shadow-primary/50">
                  <s.icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="mx-auto mt-4 h-5 w-5 rotate-90 text-primary/50 md:hidden" />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Voices ---------------------------------- */

const VOICE_CARDS = [
  {
    name: "Professional",
    tagline: "Clear. Polished. Direct.",
    body: "Confident everyday listing copy for high-street and independent agencies.",
    sample:
      "A well-presented family home with practical living space and a strong village setting.",
  },
  {
    name: "Premium",
    tagline: "Restrained. Lifestyle-led. Considered.",
    body: "For upper-market homes where rhythm, tone and buyer aspiration matter.",
    sample:
      "A calm, carefully arranged home with generous rooms and a natural sense of flow.",
  },
  {
    name: "Luxury",
    tagline: "Quiet authority. Architectural detail.",
    body: "For prime and country homes where less is more.",
    sample: "A substantial residence defined by proportion, privacy and considered detail.",
  },
  {
    name: "Heritage",
    tagline: "Atmosphere. History. Local charm.",
    body: "For period homes, village settings and character properties that need a guided walk-through.",
    sample:
      "Beyond the old stone threshold, the house opens with warmth, texture and a clear sense of place.",
  },
];

function Voices() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Four crafted voices for different properties.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the tone that fits the home, the market and the agency brand.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VOICE_CARDS.map((v, i) => (
          <Reveal key={v.name} delay={i * 80}>
            <Card className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_24px_60px_-30px] hover:shadow-primary/40">
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-gold" />
              <h3 className="text-xl font-semibold">{v.name}</h3>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                {v.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              <div className="mt-5 rounded-xl border border-white/10 bg-background/50 p-4">
                <Quote className="h-4 w-4 text-primary/60" />
                <p className="mt-2 text-sm italic leading-relaxed text-foreground/90">
                  {v.sample}
                </p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ Live example ------------------------------- */

function LiveExample() {
  const facts: [string, string][] = [
    ["Type", "Grade II listed detached period home"],
    ["Location", "Cotswold market town"],
    ["Bedrooms", "5"],
    ["Bathrooms", "3"],
    ["Receptions", "3"],
    ["Price", "Guide Price £1,450,000"],
    ["Tenure", "Freehold"],
    [
      "Key features",
      "Inglenook fireplace, flagstone floors, exposed beams, bespoke kitchen, cellar, original sash windows",
    ],
    ["Outside space", "Walled garden, mature borders, orchard, stone terrace"],
    ["Parking", "Gravel driveway and detached double cart shed"],
    ["Voice", "Heritage"],
  ];

  return (
    <section id="example" className="border-y border-white/10 bg-card/30 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            See what Quill creates from simple property notes.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Dictate the details once. Quill shapes them into the formats agents need.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-2">
          {/* In */}
          <Reveal>
            <Card className="glass h-full rounded-2xl p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileText className="h-4 w-4" /> Property details in
              </div>

              <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Mic className="h-3.5 w-3.5" /> Voice note captured
                </div>
                <p className="mt-1.5 text-sm italic leading-relaxed text-foreground/90">
                  "Five bedrooms, Grade II listed, walled garden, original beams, period fireplaces,
                  near the high street…"
                </p>
              </div>

              <dl className="mt-4 divide-y divide-white/5 text-sm">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2.5">
                    <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="flex-1 text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>

          {/* Out */}
          <Reveal delay={120}>
            <Card className="glass h-full rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" /> Marketing pack out
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Generated in seconds
                </span>
              </div>

              <Tabs defaultValue="listing" className="mt-4">
                <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-background/50">
                  <TabsTrigger value="listing">Listing</TabsTrigger>
                  <TabsTrigger value="instagram">Instagram</TabsTrigger>
                  <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                  <TabsTrigger value="facebook">Facebook</TabsTrigger>
                  <TabsTrigger value="email">Buyer email</TabsTrigger>
                </TabsList>

                <TabsContent value="listing" className="mt-4">
                  <h3 className="font-display text-lg font-semibold leading-snug">
                    {DEMO.headline}
                  </h3>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {DEMO.listing.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="instagram" className="mt-4">
                  <SocialBlock
                    icon={Instagram}
                    label="Instagram"
                    caption={DEMO.instagram.caption}
                    hashtags={DEMO.instagram.hashtags}
                  />
                </TabsContent>

                <TabsContent value="tiktok" className="mt-4">
                  <SocialBlock
                    icon={Music2}
                    label="TikTok"
                    caption={DEMO.tiktok.caption}
                    hashtags={DEMO.tiktok.hashtags}
                  />
                </TabsContent>

                <TabsContent value="facebook" className="mt-4">
                  <SocialBlock
                    icon={Facebook}
                    label="Facebook"
                    caption={DEMO.facebook.caption}
                    hashtags={DEMO.facebook.hashtags}
                  />
                </TabsContent>

                <TabsContent value="email" className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Mail className="h-3.5 w-3.5" /> Buyer email
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{DEMO.email.subject}</p>
                  <div className="mt-2 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                    {DEMO.email.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function SocialBlock({
  icon: Icon,
  label,
  caption,
  hashtags,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  caption: string;
  hashtags: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{caption}</p>
      <p className="mt-3 text-sm text-primary">{hashtags}</p>
    </div>
  );
}

const DEMO = {
  headline: "A Distinguished Grade II Listed Home in the Heart of a Cotswold Market Town",
  listing: [
    "Set back behind a gravel driveway and a low honey-stone wall, this Grade II listed home carries the quiet confidence of a house that has watched over its market town for generations. It rewards a slow, considered walk-through.",
    "Inside, flagstone floors lead between rooms of generous proportion. The drawing room is anchored by an inglenook fireplace, while exposed beams and original sash windows bring warmth and light in equal measure. A bespoke kitchen sits at the heart of the home, opening onto the garden.",
    "Five bedrooms, three bathrooms and three reception rooms are arranged with a cellar below for useful storage. Beyond, a walled garden unfolds into mature borders, an orchard and a stone terrace made for long summer evenings.",
  ],
  instagram: {
    caption:
      "Period charm meets everyday comfort. A Grade II listed Cotswold home with an inglenook fireplace, flagstone floors and a walled garden. Guide £1,450,000. Book your viewing today.",
    hashtags: "#CotswoldHomes #PeriodHome #GradeIIListed #CountryLiving #PropertyForSale",
  },
  tiktok: {
    caption:
      "Come walk through this Grade II listed Cotswold home — original beams, an inglenook fireplace and a walled garden you won't want to leave. Guide £1,450,000.",
    hashtags: "#PropertyTok #CotswoldHome #HouseTour #PeriodProperty #EstateAgent",
  },
  facebook: {
    caption:
      "New to market — a distinguished 5-bedroom Grade II listed home in the heart of a Cotswold market town. Three reception rooms, a bespoke kitchen and a private walled garden. Guide price £1,450,000 — get in touch to arrange a viewing.",
    hashtags: "#CotswoldsProperty #PeriodHome #ForSale",
  },
  email: {
    subject: "A characterful Grade II listed home I think you'll want to see",
    body: [
      "Hi there,",
      "Based on what you're looking for, I wanted to share a five-bedroom Grade II listed home that has just come to market in the heart of a Cotswold market town. It has an inglenook fireplace, original beams and a private walled garden, all within walking distance of the high street.",
      "Guide price is £1,450,000. I'd be happy to arrange a private viewing at a time that suits you — just let me know.",
    ],
  },
};

/* ----------------------------- Voice dictation ----------------------------- */

function VoiceDictation({ ctaTo }: { ctaTo: string }) {
  const bullets = [
    "Dictate notes into any field",
    "Add to existing text without overwriting it",
    "Edit before generating",
    "Useful between viewings, valuations and vendor calls",
    "Works for features, room notes, gardens, parking and local highlights",
  ];
  return (
    <section id="voice-demo" className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Mic className="h-3.5 w-3.5" /> Voice dictation
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
            Talk your listing into shape.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Tap the mic, describe the property, and Quill turns spoken notes into clean, editable
            listing text.
          </p>
          <ul className="mt-7 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 shadow-[0_14px_44px_-16px] shadow-primary/70">
            <Link to={ctaTo}>Try voice dictation free</Link>
          </Button>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-radial-glow blur-2xl" />
          <Card className="glass-strong glow-primary rounded-3xl p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/50 p-4">
              <span className="mic-pulse grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_8px] shadow-primary/15">
                <Mic className="h-5 w-5" />
              </span>
              <div className="flex h-9 flex-1 items-center gap-1">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="wave-bar w-1 rounded-full bg-primary/70"
                    style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Listening…
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Transcribing…
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Spoken note</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                "The kitchen has a Rangemaster cooker, quartz worktops and bi-fold doors onto a
                south-facing garden with a decked terrace…"
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-primary">Key features (editable)</p>
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-primary">
                  <Mic className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                Rangemaster cooker, quartz worktops and bi-fold doors opening onto a south-facing
                garden with a decked terrace.
              </p>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Pricing --------------------------------- */

function Pricing({ ctaTo }: { ctaTo: string }) {
  return (
    <section id="pricing" className="border-y border-white/10 bg-card/30 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Plans that scale with your listings.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every plan includes voice dictation, all four brand voices and the full social pack.
          </p>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 90} className="h-full">
              <Card
                className={`relative flex h-full flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                  plan.popular
                    ? "glass-strong glow-primary border-primary/50 md:scale-[1.03]"
                    : "glass hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-[0_8px_24px_-8px] shadow-primary/70">
                    Best value
                  </span>
                )}
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-5 font-display text-4xl font-semibold">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <p className="mt-1.5 text-sm font-medium text-primary">
                  {plan.monthlyListings} listings per month
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {TRIAL_DAYS}-day free trial · cancel anytime
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {orderedFeatures(plan.features).map((f, idx) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${idx === 0 ? "text-primary" : "text-primary/70"}`}
                      />
                      <span className={idx === 0 ? "font-medium text-foreground" : "text-foreground/90"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`mt-8 w-full ${plan.popular ? "shadow-[0_14px_44px_-16px] shadow-primary/70" : ""}`}
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to={ctaTo}>Start free trial</Link>
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Surface "Voice dictation on every field" first — it's the headline feature. */
function orderedFeatures(features: string[]): string[] {
  const voice = features.filter((f) => /voice dictation/i.test(f));
  const rest = features.filter((f) => !/voice dictation/i.test(f));
  const baseExtras = [
    "Portal-ready descriptions",
    "Social captions with hashtags",
  ];
  // Merge in any base extras not already present, keeping each plan's own list.
  const merged = [...rest];
  for (const extra of baseExtras) {
    if (!merged.some((f) => f.toLowerCase() === extra.toLowerCase())) {
      // insert after listings allowance + voices if available
      merged.push(extra);
    }
  }
  return [...voice, ...merged];
}

/* -------------------------------- Final CTA -------------------------------- */

function FinalCta({ ctaTo }: { ctaTo: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <Reveal>
        <div className="glass-strong glow-primary relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-70" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Your next listing does not need to start with a blank page.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Speak the notes. Choose the voice. Let Quill shape the copy.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" className="shadow-[0_14px_44px_-16px] shadow-primary/70">
                <Link to={ctaTo}>Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15">
                <a href="#voice-demo">See voice demo</a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Footer ---------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row">
        <Logo withByline />
        <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-foreground">
          {CONTACT_EMAIL}
        </a>
        <p>© 2026 {APP_NAME}. Crafted for UK estate agents.</p>
      </div>
    </footer>
  );
}
