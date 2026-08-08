import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ShieldCheck, Sparkles, Pause, Play, Check } from "lucide-react";
import exteriorImg from "@/assets/home-walk-exterior.jpg";
import kitchenImg from "@/assets/home-walk-kitchen.jpg";
import gardenImg from "@/assets/home-walk-garden.jpg";

type Step = {
  id: string;
  label: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  icon: typeof Camera;
  chips: string[];
};

const STEPS: Step[] = [
  {
    id: "capture",
    label: "Walk the property",
    title: "Capture the instruction once",
    body: "Speak, type or paste rough notes from the valuation or viewing — kerb appeal, room by room, the outside space. One source of truth for every asset that follows.",
    image: exteriorImg,
    alt: "Detached stone home at dusk with a gravel driveway and warm light in the windows",
    icon: Camera,
    chips: ["Dictate on site", "Type or paste", "No CRM migration"],
  },
  {
    id: "structure",
    label: "Quill structures the facts",
    title: "Separate facts from copy",
    body: "Quill extracts the structured facts first — beds, receptions, tenure, outside space — then drafts copy from them, so accuracy and tone are handled independently.",
    image: kitchenImg,
    alt: "Interior of a premium kitchen and living space with a marble island and warm pendant lighting",
    icon: ShieldCheck,
    chips: ["5 bedrooms", "3 receptions", "Walled garden", "Freehold"],
  },
  {
    id: "pack",
    label: "The listing pack appears",
    title: "Produce the full pack",
    body: "Headline, 6–10 Key Features, the listing description, a short teaser, Email Blast copy and Instagram, Facebook and X captions — drafted together and fully editable before use.",
    image: gardenImg,
    alt: "Private walled garden at dusk with a lit lawn and mature planting behind an elegant home",
    icon: Sparkles,
    chips: ["Headline", "Key Features", "Description", "Email Blast", "Captions"],
  },
];

const INTERVAL_MS = 6000;

/**
 * Lightweight "property to pack" walkthrough. Crossfades three moments with a
 * visible step cue and manual controls. Pauses on hover/focus and stops
 * entirely under prefers-reduced-motion. Fixed aspect ratios: no layout shift.
 */
export function PropertyWalkthrough({
  eyebrow = "The workflow",
  heading = "Built to remove listing admin, not to replace agents.",
  intro,
}: {
  eyebrow?: string;
  heading?: string;
  intro?: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mql.matches);
      if (mql.matches) setPlaying(false);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!playing || paused || reduced) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % STEPS.length), INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, paused, reduced]);

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  const active = STEPS[index]!;

  return (
    <section
      id="workflow"
      aria-labelledby="walkthrough-heading"
      className="relative overflow-hidden border-y border-border/70 py-16 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%),radial-gradient(50%_50%_at_90%_100%,color-mix(in_oklab,var(--gold)_10%,transparent),transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow inline-block">{eyebrow}</span>
          <h2
            id="walkthrough-heading"
            className="mt-4 font-display text-3xl font-semibold sm:text-4xl"
          >
            {heading}
          </h2>
          {intro && <p className="mt-4 text-lg text-muted-foreground">{intro}</p>}
        </div>

        <div
          className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Visual */}
          <div className="relative min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card/40 shadow-2xl shadow-black/40">
            <div className="relative aspect-[16/10] w-full">
              {STEPS.map((s, i) => (
                <img
                  key={s.id}
                  src={s.image}
                  alt={s.alt}
                  width={1600}
                  height={1000}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                    i === index ? "opacity-100" : "opacity-0"
                  } ${i === index && !reduced ? "walkaround-img" : ""}`}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/10" />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/70 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
                  <active.icon className="h-3.5 w-3.5" /> Step {index + 1} · {active.label}
                </span>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-border/80 bg-background/70 px-2 py-0.5 text-[0.7rem] font-medium text-foreground/90 backdrop-blur"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Steps + controls */}
          <div className="min-w-0">
            <ol className="space-y-2.5">
              {STEPS.map((s, i) => {
                const isActive = i === index;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-pressed={isActive}
                      className={`flex w-full min-h-11 items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive
                          ? "border-primary/45 bg-primary/[0.08]"
                          : "border-border/60 bg-card/40 hover:bg-card/70"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm font-bold ${
                          isActive
                            ? "border-primary/40 bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {isActive ? <Check className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold">{s.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                          {s.body}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 flex items-center gap-3">
              {!reduced && (
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/60 px-4 text-sm font-medium text-foreground/90 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? "Pause walkthrough" : "Play walkthrough"}
                </button>
              )}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-8 bg-primary" : "w-3 bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
