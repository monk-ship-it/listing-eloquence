// Server-only entitlement bound to the verified, existing owner account ID.
const OWNER_USER_ID = "ac5319e0-b05c-4ec8-99fc-e52559637b5f";
export function isCompedUserId(userId: string | null | undefined): boolean {
  return userId === OWNER_USER_ID;
}
