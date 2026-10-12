import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface AdminContext {
  userId: string;
}

/**
 * Admin check via the server-only user_roles table. Never derived from
 * user-editable profile data or email claims.
 */
async function assertAdmin(context: AdminContext): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("FORBIDDEN");
  }
}

export interface ModelSetting {
  model: string;
  updatedAt: string | null;
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    try {
      await assertAdmin(context as unknown as AdminContext);
      return true;
    } catch {
      return false;
    }
  });

export const getClaudeModelSetting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ModelSetting> => {
    await assertAdmin(context as unknown as AdminContext);
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
    await assertAdmin(context as unknown as AdminContext);

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
