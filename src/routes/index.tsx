import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME, PLANS, TRIAL_DAYS, CONTACT_EMAIL, type PlanId } from "@/lib/config";
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
  Building2,
  AudioLines,
  ClipboardPaste,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quill — Voice-to-Listing AI for UK Estate Agents" },
      {
        name: "description",
        content:
          "Speak your property notes into Quill to generate portal-ready listings, social captions and buyer emails in minutes. AI listing writer for UK estate agents.",
      },
      {
        property: "og:title",
        content: "Quill — Voice-to-Listing AI for UK Estate Agents",
      },
      {
        property: "og:description",
        content:
          "Speak your property notes and generate portal-ready listings, social captions and buyer emails in minutes.",
      },
      { property: "og:url", content: "https://copybymonk.com/" },
    ],
    links: [{ rel: "canonical", href: "https://copybymonk.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Quill",
          url: "https://copybymonk.com/",
          description:
            "AI listing writer with voice dictation for UK estate agents.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Quill",
          url: "https://copybymonk.com/",
          description:
            "Quill generates portal-ready UK property listings, social captions and buyer emails from voice or typed notes.",
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const authed = !!user;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header user={authed} />
      <Hero authed={authed} />
      <VoiceValue />
      <HowItWorks />
      <Voices />
      <LiveExample />
      <VoiceDictation authed={authed} />
      <Pricing authed={authed} />
      <FinalCta authed={authed} />
      <Footer />
    </div>
  );
}

/**
 * A "Start free trial"-style CTA that preserves the chosen plan and routes
 * signed-in users straight to checkout, signed-out users to sign up.
 */
