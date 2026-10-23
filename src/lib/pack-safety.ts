import type { FactFlag } from "./fact-check";
import type { CheckItem } from "./material-info";
import type { ListingInput, ListingOutput, SellerApproval } from "./listing-types";
import { coerceLegacyInput, coerceLegacyOutput } from "./listing-types";

/** Exact canonical content, not a lossy hash. Approval is never taken from an input checkbox. */
export function approvalSnapshot(input: ListingInput, output: ListingOutput): string {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .filter(
            ([key, v]) => key !== "sellerApproved" && key !== "sellerApproval" && v !== undefined,
          )
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, v]) => [key, canonical(v)]),
      );
    }
    return value;
  };
  const cleanInput = Object.fromEntries(
    Object.entries(coerceLegacyInput(input)).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  );
  return JSON.stringify(canonical({ input: cleanInput, output: coerceLegacyOutput(output) }));
}

export function hasSellerApproval(
  input: ListingInput,
  output: ListingOutput,
  generationId: string | null,
): boolean {
  const approval: SellerApproval | undefined = output.sellerApproval;
  return (
    !!generationId &&
    approval?.generationId === generationId &&
    Number.isFinite(Date.parse(approval.approvedAt)) &&
    approval.snapshot === approvalSnapshot(input, output)
  );
}

export function needsSafetyDraft(
  sellerApproved: boolean | undefined,
  checks: CheckItem[],
  flags: FactFlag[],
): boolean {
  return sellerApproved !== true || checks.some((i) => !i.ok) || flags.length > 0;
}
