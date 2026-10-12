// Server-only: never import from client-reachable module scope.
/** Emails granted free, permanent access to the app (case-insensitive). */
const COMPED_EMAILS = ["domenico@copybymonk.com"];

/** Whether the given email always has full access, bypassing billing. */
export function isCompedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return COMPED_EMAILS.includes(email.trim().toLowerCase());
}
