import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BlogShell } from "@/components/blog/BlogShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Building2, Home } from "lucide-react";
import { listBlogPosts } from "@/lib/opinly.functions";
import { formatPostDate, listImageUrl, imageAlt, SITE_URL } from "@/lib/opinly/shared";
import { GUIDES } from "@/lib/guides";

const TITLE = "Property Listing Copy Guides for UK & US Agents";
const DESCRIPTION =
  "Practical listing copy guides for UK estate agents and US real estate professionals: description examples, portal templates, MLS remarks and reusable checklists.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Quill by CopyByMonk` },
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
    <ul className="mt-5 grid gap-4 sm:grid-cols-2">
      {GUIDES.filter((g) => g.market === market).map((g) => (
        <li key={g.path}>
          <Link
            to={g.path}
            className="group block h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight">
              {g.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{g.blurb}</p>
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

function BlogHub() {
  return (
    <BlogShell>
      <header className="mx-auto max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <BookOpen className="h-4 w-4" /> Guides
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Property listing copy guides
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Worked examples, templates and checklists for writing listing copy that reads well on
          property portals and in the MLS. Written for UK estate agents and US real estate
          professionals, with a bias towards specifics over adjectives.
        </p>
      </header>

      <section className="mt-12" aria-labelledby="uk-guides">
        <h2
          id="uk-guides"
          className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight"
        >
          <Home className="h-5 w-5 text-primary" /> UK estate agents
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Portal-style descriptions, key features and Material Information habits.
        </p>
        <GuideCards market="uk" />
        <p className="mt-4 text-sm">
          <Link
            to="/uk-property-listing-generator"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            UK property listing generator →
          </Link>
        </p>
      </section>

      <section className="mt-14" aria-labelledby="us-guides">
        <h2
          id="us-guides"
          className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight"
        >
          <Building2 className="h-5 w-5 text-primary" /> US real estate professionals
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          MLS remarks, longer-form listing descriptions and fair-housing-conscious wording.
        </p>
        <GuideCards market="us" />
        <p className="mt-4 text-sm">
          <Link
            to="/us-real-estate-listing-generator"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            US real estate listing generator →
          </Link>
        </p>
      </section>

      <LatestArticles />

      <section className="mt-14 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center sm:p-8">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Stop writing listing copy from scratch
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Quill turns one set of property notes into a Headline, 6–10 Key Features, a portal or MLS
          description, a short teaser, Email Blast copy and Instagram, Facebook and X captions.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
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
