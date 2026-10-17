import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ExtractResult } from "./extract-filter";

const MAX_NOTES = 8000;
const DAILY_LIMIT = 40;
/** "Fill the form from my voice note". Free (no listing credit), 40/day. */
export const extractListingFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { voiceNotes: string }) => {
    const notes = typeof input?.voiceNotes === "string" ? input.voiceNotes.trim() : "";
    if (notes.length < 10) throw new Error("Add a few details to your voice notes first.");
    if (notes.length > MAX_NOTES)
      throw new Error("Your voice notes are too long to read in one go.");
    return { voiceNotes: notes };
  })
  .handler(async ({ data, context }): Promise<ExtractResult> => {
    const { supabase, userId } = context;
    const { isCompedUserId } = await import("./comped.server");
    const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
    const sub = await readReconciledSubscriber(supabase, userId);
    const comped = isCompedUserId(userId);
    if (!comped && !hasActiveAccess(sub?.status ?? "none", sub?.current_period_end ?? null)) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabaseAdmin
      .from("regen_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "extract")
      .gte("created_at", since.toISOString());
    if (countError) {
      console.error("regen_usage count failed", countError);
      throw new Error("AI_UNAVAILABLE");
    }
    if ((count ?? 0) >= DAILY_LIMIT) throw new Error("EXTRACT_LIMIT_REACHED");

    let result: ExtractResult;
    try {
      const { runExtraction } = await import("./generation.server");
      result = await runExtraction(data.voiceNotes);
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      console.warn("extract failed", m);
      try {
        await supabaseAdmin
          .from("generation_errors")
          .insert({ user_id: userId, stage: "regen", code: `extract:${m.slice(0, 40)}` });
      } catch {
        // ignore
      }
      throw new Error(
        ["AI_TIMEOUT", "RATE_LIMIT", "AI_TRUNCATED", "MALFORMED_AI_OUTPUT"].find((k) =>
          m.includes(k),
        ) ?? "AI_UNAVAILABLE",
      );
    }

    const { error: usageErr } = await supabaseAdmin
      .from("regen_usage")
      .insert({ user_id: userId, kind: "extract" });
    if (usageErr) console.error("regen_usage insert failed", usageErr);
    return result;
  });
