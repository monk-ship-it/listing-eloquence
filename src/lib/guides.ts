/** Static, evergreen SEO guides published under the public Guides hub. */

import { SITE, ORG_REF, OG_IMAGE, socialMeta } from "@/lib/seo";

export { SITE };

export interface GuideMeta {
  /** Route path, also the canonical path. */
  path: "/property-description-examples" | "/rightmove-property-description-template";
  title: string;
  /** Document <title>, with the "| Quill" suffix. */
  docTitle: string;
  /** Short label for cards and cross-links. */
  label: string;
  /** 140–160 char meta description. */
  description: string;
  /** One-line card blurb. */
  blurb: string;
  datePublished: string;
  dateModified: string;
}

export const GUIDES: GuideMeta[] = [
  {
    path: "/property-description-examples",
    docTitle: "UK Property Description Examples for Estate Agents | Quill",
    title: "Property Description Examples for UK Estate Agents",
    label: "UK property description examples",
    description:
      "Property description examples for UK estate agents across flats, terraces, semis and country homes, with a breakdown of why each example actually works.",
    blurb:
      "Full worked descriptions for four UK property types, annotated so you can see which sentence is doing the selling.",
    datePublished: "2026-08-08",
    dateModified: "2026-10-12",
  },
  {
    path: "/rightmove-property-description-template",
    docTitle: "Rightmove-Style Description Template & Checklist | Quill",
    title: "Rightmove-Style Property Description Template & Checklist",
    label: "Rightmove-style description template",
    description:
      "A practical Rightmove-style property description template and pre-publish checklist for UK estate agents, with fill-in prompts and Material Information notes.",
    blurb:
      "A paragraph-by-paragraph template plus a pre-publish checklist you can run before a listing goes live.",
    datePublished: "2026-08-08",
    dateModified: "2026-10-12",
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

export function generatorPath() {
  return "/uk-property-listing-generator" as const;
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
        inLanguage: "en-GB",
        datePublished: meta.datePublished,
        dateModified: meta.dateModified,
        image: [OG_IMAGE],
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        author: ORG_REF,
        publisher: ORG_REF,
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
      { title: meta.docTitle },
      { name: "description", content: meta.description },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "article:published_time", content: meta.datePublished },
      { property: "article:modified_time", content: meta.dateModified },
      ...socialMeta({
        title: meta.title,
        description: meta.description,
        locale: "en_GB",
      }),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}
