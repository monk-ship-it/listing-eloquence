import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type { ListingInput, ListingOutput } from "./listing-types";
import { coerceLegacyInput, coerceLegacyOutput } from "./listing-types";
import { approvalSnapshot } from "./pack-safety";
import { AGENCY_KEYS, EMPTY_AGENCY, type AgencyDetails } from "./clipboard";

export interface GenerationRecord {
  id: string;
  voice: string;
  propertyTitle: string | null;
  createdAt: string;
  inputs: ListingInput;
  output: ListingOutput;
}

export const listMyGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => {
    const n = Number(input?.limit ?? 100);
    return { limit: Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 2000) : 100 };
  })
  .handler(async ({ context, data: params }): Promise<GenerationRecord[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generations")
      .select("id, voice, property_title, created_at, inputs, output")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(params.limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      voice: row.voice,
      propertyTitle: row.property_title,
      createdAt: row.created_at,
      inputs: row.inputs as unknown as ListingInput,
      // In-memory coercion only — never rewrites the stored row.
      output: coerceLegacyOutput(row.output),
    }));
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Record the agent's confirmation of seller approval for this exact saved revision. */
export const setGenerationSellerApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; snapshot: string; approved: boolean }) => {
    if (
      !UUID_RE.test(input?.id ?? "") ||
      typeof input.snapshot !== "string" ||
      input.snapshot.length > 1_000_000 ||
      typeof input.approved !== "boolean"
    )
      throw new Error("Invalid approval request.");
    return input;
  })
  .handler(async ({ data, context }): Promise<ListingOutput> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("generations")
      .select("id, inputs, output")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error("Couldn't load the listing for approval.");
    if (!row) throw new Error("That listing couldn't be found.");
    const output = coerceLegacyOutput(row.output);
    const snapshot = approvalSnapshot(coerceLegacyInput(row.inputs), output);
    if (snapshot !== data.snapshot)
      throw new Error(
        "This pack changed. Reopen the saved listing and review the current wording before approving it.",
      );
    const next = { ...((row.output ?? {}) as Record<string, unknown>) };
    delete next.sellerApproval;
    next.revisionId = output.revisionId ?? crypto.randomUUID();
    if (data.approved)
      next.sellerApproval = {
        generationId: row.id,
        approvedAt: new Date().toISOString(),
        snapshot: approvalSnapshot(coerceLegacyInput(row.inputs), coerceLegacyOutput(next)),
      };
    // Compare-and-set: a concurrent marketing update must never be overwritten
    // by an approval based on the previous revision.
    let update = supabase
      .from("generations")
      .update({ output: JSON.parse(JSON.stringify(next)) })
      .eq("id", row.id)
      .eq("user_id", userId);
    update = output.revisionId
      ? update.eq("output->>revisionId", output.revisionId)
      : update.is("output->>revisionId", null);
    const { data: saved, error: updateError } = await update.select("output").maybeSingle();
    if (updateError || !saved)
      throw new Error(
        "The pack changed or approval couldn't be saved. Refresh and review it again.",
      );
    return coerceLegacyOutput(saved.output);
  });

export const deleteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = typeof input?.id === "string" ? input.id.trim() : "";
    if (!id || !UUID_RE.test(id)) throw new Error("Invalid listing id.");
    return { id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; deleted: boolean }> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("generations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id");
    if (error) throw new Error(error.message);
    return { ok: true, deleted: (rows?.length ?? 0) > 0 };
  });

/** One saved listing (owner only) — used by "Open in generator". */
export const getGeneration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = typeof input?.id === "string" ? input.id.trim() : "";
    if (!id || !UUID_RE.test(id)) throw new Error("Invalid listing id.");
    return { id };
  })
  .handler(async ({ data, context }): Promise<GenerationRecord | null> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("generations")
      .select("id, voice, property_title, created_at, inputs, output")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      id: row.id,
      voice: row.voice,
      propertyTitle: row.property_title,
      createdAt: row.created_at,
      inputs: row.inputs as unknown as ListingInput,
      output: coerceLegacyOutput(row.output),
    };
  });

// ---------------------------------------------------------------------------
// Agency details — saved once on the account, added to emails at copy time.
// Stored in profiles.agency (jsonb); RLS: owner-only read/update.
// ---------------------------------------------------------------------------

const AGENCY_MAX = 200;

/** Keep only the known fields, as trimmed single-line strings. */
export function cleanAgencyDetails(raw: unknown): AgencyDetails {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = { ...EMPTY_AGENCY };
  for (const k of AGENCY_KEYS) {
    const v = r[k];
    out[k] =
      typeof v === "string"
        ? v
            // Remove control characters from a single-line contact field.
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u001f\u007f]+/g, " ")
            .trim()
            .slice(0, AGENCY_MAX)
        : "";
  }
  return out;
}

export const getMyAgency = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AgencyDetails> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("agency")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return cleanAgencyDetails(data?.agency);
  });

export const saveMyAgency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<AgencyDetails>) => cleanAgencyDetails(input))
  .handler(async ({ data, context }): Promise<AgencyDetails> => {
    const { supabase, userId } = context;
    const agency = data as unknown as Json;
    const { data: rows, error } = await supabase
      .from("profiles")
      .update({ agency })
      .eq("id", userId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) {
      const { error: insErr } = await supabase.from("profiles").insert({ id: userId, agency });
      if (insErr) throw new Error(insErr.message);
    }
    return data;
  });
