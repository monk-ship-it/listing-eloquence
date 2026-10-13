import type { OpinlyImage, OpinlyPostImage } from "./types";

/** Opinly CDN root for this workspace. */
export const OPINLY_CDN_BASE = "https://cdn.opinly.ai/K9llecp1tCuaiH4sZuzJI";

/** Public site origin used for canonicals, OG urls, sitemap and RSS. */
export const SITE_URL = "https://copybymonk.com";

/** Public analytics pixel key (safe to ship in the browser). */
export const OPINLY_PIXEL_KEY = "pk-RaJs7Pe2-NjveVs4VVkQnKnaMjLWD6P2jrCIWij";

/**
 * Resolve an Opinly `fileKey` to an absolute CDN URL.
 * Absolute URLs returned by the API are passed through untouched.
 */
export function opinlyImageUrl(fileKey: string | null | undefined): string | null {
  if (!fileKey) return null;
  if (/^https?:\/\//i.test(fileKey)) return fileKey;
  return `${OPINLY_CDN_BASE}/${fileKey.replace(/^\/+/, "")}`;
}

export function listImageUrl(image: OpinlyImage | null | undefined): string | null {
  return opinlyImageUrl(image?.fileKey ?? null);
}

export function postImageUrl(image: OpinlyPostImage | null | undefined): string | null {
  return opinlyImageUrl(image?.fileKey ?? null);
}

export function imageAlt(
  image: OpinlyImage | OpinlyPostImage | null | undefined,
  fallback: string,
): string {
  if (!image) return fallback;
  const alt = "alt" in image ? image.alt : image.altText;
  return alt || image.title || fallback;
}

export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Quill is UK-only. Posts tagged/categorised for the US market, or whose title
 * mentions MLS, are excluded from the blog index, sitemap and RSS.
 */
const US_LABEL = /^(us|usa|united[- ]states|us[- ]agents?|us[- ]market|real[- ]estate[- ]us)$/i;
export function isUsOnlyPost(post: {
  title?: string | null;
  category?: { slug?: string; name?: string } | null;
  tags?: { slug?: string; name?: string }[] | null;
  categories?: string[] | null;
}): boolean {
  if (post.title && /\bMLS\b/i.test(post.title)) return true;
  const labels = [
    post.category?.slug,
    post.category?.name,
    ...(post.tags ?? []).flatMap((t) => [t.slug, t.name]),
    ...(post.categories ?? []),
  ].filter((v): v is string => !!v);
  return labels.some((l) => US_LABEL.test(l.trim()));
}
