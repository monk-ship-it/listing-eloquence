import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function supabaseForUser(ctx: ToolContext) {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_generation",
  title: "Get a listing",
  description:
    "Fetch the full content of a previously generated Quill listing by its id. Returns the inputs used and the full generated output (headline, listing body, key features bullets, teaser summary, and social posts). The output.keyFeatures array holds 6–10 factual portal/MLS-style highlights drawn from the supplied facts.",
  inputSchema: {
    id: z.string().uuid().describe("The listing id returned by list_generations."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("generations")
      .select("id, voice, property_title, created_at, inputs, output")
      .eq("id", id)
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Listing not found" }], isError: true };
    }
    // Default missing keyFeatures to [] in memory for legacy rows without
    // mutating the stored output; hand back the raw row otherwise.
    const rawOutput = (data.output ?? {}) as Record<string, unknown>;
    const output = {
      ...rawOutput,
      keyFeatures: Array.isArray(rawOutput.keyFeatures) ? rawOutput.keyFeatures : [],
    };
    const listing = { ...data, output };
    return {
      content: [{ type: "text", text: JSON.stringify(listing, null, 2) }],
      structuredContent: { listing },
    };
  },
});
