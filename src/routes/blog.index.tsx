import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BlogShell } from "@/components/blog/BlogShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { listBlogPosts } from "@/lib/opinly.functions";
import { formatPostDate, imageAlt, listImageUrl, SITE_URL } from "@/lib/opinly/shared";
import type { OpinlyPost } from "@/lib/opinly/types";

const TITLE = "Quill Blog — Listing copy, portals and MLS marketing";
const DESCRIPTION =
  "Practical writing and marketing guides for UK estate agents and US real estate teams: listing descriptions, key features, teasers, email blasts and social captions.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: TITLE },
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
          "@type": "Blog",
          name: "Quill Blog",
          url: `${SITE_URL}/blog`,
          description: DESCRIPTION,
        }),
      },
    ],
  }),
  component: BlogIndex,
});

function PostCard({ post }: { post: OpinlyPost }) {
  const src = listImageUrl(post.image);
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          {post.category ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
              {post.category.name}
            </p>
          ) : null}
          <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            {post.author ? <span>{post.author.name} · </span> : null}
            <time dateTime={post.firstPublishedAt}>{formatPostDate(post.firstPublishedAt)}</time>
          </p>
        </div>
      </Link>
    </article>
  );
}

function BlogIndex() {
  const fetchPosts = useServerFn(listBlogPosts);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const cursor = cursors[cursors.length - 1];

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["opinly", "posts", cursor ?? "start"],
    queryFn: () => fetchPosts({ data: { limit: 12, sort: "newest" as const, cursor } }),
    staleTime: 60_000,
  });

  const page = cursors.length;

  return (
    <BlogShell>
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Blog</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
      </header>

      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-5">
              <Skeleton className="mb-4 aspect-[16/9] w-full rounded-lg" />
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <h2 className="font-semibold">We couldn't load the articles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again in a moment."}
          </p>
          <Button className="mt-4 min-h-11" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="font-serif text-xl font-semibold">No articles published yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            New guides for estate agents and real estate teams will appear here.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Quill
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {data.data.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
          >
            <Button
              variant="outline"
              className="min-h-11"
              disabled={page === 1 || isFetching}
              onClick={() => setCursors((c) => c.slice(0, -1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              className="min-h-11"
              disabled={!data.has_more || !data.next_cursor || isFetching}
              onClick={() =>
                setCursors((c) => (data.next_cursor ? [...c, data.next_cursor] : c))
              }
            >
              Next
            </Button>
          </nav>
        </>
      )}
    </BlogShell>
  );
}
