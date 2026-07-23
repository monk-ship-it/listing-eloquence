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
    "Fetch the full content of a previously generated Quill listing by its id. Returns the inputs used and the full generated output (headline, listing body, 6–10 key features bullets, teaser summary, structured emailBlast copy — subjectLines, previewText, headline, body, callToAction — and Instagram, Facebook and X social posts). emailBlast is null on legacy rows saved before the Email Blast feature.",
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
    // Default missing keyFeatures to [] and missing emailBlast to null in
    // memory for legacy rows without mutating the stored output.
    const rawOutput = (data.output ?? {}) as Record<string, unknown>;
    const output = {
      ...rawOutput,
      keyFeatures: Array.isArray(rawOutput.keyFeatures) ? rawOutput.keyFeatures : [],
      emailBlast:
        rawOutput.emailBlast && typeof rawOutput.emailBlast === "object"
          ? rawOutput.emailBlast
          : null,
    };
    const listing = { ...data, output };
    return {
      content: [{ type: "text", text: JSON.stringify(listing, null, 2) }],
      structuredContent: { listing },
    };
  },
});
