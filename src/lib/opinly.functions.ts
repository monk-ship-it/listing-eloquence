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
    const { isNonUkPost } = await import("./opinly/shared");
    const res = await fetchPosts(data);
    return { ...res, data: res.data.filter((p) => !isNonUkPost(p)) };
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

// Purchase/event tracking endpoints were removed: they were unused and, being
// unauthenticated, let anyone post fake conversions.
