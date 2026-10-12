/** Shared SEO building blocks: absolute URLs, social cards and Organization schema. */
import { CONTACT_EMAIL } from "@/lib/config";

export const SITE = "https://copybymonk.com";
export const SITE_NAME = "Quill by CopyByMonk";
export const ORG_ID = `${SITE}/#org`;
export const WEBSITE_ID = `${SITE}/#website`;
export const OG_IMAGE = `${SITE}/og-image.png`;
export const OG_IMAGE_ALT = "Quill by CopyByMonk — one set of notes becomes a complete listing pack";
export const LOGO_ABS = `${SITE}/icon-512.png`;

export type Locale = "en_GB" | "en_US";

/** Reference to the single Organization node, for publisher/author fields. */
export const ORG_REF = { "@id": ORG_ID } as const;

export const ORGANIZATION_NODE = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: "CopyByMonk",
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: LOGO_ABS, width: 512, height: 512 },
  email: CONTACT_EMAIL,
  brand: { "@type": "Brand", name: "Quill" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: CONTACT_EMAIL,
  },
};

export const WEBSITE_NODE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: `${SITE}/`,
  publisher: ORG_REF,
  inLanguage: ["en-GB", "en-US"],
};

/** og:image / twitter:image / site_name / locale tags shared by public pages. */
export function socialMeta(opts: {
  title: string;
  description: string;
  locale?: Locale;
  image?: { url: string; width?: number; height?: number; type?: string; alt?: string };
}) {
  const img = opts.image ?? {
    url: OG_IMAGE,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: OG_IMAGE_ALT,
  };
  return [
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: opts.locale ?? "en_GB" },
    { property: "og:image", content: img.url },
    ...(img.width ? [{ property: "og:image:width", content: String(img.width) }] : []),
    ...(img.height ? [{ property: "og:image:height", content: String(img.height) }] : []),
    ...(img.type ? [{ property: "og:image:type", content: img.type }] : []),
    { property: "og:image:alt", content: img.alt ?? opts.title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: img.url },
    { name: "twitter:image:alt", content: img.alt ?? opts.title },
  ];
}

/** hreflang alternates shared by /, the UK page and the US page. */
export const MARKET_ALTERNATES = [
  { rel: "alternate", hrefLang: "en-GB", href: `${SITE}/uk-property-listing-generator` },
  { rel: "alternate", hrefLang: "en-US", href: `${SITE}/us-real-estate-listing-generator` },
  { rel: "alternate", hrefLang: "x-default", href: `${SITE}/` },
];

export const NOINDEX = { name: "robots", content: "noindex, nofollow" };

/** Routes whose content is US English. Everything else is en-GB. */
const US_PATHS = new Set([
  "/us-real-estate-listing-generator",
  "/mls-remarks-examples",
  "/real-estate-listing-description-examples",
]);

export function htmlLangFor(pathname: string): "en-GB" | "en-US" {
  const p = pathname.replace(/\/+$/, "") || "/";
  return US_PATHS.has(p) ? "en-US" : "en-GB";
}

export function jsonLd(node: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(node) };
}

/** SoftwareApplication with one market's three monthly Offers. */
export function softwareAppNode(opts: {
  url: string;
  description: string;
  currency: "GBP" | "USD";
  prices: { name: string; price: number }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quill",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: opts.url,
    description: opts.description,
    publisher: ORG_REF,
    offers: opts.prices.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: String(p.price),
      priceCurrency: opts.currency,
      url: opts.url,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: p.price,
        priceCurrency: opts.currency,
        billingDuration: "P1M",
        unitText: "MONTH",
      },
    })),
  };
}

export function breadcrumbNode(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
