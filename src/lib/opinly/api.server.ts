/**
 * Server-only Opinly REST client.
 *
 * The secret `sk-` API key never leaves the server: every read goes through
 * this module, called from server functions / server routes.
 */
import type {
  OpinlyAuthorSummary,
  OpinlyCategorySummary,
  OpinlyFullPost,
  OpinlyPostList,
  OpinlyRoute,
  OpinlyRssItem,
  PostSort,
} from "./types";

const API_BASE = "https://sdk.opinly.ai/v1";

/** Thrown for non-2xx Opinly responses. `status === 404` means "not found". */
export class OpinlyApiError extends Error {
  status: number;
  code: string | undefined;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "OpinlyApiError";
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Tiny in-memory response cache (per worker instance), invalidated by webhook
// ---------------------------------------------------------------------------
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expires: number; value: unknown }>();

function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL_MS) {
  cache.set(key, { expires: Date.now() + ttl, value });
}

/** Drop cache entries whose key starts with any of the given prefixes. */
export function invalidateOpinlyCache(prefixes: string[]) {
  for (const key of [...cache.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) cache.delete(key);
  }
}

export function clearOpinlyCache() {
  cache.clear();
}

async function opinlyGet<T>(path: string, query: Record<string, string | undefined> = {}) {
  const apiKey = process.env["OPINLY_API_KEY"];
  if (!apiKey) throw new OpinlyApiError(500, "OPINLY_API_KEY is not configured");

  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }

  const cacheKey = `${path}?${url.searchParams.toString()}`;
  const cached = cacheGet<T>(cacheKey);
  if (cached !== undefined) return cached;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const body = await res.text();
    let detail = body.slice(0, 500);
    let code: string | undefined;
    try {
      const parsed = JSON.parse(body) as { detail?: string; title?: string; code?: string };
      detail = parsed.detail || parsed.title || detail;
      code = parsed.code;
    } catch {
      /* non-JSON error body */
    }
    console.error(`Opinly GET ${path} failed [${res.status}]: ${detail}`);
    throw new OpinlyApiError(res.status, detail || `Opinly request failed (${res.status})`, code);
  }

  const json = (await res.json()) as T;
  cacheSet(cacheKey, json);
  return json;
}

// ---------------------------------------------------------------------------
// Content reads
// ---------------------------------------------------------------------------
export function fetchPosts(params: {
  limit?: number;
  cursor?: string;
  category?: string;
  author?: string;
  sort?: PostSort;
}) {
  return opinlyGet<OpinlyPostList>("/content/posts", {
    limit: String(params.limit ?? 12),
    cursor: params.cursor,
    category: params.category,
    author: params.author,
    sort: params.sort,
  });
}

export function fetchPost(slug: string) {
  return opinlyGet<OpinlyFullPost>("/content/post", { slug });
}

export function fetchRoutes() {
  return opinlyGet<OpinlyRoute[]>("/content/routes");
}

export function fetchCategories() {
  return opinlyGet<OpinlyCategorySummary[]>("/content/categories");
}

export async function fetchAuthors() {
  const res = await opinlyGet<{ type: string; data: OpinlyAuthorSummary[] }>("/content/authors");
  return res.data ?? [];
}

export async function fetchAuthor(slug: string) {
  const res = await opinlyGet<{ type: string; data: OpinlyAuthorSummary | null }>(
    `/content/authors/${encodeURIComponent(slug)}`,
  );
  if (!res || res.type === "not-found" || !res.data) return null;
  return res.data;
}

export function fetchRss(limit = 20) {
  return opinlyGet<OpinlyRssItem[]>("/content/rss", { limit: String(limit) });
}

// ---------------------------------------------------------------------------
// Server-side event recording (authoritative revenue / conversions)
// ---------------------------------------------------------------------------
async function opinlyPost<T>(path: string, body: unknown) {
  const apiKey = process.env["OPINLY_API_KEY"];
  if (!apiKey) throw new OpinlyApiError(500, "OPINLY_API_KEY is not configured");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Opinly POST ${path} failed [${res.status}]: ${text.slice(0, 500)}`);
    throw new OpinlyApiError(
      res.status,
      text.slice(0, 500) || `Opinly event failed (${res.status})`,
    );
  }
  return (await res.json()) as T;
}

export function recordOpinlyPurchase(input: {
  orderId: string;
  value: number;
  currency?: string;
  email?: string;
  anonId?: string;
}) {
  return opinlyPost<{ ok?: boolean }>("/events/purchase", input);
}

export function recordOpinlyEvent(input: {
  event: string;
  properties?: Record<string, unknown>;
  externalEventId?: string;
  email?: string;
  anonId?: string;
}) {
  return opinlyPost<{ ok?: boolean }>("/events", input);
}