function CtaButton({
  authed,
  plan = "starter",
  children,
  ...rest
}: {
  authed: boolean;
  plan?: PlanId;
  children: React.ReactNode;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  return (
    <Button asChild {...rest}>
      <Link to={authed ? "/subscription" : "/auth"} search={{ plan }}>
        {children}
      </Link>
    </Button>
  );
}

/* --------------------------------- Shared --------------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow inline-block">{children}</span>;
}

/* ---------------------------------- Header --------------------------------- */

function Header({ user }: { user: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Logo withByline />
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <Button asChild>
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
              <Button asChild>
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

const HERO_CHIPS = [
  "Built for UK estate agents",
  "Portal-ready copy",
  "Voice notes in minutes",
  "No CRM migration",
];

function Hero({ authed }: { authed: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-radial-glow opacity-60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28 lg:pt-20">
        {/* Left — critical above-the-fold content renders immediately (no reveal). */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <AudioLines className="h-3.5 w-3.5" /> AI listing writer with voice dictation
          </span>

          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,8vw,2.6rem)] font-semibold leading-[1.12] sm:mt-6 sm:text-5xl lg:text-[3.6rem]">
            Write every listing in minutes — <span className="text-gradient">just say the words.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {APP_NAME} lets UK estate agents speak, type or paste property details, choose a brand
            voice, and generate portal-ready listings, social captions and buyer emails in minutes —
            without another CRM to manage.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <CtaButton authed={authed} size="lg" className="w-full sm:w-auto">
              Start free trial
            </CtaButton>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-border bg-card/60 hover:bg-card sm:w-auto"
            >
              <a href="#voice-demo">Try voice dictation</a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
              <a href="#example">See an example</a>
            </Button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {TRIAL_DAYS}-day free trial · cancel anytime
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {HERO_CHIPS.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground/90"
              >
                <Check className="h-3.5 w-3.5 text-primary" /> {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Right — product mockup */}
        <Reveal delay={120} className="relative min-w-0">
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-radial-glow opacity-70 blur-2xl" />
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="glow-primary mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-4 shadow-2xl shadow-black/20 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium">Add property details</span>
        <span className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Speak · type · paste
        </span>
      </div>

      {/* Input method switcher */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 p-2.5 text-primary">
          <Mic className="h-4 w-4" />
          <span className="text-[0.7rem] font-semibold">Dictate</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/50 p-2.5 text-foreground/80">
          <Pencil className="h-4 w-4" />
          <span className="text-[0.7rem] font-medium">Type</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/50 p-2.5 text-foreground/80">
          <ClipboardPaste className="h-4 w-4" />
          <span className="text-[0.7rem] font-medium">Paste</span>
        </div>
      </div>

      {/* Mic + waveform */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
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
        <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Listening…
        </span>
      </div>

      {/* Generated preview */}
      <div className="mt-3 rounded-2xl border border-border bg-background/50 p-4">
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
      title: "Dictate full property notes",
      body: "Speak the rough notes into one dedicated voice notes field, then add exact facts in the structured fields.",
    },
    {
      icon: ClipboardPaste,
      title: "Type or paste details",
      body: "Enter facts manually or paste rough notes, valuation text or existing property information.",
    },
    {
      icon: Sparkles,
      title: "Generate the full pack",
      body: "Create the portal description, social captions, buyer email and vendor update from one set of property details.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>Three ways in</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          Built for agents who need notes captured fast.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Some agents prefer to dictate between viewings. Others want to type, paste or tidy existing
          notes. Quill supports all three, then turns those details into a complete listing pack.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 90} className="bg-card">
            <div className="group h-full p-7 transition-colors duration-300 hover:bg-accent/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
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
      title: "Speak, type or paste the details",
      body: "Add property notes by voice, manual typing or copied text from existing instructions.",
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
    <section className="border-y border-border bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            From spoken notes to finished listing pack.
          </h2>
        </Reveal>
        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-[2.25rem] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 110} className="relative">
              <div className="flex flex-col items-center text-center">
                <span className="relative z-10 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl border border-primary/30 bg-background text-primary">
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
    sample: "A calm, carefully arranged home with generous rooms and a natural sense of flow.",
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
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>Brand voices</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          Four crafted voices for different properties.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the tone that fits the home, the market and the agency brand.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VOICE_CARDS.map((v, i) => (
          <Reveal key={v.name} delay={i * 80} className="h-full">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-gold" />
              <h3 className="text-xl font-semibold">{v.name}</h3>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                {v.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              <p className="mt-auto border-t border-border pt-4 text-sm italic leading-relaxed text-foreground/90">
                “{v.sample}”
              </p>
            </div>
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
    <section id="example" className="panel-ivory border-y border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Worked example</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            See what Quill creates from simple property notes.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Speak, type or paste the details once. Quill shapes them into the formats agents need.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-2">
          {/* In */}
          <Reveal>
            <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileText className="h-4 w-4" /> Property details in
              </div>

              <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Mic className="h-3.5 w-3.5" /> Spoken, typed or pasted
                </div>
                <p className="mt-1.5 text-sm italic leading-relaxed text-foreground/90">
                  “Five bedrooms, Grade II listed, walled garden, original beams, period fireplaces,
                  near the high street…”
                </p>
              </div>

              <dl className="mt-4 divide-y divide-border text-sm">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
                    <dt className="shrink-0 text-muted-foreground sm:w-28">{label}</dt>
                    <dd className="flex-1 text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* Out */}
          <Reveal delay={120}>
            <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4 shrink-0" /> Marketing pack out
                </div>
                <span className="self-start rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:self-auto">
                  Generated in seconds
                </span>
              </div>

              <Tabs defaultValue="listing" className="mt-4">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary p-1">
                  <TabsTrigger value="listing">Listing</TabsTrigger>
                  <TabsTrigger value="instagram">Instagram</TabsTrigger>
                  <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                  <TabsTrigger value="facebook">Facebook</TabsTrigger>
                  <TabsTrigger value="email">Buyer email</TabsTrigger>
                </TabsList>

                <TabsContent value="listing" className="mt-4">
                  <h3 className="font-display text-lg font-semibold leading-snug">{DEMO.headline}</h3>
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
            </div>
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

function VoiceDictation({ authed }: { authed: boolean }) {
  const bullets = [
    "Dictate notes into any field",
    "Add to existing text without overwriting it",
    "Edit before generating",
    "Useful between viewings, valuations and vendor calls",
    "Works for features, room notes, gardens, parking and local highlights",
  ];
  return (
    <section id="voice-demo" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Mic className="h-3.5 w-3.5" /> Voice dictation
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
            Talk your listing into shape.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Dictate the rough notes in one dedicated voice notes field, then add exact facts in the
            structured fields. Prefer to type or paste? Every field works that way too.
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
          <CtaButton authed={authed} size="lg" className="mt-8">
            Try voice dictation free
          </CtaButton>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-radial-glow opacity-60 blur-2xl" />
          <div className="glow-primary rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-4">
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

            <div className="mt-3 rounded-2xl border border-border bg-background/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Spoken note</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                “The kitchen has a Rangemaster cooker, quartz worktops and bi-fold doors onto a
                south-facing garden with a decked terrace…”
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-primary">Key features (editable)</p>
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-border text-primary">
                  <Mic className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                Rangemaster cooker, quartz worktops and bi-fold doors opening onto a south-facing
                garden with a decked terrace.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Pricing --------------------------------- */

function Pricing({ ctaTo }: { ctaTo: string }) {
  return (
    <section id="pricing" className="border-y border-border bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Plans that scale with your listings.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every plan includes voice dictation, all four brand voices and the full social pack.
          </p>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 90} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "glow-primary border-primary/50 bg-card md:scale-[1.03]"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
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
                  {plan.id === "starter"
                    ? `${TRIAL_DAYS}-day free trial · cancel anytime`
                    : "Cancel anytime"}
                </p>
                <div className="rule my-6" />
                <ul className="flex-1 space-y-3 text-sm">
                  {orderedFeatures(plan.features).map((f, idx) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${idx === 0 ? "text-primary" : "text-primary/70"}`}
                      />
                      <span
                        className={idx === 0 ? "font-medium text-foreground" : "text-foreground/90"}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to={ctaTo}>{plan.id === "starter" ? "Start free trial" : "Get started"}</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Annual plans available with two months free.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Surface the dedicated voice notes feature first — it's the headline feature. */
function orderedFeatures(features: string[]): string[] {
  const voice = features.filter((f) => /voice notes|voice dictation/i.test(f));
  const rest = features.filter((f) => !/voice notes|voice dictation/i.test(f));
  const baseExtras = ["Portal-ready descriptions", "Social captions with hashtags"];
  const merged = [...rest];
  for (const extra of baseExtras) {
    if (!merged.some((f) => f.toLowerCase() === extra.toLowerCase())) {
      merged.push(extra);
    }
  }
  return [...voice, ...merged];
}

/* -------------------------------- Final CTA -------------------------------- */

function FinalCta({ ctaTo }: { ctaTo: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <Reveal>
        <div className="glow-primary relative overflow-hidden rounded-3xl border border-primary/30 bg-card px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-70" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Your next listing does not need to start with a blank page.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Speak, type or paste the notes. Choose the voice. Generate the listing pack.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to={ctaTo}>Start free trial</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-border bg-card/60 hover:bg-card sm:w-auto"
              >
                <a href="#voice-demo">Try voice dictation</a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Footer --------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 text-center text-sm text-muted-foreground sm:flex-row sm:gap-4 sm:text-left">
        <Logo withByline />
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="break-all transition-colors hover:text-foreground"
        >
          {CONTACT_EMAIL}
        </a>
        <p>© 2026 {APP_NAME}. Crafted for UK estate agents.</p>
      </div>
    </footer>
  );
}
