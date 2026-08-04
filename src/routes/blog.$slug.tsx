import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BlogShell } from "@/components/blog/BlogShell";
import { ContentRenderer } from "@/components/blog/ContentRenderer";
import { getBlogPost } from "@/lib/opinly.functions";
import { formatPostDate, postImageUrl, SITE_URL, opinlyImageUrl } from "@/lib/opinly/shared";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getBlogPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/blog/${params.slug}`;
    if (!loaderData) {
      return { meta: [{ title: "Unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.description;
    const hero = postImageUrl(post.titleFile);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(hero
          ? [
              { property: "og:image", content: hero },
              { name: "twitter:image", content: hero },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description,
            datePublished: post.firstPublishedAt,
            dateModified: post.modifiedAt,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            url,
            ...(hero ? { image: [hero] } : {}),
            ...(post.author ? { author: { "@type": "Person", name: post.author.name } } : {}),
            publisher: { "@type": "Organization", name: "Quill" },
            ...(post.faqs?.length
              ? {}
              : {}),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          }),
        },
        ...(post.faqs?.length
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: post.faqs.map((f) => ({
                    "@type": "Question",
                    name: f.question,
                    acceptedAnswer: { "@type": "Answer", text: f.answer },
                  })),
                }),
              },
            ]
          : []),
      ],
    };
  },
  component: PostPage,
  notFoundComponent: () => (
    <BlogShell>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Article not found</h1>
      <p className="mt-3 text-muted-foreground">
        That article may have been unpublished or the link is wrong.
      </p>
      <Link
        to="/blog"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to the blog
      </Link>
    </BlogShell>
  ),
});

function PostPage() {
  const { post } = Route.useLoaderData();
  const hero = postImageUrl(post.titleFile);
  const authorImage = opinlyImageUrl(post.author?.fileKey ?? null);

  return (
    <BlogShell>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link to="/blog" className="hover:text-foreground">
          Blog
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{post.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          {post.category ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
              {post.category.name}
            </p>
          ) : null}
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {authorImage ? (
              <img src={authorImage} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : null}
            {post.author ? <span className="text-foreground">{post.author.name}</span> : null}
            <time dateTime={post.firstPublishedAt}>{formatPostDate(post.firstPublishedAt)}</time>
          </div>
        </header>

        {hero ? (
          <img
            src={hero}
            alt={post.titleFile?.altText || post.title}
            className="mb-10 w-full rounded-2xl border border-border"
          />
        ) : null}

        <div className="text-base">
          <ContentRenderer node={post.content} />
        </div>

        {post.faqs?.length ? (
          <section className="mt-12" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-serif text-2xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <dl className="mt-5 space-y-5">
              {post.faqs.map((faq) => (
                <div key={faq.question} className="rounded-xl border border-border bg-card p-5">
                  <dt className="font-semibold">{faq.question}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {post.tags.length ? (
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
            {post.tags.map((tag) => (
              <li
                key={tag.slug}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </BlogShell>
  );
}
