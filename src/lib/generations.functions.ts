import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ListingInput, ListingOutput } from "./listing-types";
import { coerceLegacyOutput } from "./listing-types";

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
  .handler(async ({ context }): Promise<GenerationRecord[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generations")
      .select("id, voice, property_title, created_at, inputs, output")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
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
