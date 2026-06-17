import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isCompedEmail } from "./config";

async function assertAdmin(context: {
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>;
  userId: string;
  claims: Record<string, unknown>;
}): Promise<void> {
  const claimEmail = typeof context.claims?.email === "string" ? (context.claims.email as string) : null;
  let email = claimEmail;
  if (!email) {
    const { data } = await context.supabase
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    email = (data as { email?: string } | null)?.email ?? null;
  }
  if (!isCompedEmail(email)) {
    throw new Error("FORBIDDEN");
  }
}

export interface ModelSetting {
  model: string;
  updatedAt: string | null;
}

export const getClaudeModelSetting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ModelSetting> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "claude_model")
      .maybeSingle();
    const { DEFAULT_CLAUDE_MODEL } = await import("./ai-gateway.server");
    return {
      model: data?.value ?? DEFAULT_CLAUDE_MODEL,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveClaudeModelSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { model: string }) => {
    const model = (input?.model ?? "").trim();
    if (!model) throw new Error("Please enter a model id.");
    if (model.length > 200) throw new Error("Model id is too long.");
    return { model };
  })
  .handler(async ({ data, context }): Promise<ModelSetting> => {
    await assertAdmin(context as never);

    // Safe validation: make a tiny live request before saving.
    const { validateClaudeModel } = await import("./ai-gateway.server");
    const error = await validateClaudeModel(data.model);
    if (error) throw new Error(error);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error: dbError } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "claude_model", value: data.model, updated_at: new Date().toISOString() })
      .select("value, updated_at")
      .maybeSingle();
    if (dbError) throw new Error(dbError.message);

    return {
      model: saved?.value ?? data.model,
      updatedAt: saved?.updated_at ?? null,
    };
  });
