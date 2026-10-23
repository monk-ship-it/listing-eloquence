import { describe, expect, it, vi } from "vitest";
import { approvalSnapshot, hasSellerApproval } from "./pack-safety";
import { coerceLegacyOutput, EMPTY_INPUT, type ListingOutput } from "./listing-types";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (value: unknown) => value;
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: typeof validate) => {
        validate = fn;
        return builder;
      },
      handler:
        (handler: (args: unknown) => unknown) => (args: { data: unknown; context: unknown }) =>
          handler({ ...args, data: validate(args.data) }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

import { setGenerationSellerApproval } from "./generations.functions";

const id = "12345678-1234-1234-1234-123456789abc";
const revisionId = "23456789-1234-1234-1234-123456789abc";
const inputs = { ...EMPTY_INPUT, address: "12 Test Street" };
const output: ListingOutput = {
  revisionId,
  headline: "A home",
  listing: "Two bedrooms",
  summary: "A supplied home",
  keyFeatures: ["Two bedrooms"],
  emailBlast: null,
  social: [],
};

function database(
  initial: ListingOutput = output,
  beforeUpdate?: (row: { output: ListingOutput }) => void,
) {
  const row = { id, user_id: "owner", inputs, output: structuredClone(initial) };
  const updateFilters: string[] = [];
  const db = {
    from: () => {
      const filters: [string, unknown][] = [];
      let patch: { output: ListingOutput } | undefined;
      const query = {
        select: () => query,
        eq: (field: string, value: unknown) => {
          filters.push([field, value]);
          if (patch) updateFilters.push(field);
          return query;
        },
        is: (field: string, value: unknown) => query.eq(field, value),
        update: (value: { output: ListingOutput }) => {
          patch = value;
          return query;
        },
        maybeSingle: async () => {
          if (patch) beforeUpdate?.(row);
          const matches = filters.every(([field, value]) =>
            field === "output->>revisionId"
              ? (row.output.revisionId ?? null) === value
              : row[field as "id" | "user_id"] === value,
          );
          if (!matches) return { data: null, error: null };
          if (patch) row.output = structuredClone(patch.output);
          return { data: structuredClone(row), error: null };
        },
      };
      return query;
    },
  };
  return { db, row, updateFilters };
}

const invoke = setGenerationSellerApproval as unknown as (args: {
  data: { id: string; snapshot: string; approved: boolean };
  context: { supabase: unknown; userId: string };
}) => Promise<ListingOutput>;

describe("saved seller approval", () => {
  it("persists exact approval using a compact content-revision condition", async () => {
    const { db, row, updateFilters } = database();
    const saved = await invoke({
      data: { id, snapshot: approvalSnapshot(inputs, output), approved: true },
      context: { supabase: db, userId: "owner" },
    });
    expect(hasSellerApproval(inputs, coerceLegacyOutput(saved), id)).toBe(true);
    expect(row.output.sellerApproval?.generationId).toBe(id);
    expect(updateFilters).toContain("output->>revisionId");
    expect(updateFilters).not.toContain("output");
    expect(updateFilters).not.toContain("inputs");
  });
  it("cannot approve another account's generation", async () => {
    const { db, row } = database();
    await expect(
      invoke({
        data: { id, snapshot: approvalSnapshot(inputs, output), approved: true },
        context: { supabase: db, userId: "another-user" },
      }),
    ).rejects.toThrow("couldn't be found");
    expect(row.output.sellerApproval).toBeUndefined();
  });
  it("rejects a changed revision without overwriting new marketing", async () => {
    const { db, row } = database(output, (current) => {
      current.output = {
        ...current.output,
        revisionId: "34567890-1234-1234-1234-123456789abc",
        summary: "New marketing",
      };
    });
    await expect(
      invoke({
        data: { id, snapshot: approvalSnapshot(inputs, output), approved: true },
        context: { supabase: db, userId: "owner" },
      }),
    ).rejects.toThrow("pack changed");
    expect(row.output.summary).toBe("New marketing");
    expect(row.output.sellerApproval).toBeUndefined();
  });
  it("assigns a guarded first revision to a legacy row and can revoke it", async () => {
    const legacy = { ...output };
    delete legacy.revisionId;
    const { db } = database(legacy);
    const saved = await invoke({
      data: { id, snapshot: approvalSnapshot(inputs, legacy), approved: true },
      context: { supabase: db, userId: "owner" },
    });
    expect(saved.revisionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(hasSellerApproval(inputs, saved, id)).toBe(true);
    const revoked = await invoke({
      data: { id, snapshot: approvalSnapshot(inputs, saved), approved: false },
      context: { supabase: db, userId: "owner" },
    });
    expect(revoked.sellerApproval).toBeUndefined();
  });
});
