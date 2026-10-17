/** Reject paths that browsers could interpret as an external URL. */
export function resolveAuthMode(mode: unknown, plan: unknown): "login" | "signup" {
  if (mode === "login" || mode === "signup") return mode;
  return ["starter", "pro", "growth"].includes(typeof plan === "string" ? plan : "") ? "signup" : "login";
}

export function sanitizeAuthNext(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return undefined;
  return value;
}

/** Resolve a sanitized next path against the current origin; undefined if it would leave it. */
export function resolveSameOriginNext(value: unknown, origin: string): string | undefined {
  const path = sanitizeAuthNext(value);
  if (!path) return undefined;
  try {
    const url = new URL(path, origin);
    return url.origin === new URL(origin).origin ? url.pathname + url.search + url.hash : undefined;
  } catch {
    return undefined;
  }
}

/** A normal signed-in session is not a password-recovery session. */
export function isRecoveryLink(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" && !!params.get("access_token") && !params.has("error");
}