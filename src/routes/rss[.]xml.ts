import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/opinly/shared";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { fetchRss } = await import("@/lib/opinly/api.server");
        let items: Awaited<ReturnType<typeof fetchRss>> = [];
        try {
          items = await fetchRss(20);
        } catch (err) {
          console.error("RSS build failed", err);
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
          `  <channel>`,
          `    <title>Quill Blog</title>`,
          `    <link>${SITE_URL}/blog</link>`,
          `    <description>Listing copy and marketing guides for UK estate agents and US real estate teams.</description>`,
          `    <language>en</language>`,
          `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
          ...items.map((item) =>
            [
              `    <item>`,
              `      <title>${escapeXml(item.title)}</title>`,
              `      <link>${SITE_URL}/blog/${encodeURIComponent(item.slug)}</link>`,
              `      <guid isPermaLink="true">${SITE_URL}/blog/${encodeURIComponent(item.slug)}</guid>`,
              item.description
                ? `      <description>${escapeXml(item.description)}</description>`
                : null,
              item.date ? `      <pubDate>${new Date(item.date).toUTCString()}</pubDate>` : null,
              ...(item.categories ?? []).map((c) => `      <category>${escapeXml(c)}</category>`),
              `    </item>`,
            ]
              .filter(Boolean)
              .join("\n"),
          ),
          `  </channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
