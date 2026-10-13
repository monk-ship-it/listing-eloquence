import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://copybymonk.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

/** Date each static page's content last changed significantly. */
const CONTENT_UPDATED = "2026-10-13";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { GUIDES } = await import("@/lib/guides");
        const guideMod = new Map(GUIDES.map((g) => [g.path as string, g.dateModified]));
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/uk-property-listing-generator", changefreq: "monthly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/property-description-examples", changefreq: "monthly", priority: "0.7" },
          {
            path: "/rightmove-property-description-template",
            changefreq: "monthly",
            priority: "0.7",
          },
        ];
        const entries: SitemapEntry[] = staticEntries.map((e) => ({
          ...e,
          lastmod: guideMod.get(e.path) ?? CONTENT_UPDATED,
        }));

        // Every published Opinly post, paginated. A feed failure surfaces as
        // 503 rather than serving a partial sitemap.
        try {
          const { fetchPosts } = await import("@/lib/opinly/api.server");
          const { isNonUkPost } = await import("@/lib/opinly/shared");
          let cursor: string | undefined;
          for (let page = 0; page < 50; page++) {
            const res = await fetchPosts({ limit: 50, sort: "newest", cursor });
            for (const post of res.data.filter((p) => !isNonUkPost(p))) {
              entries.push({
                path: `/blog/${encodeURIComponent(post.slug)}`,
                changefreq: "monthly",
                priority: "0.6",
                lastmod: (post.lastPublishedAt || post.firstPublishedAt)?.slice(0, 10),
              });
            }
            if (!res.has_more || !res.next_cursor) break;
            cursor = res.next_cursor;
          }
        } catch (err) {
          console.error("Sitemap: blog post listing failed", err);
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Retry-After": "300" },
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
