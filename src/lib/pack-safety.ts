import type { FactFlag } from "./fact-check";
import type { CheckItem } from "./material-info";
export function needsSafetyDraft(sellerApproved: boolean | undefined, checks: CheckItem[], flags: FactFlag[]): boolean {
  return sellerApproved !== true || checks.some(i => !i.ok && ["block", "conflict"].includes(i.severity)) || flags.length > 0;
}