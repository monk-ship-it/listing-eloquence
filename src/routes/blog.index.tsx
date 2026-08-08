import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BlogShell } from "@/components/blog/BlogShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Building2, Home } from "lucide-react";
import { listBlogPosts } from "@/lib/opinly.functions";
import { formatPostDate, listImageUrl, imageAlt, SITE_URL } from "@/lib/opinly/shared";
import { GUIDES } from "@/lib/guides";
import heroExterior from "@/assets/guides-hero-exterior.jpg";
import ukTerrace from "@/assets/guides-uk-terrace.jpg";
import usHome from "@/assets/guides-us-home.jpg";


const TITLE = "Property Listing Copy Guides for UK & US Agents";
const DOC_TITLE = "Listing Copy Guides for UK & US Agents | CopyByMonk";
const DESCRIPTION =
  "Practical listing copy guides for UK estate agents and US real estate pros: description examples, portal templates, MLS remarks and checklists.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: DOC_TITLE },

      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/blog` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/blog` },
      { rel: "alternate", type: "application/rss+xml", title: "Quill Blog", href: "/rss.xml" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          url: `${SITE_URL}/blog`,
          description: DESCRIPTION,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/blog` },
          ],
        }),
      },
    ],
  }),
  component: BlogHub,
});

function GuideCards({ market }: { market: "uk" | "us" }) {
  return (
    <ul className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
      {GUIDES.filter((g) => g.market === market).map((g) => (
        <li key={g.path}>
          <Link
            to={g.path}
            className="group flex h-full flex-col rounded-2xl p-4 -m-1 transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight">
              {g.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.blurb}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Read the guide
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Wide property exterior with a slow cinematic pan and a small orbit cue. */
function WalkaroundPanel() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-3xl border border-border/50 bg-card">
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
        <img
          src={heroExterior}
          alt="Georgian townhouse exterior at dusk with warm lights in the sash windows"
          width={1920}
          height={1088}
          decoding="async"
          className="walkaround-img absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20"
        />
        <div
          aria-hidden="true"
          className="absolute right-4 top-4 h-16 w-16 sm:right-6 sm:top-6 sm:h-20 sm:w-20"
        >
          <svg viewBox="0 0 80 80" className="h-full w-full text-primary/70">
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 6"
              className="orbit-dash"
            />
            <g className="orbit-spin" style={{ transformOrigin: "40px 40px" }}>
              <circle cx="70" cy="40" r="3.5" fill="currentColor" />
            </g>
            <rect
              x="33"
              y="34"
              width="14"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <path d="M31 34 L40 27 L49 34" fill="none" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
      <div className="relative px-5 pb-6 pt-1 sm:px-8 sm:pb-8">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Walk the property once, note what a buyer would actually notice, then let the copy follow
          the same route: kerb appeal, entrance, living space, garden or lot, then the practical
          details.
        </p>
      </div>
    </div>
  );
}


/** Secondary enhancement: renders only if the external feed responds with posts. */
function LatestArticles() {
  const fetchPosts = useServerFn(listBlogPosts);
  const { data } = useQuery({
    queryKey: ["opinly", "posts", "hub"],
    queryFn: () => fetchPosts({ data: { limit: 6, sort: "newest" as const } }),
    staleTime: 60_000,
    retry: false,
  });

  if (!data || data.data.length === 0) return null;

  return (
    <section className="mt-14" aria-labelledby="latest-articles">
      <h2 id="latest-articles" className="font-serif text-2xl font-semibold tracking-tight">
        Latest articles
      </h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {data.data.map((post) => {
          const src = listImageUrl(post.image);
          return (
            <li key={post.slug}>
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="block h-full overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {src ? (
                  <img
                    src={src}
                    alt={imageAlt(post.image, post.title)}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    <time dateTime={post.firstPublishedAt}>
                      {formatPostDate(post.firstPublishedAt)}
                    </time>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MarketSection({
  id,
  market,
  icon,
  title,
  intro,
  image,
  imageAlt: alt,
  generatorTo,
  generatorLabel,
}: {
  id: string;
  market: "uk" | "us";
  icon: React.ReactNode;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  generatorTo: string;
  generatorLabel: string;
}) {
  return (
    <section className="mt-16 sm:mt-20" aria-labelledby={id}>
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start sm:gap-8">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {icon}
            {market === "uk" ? "United Kingdom" : "United States"}
          </p>
          <h2
            id={id}
            className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
        </div>
        <img
          src={image}
          alt={alt}
          width={1280}
          height={853}
          loading="lazy"
          decoding="async"
          className="hidden aspect-[4/3] w-full rounded-2xl object-cover opacity-90 ring-1 ring-border/60 sm:block"
        />
      </div>

      <GuideCards market={market} />

      <p className="mt-6 text-sm">
        <Link
          to={generatorTo}
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {generatorLabel} →
        </Link>
      </p>
    </section>
  );
}

function BlogHub() {
  return (
    <BlogShell>
      <header className="mx-auto max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <BookOpen className="h-4 w-4" /> Guides
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Property listing copy guides
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Worked examples, templates and checklists for writing listing copy that reads well on
          property portals and in the MLS. Written for UK estate agents and US real estate
          professionals, with a bias towards specifics over adjectives.
        </p>
      </header>

      <WalkaroundPanel />

      <MarketSection
        id="uk-guides"
        market="uk"
        icon={<Home className="h-4 w-4" />}
        title="UK estate agents"
        intro="Portal-style descriptions, key features and Material Information habits."
        image={ukTerrace}
        imageAlt="Victorian terraced house with a black front door, bay window and red brick facade"
        generatorTo="/uk-property-listing-generator"
        generatorLabel="UK property listing generator"
      />

      <MarketSection
        id="us-guides"
        market="us"
        icon={<Building2 className="h-4 w-4" />}
        title="US real estate professionals"
        intro="MLS remarks, longer-form listing descriptions and fair-housing-conscious wording."
        image={usHome}
        imageAlt="Craftsman-style suburban home with a covered front porch and lit entrance at dusk"
        generatorTo="/us-real-estate-listing-generator"
        generatorLabel="US real estate listing generator"
      />

      <LatestArticles />

      <section className="mt-16 rounded-3xl bg-card/70 p-7 text-center ring-1 ring-primary/20 sm:mt-20 sm:p-10">
        <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          Stop writing listing copy from scratch
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Quill turns one set of property notes into a Headline, 6–10 Key Features, a portal or MLS
          description, a short teaser, Email Blast copy and Instagram, Facebook and X captions.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="min-h-[44px]">
            <Link to="/uk-property-listing-generator">For UK agents</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-[44px]">
            <Link to="/us-real-estate-listing-generator">For US agents</Link>
          </Button>
        </div>
      </section>
    </BlogShell>
  );
}

