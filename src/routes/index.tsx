import { createFileRoute, Link } from "@tanstack/react-router";
import { createContext, useContext, useState } from "react";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  APP_NAME,
  PLANS,
  TRIAL_DAYS,
  CONTACT_EMAIL,
  MARKETS,
  DEFAULT_MARKET,
  planPriceDisplay,
  type PlanId,
  type MarketId,
} from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";
import {
  Check,
  Mic,
  ArrowRight,
  ArrowLeftRight,
  Pencil,
  Sparkles,
  FileText,
  Instagram,
  Facebook,
  Building2,
  AudioLines,
  ClipboardPaste,
  ShieldCheck,
  Home,
  Wallet,
  Thermometer,
  MapPin,
  Megaphone,
  Mail,
} from "lucide-react";
import { EMAIL_BLAST_PLACEHOLDERS } from "@/lib/listing-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quill — One Set of Notes, a Complete Listing Pack" },
      {
        name: "description",
        content:
          "Quill helps UK estate agents and US real estate teams turn one set of property notes into a full listing pack: Headline, 6–10 Key Features, a portal-ready UK description or MLS-ready remarks, a short teaser, Email Blast copy and Instagram, Facebook and X captions.",
      },
      {
        property: "og:title",
        content: "Quill — One Set of Notes, a Complete Listing Pack",
      },
      {
        property: "og:description",
        content:
          "Turn one set of property notes into a Headline, 6–10 Key Features, a portal or MLS description, a short teaser, Email Blast copy and Instagram, Facebook and X captions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://copybymonk.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Quill — One Set of Notes, a Complete Listing Pack",
      },
      {
        name: "twitter:description",
        content:
          "Turn one set of property notes into a Headline, 6–10 Key Features, a portal or MLS description, a short teaser, Email Blast copy and Instagram, Facebook and X captions.",
      },
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
            "Quill turns one set of property notes into a complete listing pack for UK estate agents and US real estate teams.",
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
            "Quill removes repetitive listing admin between instruction and launch — generating a Headline, Key Features, the portal or MLS description, a short teaser, Email Blast copy and Instagram, Facebook and X captions from one source of truth.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Quill",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://copybymonk.com/",
          description:
            "AI listing pack generator for UK estate agents and US real estate teams. One set of notes becomes a Headline, 6–10 Key Features, a portal-ready UK description or MLS-ready remarks, a short teaser, Email Blast copy and Instagram, Facebook and X captions.",
          offers: [
            {
              "@type": "Offer",
              name: "Starter (UK)",
              price: "39",
              priceCurrency: "GBP",
              category: "subscription",
              url: "https://copybymonk.com/uk-property-listing-generator",
            },
            {
              "@type": "Offer",
              name: "Pro (UK)",
              price: "79",
              priceCurrency: "GBP",
              category: "subscription",
              url: "https://copybymonk.com/uk-property-listing-generator",
            },
            {
              "@type": "Offer",
              name: "Growth (UK)",
              price: "149",
              priceCurrency: "GBP",
              category: "subscription",
              url: "https://copybymonk.com/uk-property-listing-generator",
            },
            {
              "@type": "Offer",
              name: "Starter (US)",
              price: "49",
              priceCurrency: "USD",
              category: "subscription",
              url: "https://copybymonk.com/us-real-estate-listing-generator",
            },
            {
              "@type": "Offer",
              name: "Pro (US)",
              price: "99",
              priceCurrency: "USD",
              category: "subscription",
              url: "https://copybymonk.com/us-real-estate-listing-generator",
            },
            {
              "@type": "Offer",
              name: "Growth (US)",
              price: "199",
              priceCurrency: "USD",
              category: "subscription",
              url: "https://copybymonk.com/us-real-estate-listing-generator",
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

const MarketContext = createContext<{
  market: MarketId;
  setMarket: (m: MarketId) => void;
}>({ market: DEFAULT_MARKET, setMarket: () => {} });

function useMarket() {
  return useContext(MarketContext);
}

function Landing() {
  const { user } = useAuth();
  const authed = !!user;
  const [market, setMarket] = useState<MarketId>(DEFAULT_MARKET);

  return (
    <MarketContext.Provider value={{ market, setMarket }}>
      <div className="min-h-screen overflow-x-hidden">
        <Header user={authed} />
        <Hero authed={authed} />
        <VoiceValue />
        <HowItWorks />
        <ListingDetail />
        <Voices />
        <LiveExample />
        <VoiceDictation authed={authed} />
        <Pricing authed={authed} />
        <FinalCta authed={authed} />
        <Footer />
      </div>
    </MarketContext.Provider>
  );
}

/** Segmented UK / US market + currency toggle. */
function MarketToggle({ className = "" }: { className?: string }) {
  const { market, setMarket } = useMarket();
  return (
    <div
      className={`inline-flex rounded-full border border-border/70 bg-card/50 p-1 backdrop-blur ${className}`}
      role="tablist"
      aria-label="Choose your market"
    >
      {Object.values(MARKETS).map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={market === m.id}
          onClick={() => setMarket(m.id)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
            market === m.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A "Start free trial"-style CTA that preserves the chosen plan and market and
 * routes signed-in users straight to checkout, signed-out users to sign up.
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
  const { market } = useMarket();
  return (
    <Button asChild {...rest}>
      <Link to={authed ? "/subscription" : "/auth"} search={{ plan, market }}>
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
  const { market } = useMarket();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Logo withByline />
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Primary">
          <Link
            to="/uk-property-listing-generator"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
          >
            UK
          </Link>
          <Link
            to="/us-real-estate-listing-generator"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
          >
            US
          </Link>
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
                <Link to="/auth" search={{ plan: "starter", market }}>
                  Start free trial
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ----------------------------------- Hero ---------------------------------- */

function heroChips(market: MarketId): string[] {
  return [
    market === "us" ? "Built for US real estate teams" : "Built for UK estate agencies",
    market === "us" ? "MLS-ready remarks" : "Portal-ready descriptions",
    "One source of truth for every asset",
    "No CRM migration",
  ];
}

function Hero({ authed }: { authed: boolean }) {
  const { market } = useMarket();
  const isUs = market === "us";
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-radial-glow opacity-60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28 lg:pt-20">
        {/* Left — critical above-the-fold content renders immediately (no reveal). */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <AudioLines className="h-3.5 w-3.5" /> One set of notes → a complete listing pack
          </span>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose your market
            </p>
            <MarketToggle />
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Switching adapts terminology, pricing, listing fields and compliance guidance —
            {isUs
              ? " US mode writes MLS-ready remarks."
              : " UK mode writes portal-ready descriptions."}
          </p>

          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,8vw,2.6rem)] font-semibold leading-[1.12] sm:mt-6 sm:text-5xl lg:text-[3.6rem]">
            Turn one set of notes into a{" "}
            <span className="text-gradient">complete listing pack.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {APP_NAME} helps UK estate agents and US real estate teams remove the slow admin between
            instruction and launch. Speak, type or paste the facts once, choose the brand voice, and
            generate the Headline, Key Features, listing description, short teaser, Email Blast copy
            and Instagram, Facebook and X captions from the same source of truth.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <CtaButton authed={authed} size="lg" className="w-full sm:w-auto">
              Create first pack
            </CtaButton>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-border bg-card/60 hover:bg-card sm:w-auto"
            >
              <a href="#workflow">See the workflow</a>
            </Button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {TRIAL_DAYS}-day trial at secure checkout · card required · cancel anytime
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            Switch between UK and US markets any time before checkout.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {heroChips(market).map((chip) => (
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
    <div className="glow-primary mx-auto w-full max-w-md rounded-[1.75rem] border border-border/80 bg-card/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-3.5">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Logo showText={false} className="[&_img]:h-4 [&_img]:w-4" /> New listing
        </span>
      </div>

      <div className="rounded-[1.35rem] border border-border/70 bg-background/60 p-3.5 sm:p-4">
        {/* Input method switcher */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Capture details
          </span>
          <span className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            Speak · type · paste
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 py-1.5 text-primary">
            <Mic className="h-3.5 w-3.5" />
            <span className="text-[0.7rem] font-semibold">Dictate</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/40 py-1.5 text-foreground/70">
            <Pencil className="h-3.5 w-3.5" />
            <span className="text-[0.7rem] font-medium">Type</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/40 py-1.5 text-foreground/70">
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span className="text-[0.7rem] font-medium">Paste</span>
          </div>
        </div>

        {/* Mic + waveform */}
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/[0.06] p-2.5">
          <span className="mic-pulse grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_6px] shadow-primary/15">
            <Mic className="h-4 w-4" />
          </span>
          <div className="flex h-7 flex-1 items-center gap-1">
            {WAVE_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className="wave-bar w-1 rounded-full bg-primary/70"
                style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Listening
          </span>
        </div>

        {/* Transcript */}
        <div className="mt-2.5 rounded-xl border border-border/70 bg-card/50 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Transcript
          </p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/85">
            “Five bed detached, gravel drive, walled garden, three receptions, arranged for family
            life and entertaining…”
          </p>
        </div>
      </div>

      {/* Structured facts */}
      <div className="mt-2.5 rounded-[1.35rem] border border-border/70 bg-background/40 p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Structured facts
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["5 bedrooms", "3 receptions", "Walled garden", "Freehold"].map((f) => (
            <span
              key={f}
              className="rounded-md border border-border bg-card/60 px-2 py-0.5 text-[0.7rem] font-medium text-foreground/85"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Generated preview */}
      <div className="mt-2.5 rounded-[1.35rem] border border-primary/25 bg-primary/[0.05] p-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Listing preview
          </span>
          <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium text-primary">
            <Check className="h-3 w-3" /> Preview ready
          </span>
        </div>
        <p className="text-xs leading-relaxed text-foreground/80">
          A five-bedroom detached home approached by a gravel driveway, with generous reception
          space, a private walled garden and a layout arranged for family life and entertaining.
        </p>
      </div>
    </div>
  );
}

const WAVE_HEIGHTS = [40, 70, 95, 60, 85, 50, 75, 100, 55, 80, 45, 90, 60, 70, 40];

/* ------------------------------ Voice value -------------------------------- */

function VoiceValue() {
  const { market } = useMarket();
  const isUs = market === "us";
  const cards = [
    {
      icon: Mic,
      step: "01",
      title: "Capture the instruction once",
      body: "Speak, type or paste rough notes from the valuation or viewing. One source of truth for every asset that follows.",
    },
    {
      icon: ShieldCheck,
      step: "02",
      title: "Separate facts from copy",
      body: "Quill extracts the structured facts, then drafts copy from them — so accuracy and tone are handled independently.",
    },
    {
      icon: Sparkles,
      step: "03",
      title: "Produce the full pack",
      body: isUs
        ? "Generate MLS-ready remarks, a Headline, 6–10 Key Features, a short teaser, Email Blast copy and Instagram, Facebook and X captions — all from the same facts."
        : "Generate the portal description, a Headline, 6–10 Key Features, a short teaser, Email Blast copy and Instagram, Facebook and X captions — all from the same facts.",
    },
  ];
  return (
    <section id="workflow" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>The workflow</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          Built to remove listing admin, not to replace agents.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Quill sits between instruction and launch. Capture the property once and hand your team a
          consistent, {isUs ? "MLS-ready" : "portal-ready"} pack instead of copy-and-paste work.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 90} className="h-full">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card">
              <span className="absolute right-4 top-4 inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-primary transition-colors duration-300 group-hover:border-gold/60 group-hover:bg-gold/10 group-hover:text-gold">
                {c.step}
              </span>
              <span className="relative grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-5 text-lg font-semibold">{c.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.body}
              </p>
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
      title: "Capture the instruction once",
      body: "Speak, type or paste rough notes from the valuation or viewing. One source of truth for every asset that follows.",
    },
    {
      icon: ShieldCheck,
      title: "Separate facts from copy",
      body: "Quill extracts structured facts, then drafts copy from them — so accuracy and tone are handled independently.",
    },
    {
      icon: Sparkles,
      title: "Produce the full pack",
      body: "Headline, 6–10 Key Features, listing description, short teaser, Email Blast copy and Instagram, Facebook and X captions — drafted together and fully editable before use.",
    },
  ];
  return (
    <section className="border-y border-border bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            One workflow for the whole team.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Practical for negotiators, admins and branch managers — the same source of truth drives
            every asset your listing needs.
          </p>
        </Reveal>
        <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-5">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[2.4rem] hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 110} className="relative">
              <div className="flex flex-col items-center text-center">
                <span className="relative z-10 grid h-[4.75rem] w-[4.75rem] place-items-center rounded-2xl border border-primary/25 bg-background text-primary shadow-[0_12px_30px_-16px] shadow-primary/40">
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

/* ----------------------------- Listing detail ------------------------------ */

const BENEFIT_GROUPS = [
  {
    icon: Mic,
    title: "Generate from one set of notes",
    items:
      "Speak, type or paste the property facts once. Quill turns them into the listing pack instead of making the team re-key details across formats.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in review prompts",
    items:
      "Missing details are flagged before launch, so admins and agents know what needs checking without rebuilding the copy manually.",
  },
  {
    icon: Building2,
    title: "Brand voice packs",
    items:
      "Professional, Premium, Luxury and Heritage voices keep every listing on-brand without rewriting from scratch.",
  },
  {
    icon: ArrowLeftRight,
    title: "UK / US market-aware copy",
    items:
      "Descriptions and remarks adapt to UK portal or US MLS conventions from the same facts, so the team doesn't retype the same property twice.",
  },
  {
    icon: FileText,
    title: "Reusable outputs",
    items:
      "One set of notes produces the Headline, Key Features, listing description, short teaser, Email Blast copy and Instagram, Facebook and X captions — each editable, none written from scratch.",
  },
];

function ListingDetail() {
  const { market } = useMarket();
  const isUs = market === "us";
  return (
    <section className="border-y border-border bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>WHAT QUILL TAKES OFF THE ADMIN DESK</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Less listing admin. More time back.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Quill generates the listing pack from one set of notes, so your team spends less time
            retyping, rewriting and formatting property copy.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose your market
            </p>
            <MarketToggle />
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFIT_GROUPS.map((g, i) => (
            <Reveal key={g.title} delay={i * 80} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <g.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.items}</p>
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
    body: "For listed homes, architecturally interesting houses, village settings and characterful properties that benefit from a guided description.",
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
          Four brand voices for a consistent agency tone.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Pick the voice that fits the property and the agency — every asset in the pack is drafted
          in the same tone, so brand consistency doesn't rely on the person on the keyboard.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VOICE_CARDS.map((v, i) => (
          <Reveal key={v.name} delay={i * 80} className="h-full">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card">
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-gold/60" />
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">{v.name}</h3>
                <span className="text-xs font-semibold tabular-nums text-foreground/30">
                  0{i + 1}
                </span>
              </div>
              <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                {v.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              <p className="mt-auto border-t border-border/70 pt-4 font-display text-sm italic leading-relaxed text-foreground/85">
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
  const { market } = useMarket();
  const isUs = market === "us";
  const facts: [string, string][] = isUs
    ? [
        ["Type", "Single-family home"],
        ["Location", "Winter Park, FL"],
        ["Beds / baths", "4 bed · 3.5 bath"],
        ["Square footage", "≈ 3,200 sq ft"],
        ["Lot size", "0.25-acre lot"],
        ["Price", "$895,000"],
        ["Year built", "2016"],
        [
          "Key features",
          "Chef's kitchen, quartz counters, first-floor primary suite, screened lanai, heated pool",
        ],
        ["Ownership", "Fee simple · HOA $90/mo"],
        ["Parking", "Three-car attached garage"],
        ["Voice", "Premium"],
      ]
    : [
        ["Type", "Grade II listed detached home"],
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
  const spokenNote = isUs
    ? "“Four bed three and a half bath in Winter Park, about 3,200 square feet, quarter-acre lot, heated pool, three-car garage, asking eight ninety-five…”"
    : "“Five bedrooms, Grade II listed, walled garden, original beams, inglenook fireplace, near the high street…”";
  const demo = isUs ? DEMO_US : DEMO_UK;

  return (
    <section id="example" className="panel-ivory border-y border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Worked example</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            One set of notes. A complete listing pack.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Same source of truth, every asset. See how a handful of property facts becomes the
            listing description, Key Features, short teaser, Email Blast copy and social captions —
            brand-consistent and ready to review.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          {/* In */}
          <Reveal className="min-w-0">
            <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-[0_20px_50px_-30px] shadow-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <FileText className="h-4 w-4" /> Details in
                </div>
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 1
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Mic className="h-3.5 w-3.5" /> Spoken, typed or pasted
                </div>
                <p className="mt-1.5 text-sm italic leading-relaxed text-foreground/90">
                  {spokenNote}
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
          <Reveal delay={120} className="min-w-0">
            <div className="h-full min-w-0 rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_24px_60px_-30px] shadow-primary/40 ring-1 ring-primary/5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4 shrink-0" /> Marketing pack out
                </div>
                <span className="self-start rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:self-auto">
                  Generated in seconds
                </span>
              </div>

              <Tabs defaultValue="listing" className="mt-4 w-full min-w-0">
                <TabsList className="-mx-1 flex h-auto w-[calc(100%+0.5rem)] max-w-[calc(100%+0.5rem)] flex-nowrap items-center justify-start gap-1 overflow-x-auto bg-secondary p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:w-full sm:max-w-full">
                  <TabsTrigger value="listing" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="features" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    Key Features
                  </TabsTrigger>
                  <TabsTrigger value="teaser" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    Teaser
                  </TabsTrigger>
                  <TabsTrigger value="email" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    Email Blast
                  </TabsTrigger>
                  <TabsTrigger value="instagram" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    Instagram
                  </TabsTrigger>
                  <TabsTrigger value="facebook" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    Facebook
                  </TabsTrigger>
                  <TabsTrigger value="x" className="shrink-0 px-2 py-1 text-xs sm:px-2.5 sm:text-sm">
                    X
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="listing" className="mt-4">
                  <h3 className="font-display text-lg font-semibold leading-snug">
                    {demo.headline}
                  </h3>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90">
                    {demo.listing.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Key Features
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
                    {demo.keyFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="teaser" className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Megaphone className="h-3.5 w-3.5" /> Short teaser
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{demo.summary}</p>
                </TabsContent>

                <TabsContent value="email" className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Mail className="h-3.5 w-3.5" /> Email Blast
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Database email copy — Quill doesn't send emails or manage contacts.
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Subject line options
                    </p>
                    <ol className="mt-2 space-y-2 text-sm">
                      {demo.emailBlast.subjectLines.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-2.5"
                        >
                          <span className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                            {i + 1}
                          </span>
                          <span className="min-w-0 break-words">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Preview text
                    </p>
                    <p className="mt-1 break-words text-sm text-foreground/90">
                      {demo.emailBlast.previewText}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Headline
                    </p>
                    <p className="mt-1 break-words font-display text-base font-semibold leading-snug">
                      {demo.emailBlast.headline}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Body
                    </p>
                    <div className="mt-1 space-y-3 text-sm leading-relaxed text-foreground/90">
                      {demo.emailBlast.body.map((p, i) => (
                        <p key={i} className="break-words">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Key features (reused from the pack)
                    </p>
                    <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                      {demo.keyFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="break-words">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Call to action
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-primary">
                      {demo.emailBlast.callToAction}
                    </p>
                  </div>

                  <div className="mt-5 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                    <p className="mb-1.5 font-semibold text-foreground/80">
                      Fill in before sending
                    </p>
                    <ul className="space-y-1">
                      {EMAIL_BLAST_PLACEHOLDERS.map((p) => (
                        <li key={p} className="break-words">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="instagram" className="mt-4">
                  <SocialBlock
                    icon={Instagram}
                    label="Instagram"
                    caption={demo.instagram.caption}
                    hashtags={demo.instagram.hashtags}
                  />
                </TabsContent>

                <TabsContent value="facebook" className="mt-4">
                  <SocialBlock
                    icon={Facebook}
                    label="Facebook"
                    caption={demo.facebook.caption}
                    hashtags={demo.facebook.hashtags}
                  />
                </TabsContent>

                <TabsContent value="x" className="mt-4">
                  <SocialBlock
                    icon={XIcon}
                    label="X"
                    caption={demo.x.caption}
                    hashtags={demo.x.hashtags}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.5 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
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

interface DemoEmailBlast {
  subjectLines: [string, string, string];
  previewText: string;
  headline: string;
  body: string[];
  callToAction: string;
}

interface DemoPack {
  headline: string;
  keyFeatures: string[];
  listing: string[];
  summary: string;
  emailBlast: DemoEmailBlast;
  instagram: { caption: string; hashtags: string };
  facebook: { caption: string; hashtags: string };
  x: { caption: string; hashtags: string };
}

const DEMO_UK: DemoPack = {
  headline: "A Distinguished Grade II Listed Home in the Heart of a Cotswold Market Town",
  keyFeatures: [
    "Grade II listed detached period rectory",
    "Five bedrooms and three bathrooms",
    "Three reception rooms including a drawing room of 6.8m x 5.1m",
    "Inglenook fireplace and flagstone floors",
    "Exposed beams and original sash windows",
    "Bespoke shaker kitchen with cellar below",
    "Walled garden of around half an acre with an orchard",
    "Gravel driveway and detached double cart shed",
    "Freehold, guide price £1,450,000",
  ],
  listing: [
    "Set back behind a gravel driveway and a low honey-stone wall, this Grade II listed home carries the quiet confidence of a house that has watched over its market town for generations. The layout unfolds in sequence, with rooms of generous proportion and a clear sense of purpose.",
    "Inside, flagstone floors lead between reception rooms anchored by an inglenook fireplace. Exposed beams and original sash windows bring warmth and controlled light, while a bespoke kitchen sits at the heart of the home, opening onto the garden.",
    "Five bedrooms, three bathrooms and three reception rooms are arranged over the principal floors, with a cellar below for useful storage. Beyond, a walled garden with mature borders, an orchard and a stone terrace offers a sheltered setting for outdoor dining and entertaining.",
  ],
  summary:
    "A five-bedroom Grade II listed detached home in the heart of a Cotswold market town, with an inglenook fireplace, flagstone floors and a private walled garden. Guide price £1,450,000, freehold.",
  emailBlast: {
    subjectLines: [
      "New instruction: Grade II listed rectory in the Cotswolds",
      "A five-bedroom listed home in the heart of a market town",
      "Cotswold rectory with walled garden — new to market",
    ],
    previewText:
      "Five bedrooms, three receptions and a private walled garden. Freehold, guide £1,450,000.",
    headline: "A distinguished Grade II listed rectory, new to market",
    body: [
      "We are pleased to bring to market a Grade II listed detached rectory in the heart of a Cotswold market town. Set back behind a gravel driveway and a low honey-stone wall, the house has a quiet confidence and a clear sense of proportion throughout.",
      "The layout offers three reception rooms anchored by an inglenook fireplace, flagstone floors and exposed beams, with a bespoke shaker kitchen at the heart of the home and a useful cellar below. Five bedrooms and three bathrooms are arranged over the principal floors.",
      "Beyond, a walled garden of around half an acre includes an orchard and a stone terrace, with a gravel driveway and detached double cart shed to the front. Offered freehold at a guide price of £1,450,000.",
    ],
    callToAction: "Arrange a viewing",
  },
  instagram: {
    caption:
      "A Grade II listed home in the heart of a Cotswold market town — inglenook fireplace, flagstone floors and a private walled garden. Five bedrooms, three receptions. Guide £1,450,000.",
    hashtags: "#CotswoldHomes #GradeIIListed #CountryLiving #PropertyForSale #CotswoldProperty",
  },
  facebook: {
    caption:
      "New to market — a five-bedroom Grade II listed home in the heart of a Cotswold market town. Three reception rooms, a bespoke kitchen and a private walled garden. Guide price £1,450,000. Viewings are available by appointment.",
    hashtags: "#CotswoldsProperty #GradeIIListed #ForSale",
  },
  x: {
    caption:
      "New to market: a five-bedroom Grade II listed Cotswold home with an inglenook fireplace, flagstone floors and a private walled garden. Guide £1,450,000.",
    hashtags: "#CotswoldHomes #GradeIIListed #ForSale",
  },
};

const DEMO_US: DemoPack = {
  headline: "Refined 4-Bedroom Winter Park Home with Heated Pool and Chef's Kitchen",
  keyFeatures: [
    "Single-family home built in 2016",
    "Approximately 3,200 sq ft on a 0.25-acre lot",
    "Four bedrooms and three and a half bathrooms",
    "Chef's kitchen with quartz countertops",
    "First-floor primary suite",
    "Screened lanai and heated saltwater pool",
    "Fenced backyard on a tree-lined street",
    "Three-car attached garage with paver driveway",
    "Fee simple ownership, HOA $90/month",
  ],
  listing: [
    "Set on a quarter-acre lot on a tree-lined street in Winter Park, this 2016-built single-family home offers approximately 3,200 square feet of well-proportioned living space with a layout arranged for everyday comfort and entertaining.",
    "The chef's kitchen features quartz countertops and opens to the main living area, while the first-floor primary suite adds convenience and privacy. A screened lanai extends the living space outdoors to a heated pool set within a fenced backyard.",
    "Four bedrooms, three and a half bathrooms and a three-car attached garage complete the home. Offered fee simple with an HOA of $90 per month, close to Park Avenue shops and dining.",
  ],
  summary:
    "Winter Park single-family home, approximately 3,200 sq ft on a quarter-acre lot. Four bedrooms, 3.5 baths, chef's kitchen, first-floor primary suite, screened lanai and heated pool. Offered at $895,000.",
  emailBlast: {
    subjectLines: [
      "Just listed in Winter Park: 4-bed pool home, $895,000",
      "New Winter Park listing — chef's kitchen and heated pool",
      "Winter Park 4/3.5 with first-floor primary, offered at $895,000",
    ],
    previewText:
      "Approximately 3,200 sq ft on a 0.25-acre lot with a first-floor primary and heated pool.",
    headline: "Just listed in Winter Park",
    body: [
      "We're pleased to announce a new listing in Winter Park: a 2016-built single-family home offering approximately 3,200 square feet on a quarter-acre lot, on a tree-lined street close to Park Avenue shops and dining.",
      "The home features a chef's kitchen with quartz countertops opening to the main living area, a first-floor primary suite for added convenience, and a three-car attached garage with paver driveway. Four bedrooms and three and a half bathrooms are thoughtfully arranged throughout.",
      "Outside, a screened lanai extends to a heated saltwater pool within a fenced backyard. Offered fee simple at $895,000 with an HOA of $90 per month.",
    ],
    callToAction: "Schedule a showing",
  },
  instagram: {
    caption:
      "Winter Park single-family home — chef's kitchen with quartz counters, first-floor primary suite, screened lanai and a heated pool. 4 bed, 3.5 bath, ~3,200 sq ft. Offered at $895,000.",
    hashtags: "#WinterParkFL #FloridaRealEstate #JustListed #HomeForSale #PoolHome",
  },
  facebook: {
    caption:
      "Just listed in Winter Park — a 4-bedroom, 3.5-bath single-family home of about 3,200 sq ft on a quarter-acre lot. Chef's kitchen, first-floor primary suite, screened lanai and a heated pool. Offered at $895,000. Showings by appointment.",
    hashtags: "#WinterParkHomes #FloridaRealEstate #ForSale",
  },
  x: {
    caption:
      "Just listed in Winter Park: 4 bed, 3.5 bath, ~3,200 sq ft on a quarter-acre lot. Chef's kitchen, first-floor primary suite, screened lanai and heated pool. $895,000.",
    hashtags: "#WinterParkFL #FloridaRealEstate #JustListed",
  },
};

/* ----------------------------- Voice dictation ----------------------------- */

const DICTATION_EXAMPLES_UK = [
  {
    label: "Kitchen",
    raw: "Kitchen’s been redone, oak units, Miele oven, big island, sliders to the west terrace, evening sun…",
    out: "Bespoke oak kitchen with Miele appliances, a central island and sliding doors opening to a west-facing terrace that catches the evening sun.",
  },
  {
    label: "Garden",
    raw: "Garden’s properly private, old brick wall, pear trees trained along it, stone terrace, lighting already in…",
    out: "Private walled garden with espalier pear trees along the brickwork, a stone terrace and discreet external lighting already installed.",
  },
  {
    label: "Parking & local",
    raw: "Double cart lodge, EV point, station’s walkable, market square under ten minutes…",
    out: "Double cart lodge with EV charging, within walking distance of the station and around ten minutes from the market square.",
  },
];

const DICTATION_EXAMPLES_US = [
  {
    label: "Kitchen",
    raw: "Kitchen’s all redone, white oak cabinets, Sub-Zero fridge, quartz island, sliders out to the deck, gets the afternoon sun…",
    out: "Renovated kitchen with white oak cabinetry, a Sub-Zero refrigerator, a quartz-topped island and sliding doors opening to the deck.",
  },
  {
    label: "Outdoor",
    raw: "Backyard’s fenced, heated pool, covered patio, quarter-acre lot, sprinklers already in…",
    out: "Fenced backyard on a quarter-acre lot with a heated pool, a covered patio and an in-ground sprinkler system.",
  },
  {
    label: "Parking & area",
    raw: "Three-car garage, EV charger, close to the interstate, downtown’s about ten minutes…",
    out: "Three-car attached garage with an EV charger, quick interstate access and roughly ten minutes to downtown.",
  },
];

function VoiceDictation({ authed }: { authed: boolean }) {
  const { market } = useMarket();
  const examples = market === "us" ? DICTATION_EXAMPLES_US : DICTATION_EXAMPLES_UK;
  const bullets = [
    "Dictate rough notes into one voice notes field",
    "Add to existing text without overwriting it",
    "Every transcript stays fully editable before generating",
    market === "us"
      ? "Useful between showings, valuations and client calls"
      : "Useful between viewings, valuations and vendor calls",
  ];
  return (
    <section id="voice-demo" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <Reveal className="lg:sticky lg:top-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Mic className="h-3.5 w-3.5" /> Voice dictation
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
            Capture the property in the car, not at the desk.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Rough voice notes become structured, editable listing detail. Quill keeps the facts,
            drops the filler and returns clean copy your team can review before anything goes live.
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
            Create first pack
          </CtaButton>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-radial-glow opacity-60 blur-2xl" />
          <div className="glow-primary rounded-3xl border border-border/80 bg-card p-4 shadow-2xl shadow-black/25 sm:p-5">
            {/* Live capture bar */}
            <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-3.5">
              <span className="mic-pulse grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_6px] shadow-primary/15">
                <Mic className="h-4.5 w-4.5" />
              </span>
              <div className="flex h-8 flex-1 items-center gap-1">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="wave-bar w-1 rounded-full bg-primary/70"
                    style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Listening
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {examples.map((ex) => (
                <div
                  key={ex.label}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-background/40"
                >
                  <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2">
                    <span className="text-xs font-semibold text-foreground">{ex.label}</span>
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                      Raw note <ArrowRight className="h-3 w-3 text-primary" /> Editable feature
                    </span>
                  </div>
                  <div className="space-y-2.5 p-3.5">
                    <div className="flex items-start gap-2">
                      <AudioLines className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs italic leading-relaxed text-muted-foreground">
                        “{ex.raw}”
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                          <Sparkles className="h-3 w-3" /> Editable feature
                        </span>
                        <Pencil className="h-3 w-3 text-primary/70" />
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">{ex.out}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Pricing --------------------------------- */

function Pricing({ authed }: { authed: boolean }) {
  const { market } = useMarket();
  return (
    <section id="pricing" className="border-y border-border bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Plans that scale with your instructions.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every plan includes UK and US markets, all four brand voices, voice dictation and the
            full listing pack — Headline, Key Features, description, teaser, Email Blast copy and
            Instagram, Facebook and X captions.
          </p>
          <div className="mt-6 flex justify-center">
            <MarketToggle />
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 90} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "glow-primary border-primary/50 bg-card md:scale-[1.03]"
                    : "border-border/70 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:bg-card"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30">
                    <Sparkles className="h-3 w-3" /> Best value
                  </span>
                )}
                <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-5 font-display text-4xl font-semibold tracking-tight">
                  {planPriceDisplay(plan.id, market)}

                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {plan.monthlyListings} listings per month
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.id === "starter"
                    ? `${TRIAL_DAYS}-day Starter trial at secure checkout · card required · cancel anytime`
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
                <CtaButton
                  authed={authed}
                  plan={plan.id}
                  className="mt-8 w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.id === "starter" ? "Start free trial" : "Get started"}
                </CtaButton>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {TRIAL_DAYS}-day Starter trial at secure checkout · card required · cancel anytime
            before renewal.
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
  const baseExtras = ["Listing descriptions", "Social captions with hashtags"];
  const merged = [...rest];
  for (const extra of baseExtras) {
    if (!merged.some((f) => f.toLowerCase() === extra.toLowerCase())) {
      merged.push(extra);
    }
  }
  return [...voice, ...merged];
}

/* -------------------------------- Final CTA -------------------------------- */

function FinalCta({ authed }: { authed: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <Reveal>
        <div className="glow-primary relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card px-6 py-16 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-90" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" />
          <div className="relative mx-auto max-w-2xl">
            <span className="eyebrow inline-block">Ready when your next instruction lands</span>
            <h2 className="mt-4 text-balance font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Test it on the next listing your team has to launch.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Bring a real instruction, capture the property once and let Quill hand you a full,
              brand-consistent listing pack — ready to review, not rewritten from scratch.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <CtaButton authed={authed} size="lg" className="w-full sm:w-auto">
                Generate a listing pack
              </CtaButton>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-border bg-card/60 hover:bg-card sm:w-auto"
              >
                <a href="#example">See a worked example</a>
              </Button>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {TRIAL_DAYS}-day trial · card required · cancel anytime
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Footer --------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/30 py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
          <Logo withByline />
          <nav
            aria-label="Markets"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
          >
            <Link
              to="/uk-property-listing-generator"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              UK property listing generator
            </Link>
            <Link
              to="/us-real-estate-listing-generator"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              US real estate listing generator
            </Link>
          </nav>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="break-all text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="rule my-6" />
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © 2026 {APP_NAME}. Crafted for estate and real estate agents in the UK and US.
        </p>
      </div>
    </footer>
  );
}
