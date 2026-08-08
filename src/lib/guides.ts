/** Static, evergreen SEO guides published under the public Guides hub. */

export const SITE = "https://copybymonk.com";

export type GuideMarket = "uk" | "us";

export interface GuideMeta {
  /** Route path, also the canonical path. */
  path:
    | "/property-description-examples"
    | "/rightmove-property-description-template"
    | "/mls-remarks-examples"
    | "/real-estate-listing-description-examples";
  title: string;
  /** Short label for cards and cross-links. */
  label: string;
  /** 140–160 char meta description. */
  description: string;
  /** One-line card blurb. */
  blurb: string;
  market: GuideMarket;
  datePublished: string;
}

export const GUIDES: GuideMeta[] = [
  {
    path: "/property-description-examples",
    title: "Property Description Examples for UK Estate Agents",
    label: "UK property description examples",
    description:
      "Property description examples for UK estate agents across flats, terraces, semis and country homes, with a breakdown of why each example actually works.",
    blurb:
      "Full worked descriptions for four UK property types, annotated so you can see which sentence is doing the selling.",
    market: "uk",
    datePublished: "2026-08-08",
  },
  {
    path: "/rightmove-property-description-template",
    title: "Rightmove-Style Property Description Template & Checklist",
    label: "Rightmove-style description template",
    description:
      "A practical Rightmove-style property description template and pre-publish checklist for UK estate agents, with fill-in prompts and Material Information notes.",
    blurb:
      "A paragraph-by-paragraph template plus a pre-publish checklist you can run before a listing goes live.",
    market: "uk",
    datePublished: "2026-08-08",
  },
  {
    path: "/mls-remarks-examples",
    title: "MLS Remarks Examples and Templates for Agents",
    label: "MLS remarks examples",
    description:
      "MLS remarks examples and reusable templates for US agents, with character-count discipline and fair-housing-conscious wording you can adapt to your listings.",
    blurb:
      "Public remarks examples for four home types, plus wording habits that keep copy focused on the property.",
    market: "us",
    datePublished: "2026-08-08",
  },
  {
    path: "/real-estate-listing-description-examples",
    title: "Real Estate Listing Description Examples by Home Type",
    label: "US listing description examples",
    description:
      "Real estate listing description examples across condos, new builds, ranch homes and luxury listings, shown in three tones so you can match your brand voice.",
    blurb:
      "Longer-form listing descriptions across home types, written in three different tones for the same facts.",
    market: "us",
    datePublished: "2026-08-08",
  },
];

export function guide(path: GuideMeta["path"]): GuideMeta {
  const found = GUIDES.find((g) => g.path === path);
  if (!found) throw new Error(`Unknown guide: ${path}`);
  return found;
}

export function siblingGuides(path: GuideMeta["path"]): GuideMeta[] {
  return GUIDES.filter((g) => g.path !== path);
}

export function generatorPath(market: GuideMarket) {
  return market === "uk" ? "/uk-property-listing-generator" : "/us-real-estate-listing-generator";
}

/** Head metadata shared by every guide route. */
export function guideHead(meta: GuideMeta, faqs?: { q: string; a: string }[]) {
  const url = `${SITE}${meta.path}`;
  const scripts = [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: meta.title, item: url },
        ],
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: meta.title,
        description: meta.description,
        inLanguage: meta.market === "uk" ? "en-GB" : "en-US",
        datePublished: meta.datePublished,
        dateModified: meta.datePublished,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        author: { "@type": "Organization", name: "CopyByMonk" },
        publisher: { "@type": "Organization", name: "CopyByMonk", url: `${SITE}/` },
      }),
    },
  ];

  if (faqs?.length) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    });
  }

  return {
    meta: [
      { title: `${meta.title} — Quill by CopyByMonk` },
      { name: "description", content: meta.description },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: meta.title },
      { name: "twitter:description", content: meta.description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}
