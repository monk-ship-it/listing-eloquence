import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ListingInput, ListingOutput } from "./listing-types";

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
      output: row.output as unknown as ListingOutput,
    }));
  });

export const deleteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing listing id.");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
