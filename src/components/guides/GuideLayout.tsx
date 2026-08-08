import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BlogShell } from "@/components/blog/BlogShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { generatorPath, siblingGuides, type GuideMeta } from "@/lib/guides";

/** Section heading used across the static guides. */
export function GuideH2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-12 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

export function GuideH3({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 text-lg font-semibold tracking-tight">{children}</h3>;
}

export function GuideP({ children }: { children: ReactNode }) {
  return <p className="mt-4 leading-relaxed text-muted-foreground">{children}</p>;
}

export function GuideList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Quoted example copy block. */
export function GuideExample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mt-5 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</p>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </Card>
  );
}

export function GuideFaqs({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="mt-5 space-y-4">
      {faqs.map((f) => (
        <Card key={f.q} className="p-5">
          <h3 className="font-semibold">{f.q}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </Card>
      ))}
    </div>
  );
}

/** Contextual call to action pointing at the right market generator. */
export function GuideCta({ meta, label }: { meta: GuideMeta; label: string }) {
  return (
    <section className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
      <h2 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">{label}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Speak or paste your property facts once and Quill returns a Headline, 6–10 Key Features, the{" "}
        {meta.market === "uk" ? "portal-ready description" : "MLS-ready remarks"}, a short teaser,
        Email Blast copy and Instagram, Facebook and X captions.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild size="lg" className="min-h-[44px]">
          <Link to={generatorPath(meta.market)}>
            {meta.market === "uk" ? "UK listing generator" : "US listing generator"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-[44px]">
          <Link to="/blog">All guides</Link>
        </Button>
      </div>
    </section>
  );
}

/** Sibling-guide links rendered at the end of every guide. */
export function GuideRelated({ meta }: { meta: GuideMeta }) {
  return (
    <nav aria-label="Related guides" className="mt-12 border-t border-border/70 pt-8">
      <h2 className="font-serif text-xl font-semibold tracking-tight">Related guides</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {siblingGuides(meta.path).map((g) => (
          <li key={g.path}>
            <Link
              to={g.path}
              className="block min-h-11 rounded-xl border border-border p-4 text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-medium">{g.label}</span>
              <span className="mt-1 block text-muted-foreground">{g.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Page chrome: shell, breadcrumbs, H1 and standfirst. */
export function GuideLayout({
  meta,
  standfirst,
  children,
}: {
  meta: GuideMeta;
  standfirst: string;
  children: ReactNode;
}) {
  return (
    <BlogShell>
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/blog" className="hover:text-foreground">
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {meta.label}
            </li>
          </ol>
        </nav>

        <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{standfirst}</p>

        {children}

        <GuideRelated meta={meta} />
      </article>
    </BlogShell>
  );
}
