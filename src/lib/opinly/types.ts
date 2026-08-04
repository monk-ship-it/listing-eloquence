/**
 * Types mirroring the Opinly Content API (https://sdk.opinly.ai/v1/openapi.json).
 * Only the fields the app renders are modelled; unknown fields pass through.
 */

export interface OpinlyImage {
  fileKey: string | null;
  alt: string | null;
  title: string | null;
  caption: string | null;
}

/** Image shape used inside the full-post payload (uses `altText`). */
export interface OpinlyPostImage {
  fileKey: string | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
}

export interface OpinlyPostCategory {
  slug: string;
  name: string;
  description: string;
}

export interface OpinlyPostAuthor {
  name: string;
  slug: string;
  fileKey: string | null;
  bio: string | null;
}

export interface OpinlyPostTag {
  slug: string;
  name: string;
}

export interface OpinlyPost {
  slug: string;
  title: string;
  description: string;
  firstPublishedAt: string;
  lastPublishedAt: string;
  image: OpinlyImage | null;
  category: OpinlyPostCategory | null;
  author: OpinlyPostAuthor | null;
  tags: OpinlyPostTag[];
}

export interface OpinlyPostList {
  data: OpinlyPost[];
  has_more: boolean;
  next_cursor: string | null;
}

export type OpinlyAttrValue = string | number | boolean | null;

export interface OpinlyContentMark {
  type: string;
  attrs?: Record<string, OpinlyAttrValue> | null;
}

/** Rich-text node tree (ProseMirror-style) returned as `content` on a full post. */
export interface OpinlyContentNode {
  type?: string;
  attrs?: Record<string, OpinlyAttrValue> | null;
  marks?: OpinlyContentMark[];
  text?: string;
  content?: OpinlyContentNode[];
}

export interface OpinlyFaq {
  question: string;
  answer: string;
}

export interface OpinlyFullPost {
  content: OpinlyContentNode;
  title: string;
  slug: string;
  description: string;
  metaDescription: string | null;
  metaTitle: string | null;
  titleFile: OpinlyPostImage | null;
  firstPublishedAt: string;
  modifiedAt: string;
  images: OpinlyPostImage[];
  author: { name: string; fileKey: string | null; bio: string | null; slug: string } | null;
  faqs: OpinlyFaq[] | null;
  category: OpinlyPostCategory | null;
  tags: OpinlyPostTag[];
}

export type OpinlyRouteType = "home" | "post" | "category" | "author" | "tag";

export interface OpinlyRoute {
  type: OpinlyRouteType;
  slug: string;
  lastModified: string;
}

export interface OpinlyCategorySummary {
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  posts: OpinlyPost[];
}

export interface OpinlyAuthorSummary {
  name: string;
  slug: string;
  bio: string | null;
  image: OpinlyImage | null;
  posts: OpinlyPost[];
}

export interface OpinlyRssItem {
  slug: string;
  title: string;
  description?: string;
  date: string;
  categories?: string[];
}

export interface OpinlyTagSummary {
  slug: string;
  name: string;
  description: string | null;
  postCount: number;
}

export type PostSort = "newest" | "oldest";
