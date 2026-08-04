/**
 * Client-side Opinly analytics helpers.
 *
 * The pixel (public `pk-` key) is loaded in the document head from
 * src/routes/__root.tsx. These helpers are thin, safe wrappers: they no-op
 * when the pixel hasn't loaded (SSR, ad blockers) so callers never need guards.
 */

type OpinlyPixel = {
  anonId?: string;
  track?: (event: string, properties?: Record<string, unknown>) => void;
  identify?: (email: string, traits?: Record<string, unknown>) => void;
  page?: (path?: string) => void;
};

function pixel(): OpinlyPixel | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { opinly?: OpinlyPixel }).opinly ?? null;
}

/** Opinly anonymous visitor id — the join key for server-side events. */
export function getOpinlyAnonId(): string | undefined {
  return pixel()?.anonId;
}

/** Fire a browser-side event (standard name or custom). */
export function opinlyTrack(event: string, properties?: Record<string, unknown>) {
  try {
    pixel()?.track?.(event, properties);
  } catch (err) {
    console.warn("Opinly track failed", err);
  }
}

/** Link the current anonymous visitor to a known person. */
export function opinlyIdentify(email: string, traits?: Record<string, unknown>) {
  if (!email) return;
  try {
    pixel()?.identify?.(email, traits);
  } catch (err) {
    console.warn("Opinly identify failed", err);
  }
}

/** Record a client-side page view (SPA route change). */
export function opinlyPageView(path: string) {
  try {
    const p = pixel();
    if (p?.page) p.page(path);
    else p?.track?.("page_view", { path });
  } catch {
    /* non-fatal */
  }
}

/** Standard conversion events, kept in one place so names stay consistent. */
export const OpinlyEvents = {
  signUp: (properties?: Record<string, unknown>) => opinlyTrack("sign_up", properties),
  login: (properties?: Record<string, unknown>) => opinlyTrack("login", properties),
  generateLead: (properties?: Record<string, unknown>) =>
    opinlyTrack("generate_lead", properties),
  startTrial: (properties?: Record<string, unknown>) => opinlyTrack("start_trial", properties),
  beginCheckout: (properties?: Record<string, unknown>) =>
    opinlyTrack("begin_checkout", properties),
  subscribe: (properties?: Record<string, unknown>) => opinlyTrack("subscribe", properties),
  viewContent: (properties?: Record<string, unknown>) => opinlyTrack("view_content", properties),
  search: (properties?: Record<string, unknown>) => opinlyTrack("search", properties),
};
