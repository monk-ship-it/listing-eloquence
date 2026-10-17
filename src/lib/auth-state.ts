/** Reject paths that browsers could interpret as an external URL. */
export function sanitizeAuthNext(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return undefined;
  return value;
}

/** A normal signed-in session is not a password-recovery session. */
export function isRecoveryLink(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" && !!params.get("access_token") && !params.has("error");
}