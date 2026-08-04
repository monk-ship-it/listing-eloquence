import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/** Shared public chrome for every blog page. */
export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#blog-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link
            to="/"
            className="flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Quill home"
          >
            <Logo className="h-7 w-7" />
            <span className="font-serif text-lg font-semibold tracking-tight">Quill</span>
          </Link>

          <nav aria-label="Blog navigation" className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/blog"
              className="hidden min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              Articles
            </Link>
            <Link
              to="/app"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Create first pack
            </Link>
          </nav>
        </div>
      </header>

      <main id="blog-main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Quill by CopyByMonk</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link to="/uk-property-listing-generator" className="hover:text-foreground">
              UK listing generator
            </Link>
            <Link to="/us-real-estate-listing-generator" className="hover:text-foreground">
              US listing generator
            </Link>
            <a href="/rss.xml" className="hover:text-foreground">
              RSS
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
