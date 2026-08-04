import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  OpinlyAuthorSummary,
  OpinlyCategorySummary,
  OpinlyFullPost,
  OpinlyPostList,
} from "./opinly/types";

const listSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(512).optional(),
  category: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  sort: z.enum(["newest", "oldest"]).optional(),
});

export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<OpinlyPostList> => {
    const { fetchPosts } = await import("./opinly/api.server");
    return fetchPosts(data);
  });

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(300) }).parse(input))
  .handler(async ({ data }): Promise<OpinlyFullPost | null> => {
    const { fetchPost, OpinlyApiError } = await import("./opinly/api.server");
    try {
      return await fetchPost(data.slug);
    } catch (err) {
      if (err instanceof OpinlyApiError && err.status === 404) return null;
      throw err;
    }
  });

export const listBlogCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<OpinlyCategorySummary[]> => {
    const { fetchCategories } = await import("./opinly/api.server");
    return fetchCategories();
  },
);

export const listBlogAuthors = createServerFn({ method: "GET" }).handler(
  async (): Promise<OpinlyAuthorSummary[]> => {
    const { fetchAuthors } = await import("./opinly/api.server");
    return fetchAuthors();
  },
);

export const getBlogAuthor = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(300) }).parse(input))
  .handler(async ({ data }): Promise<OpinlyAuthorSummary | null> => {
    const { fetchAuthor } = await import("./opinly/api.server");
    return fetchAuthor(data.slug);
  });

/**
 * Authoritative, server-side conversion/purchase recording.
 * `anonId` should be forwarded from `window.opinly.anonId` when available so
 * the sale is attributed to the browser visit that earned it.
 */
export const trackOpinlyPurchase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().min(1).max(251),
        value: z.number().min(0).max(99999999.99),
        currency: z.string().length(3).optional(),
        email: z.string().email().optional(),
        anonId: z.string().min(1).max(128).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { recordOpinlyPurchase } = await import("./opinly/api.server");
    try {
      await recordOpinlyPurchase(data);
      return { ok: true as const };
    } catch (err) {
      console.error("Opinly purchase event failed", err);
      return { ok: false as const };
    }
  });

export const trackOpinlyEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        event: z.string().min(1).max(64),
        properties: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .optional(),
        externalEventId: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        anonId: z.string().min(1).max(128).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { recordOpinlyEvent } = await import("./opinly/api.server");
    try {
      await recordOpinlyEvent(data);
      return { ok: true as const };
    } catch (err) {
      console.error("Opinly event failed", err);
      return { ok: false as const };
    }
  });
