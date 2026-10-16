import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface AdminContext {
  userId: string;
  supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: string }) => PromiseLike<{ data: unknown; error: unknown }> };
}

/**
 * Admin check via the server-only user_roles table. Never derived from
 * user-editable profile data or email claims.
 */
async function assertAdmin(context: AdminContext): Promise<void> {
  // Checked as the caller (has_role is security definer, callable by authenticated).
  const { data, error } = await context.supabase.rpc("has_role", {
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

export interface WorkbenchExport {
  promptVersion: string;
  model: string;
  /** Prompt version stored on the saved listing (null for the current form or older rows). */
  storedPromptVersion: string | null;
  variables: Record<string, string>;
  /** Exact Messages API bodies as JSON strings (what the app would send). */
  requests: { core: string; marketing: string; extract: string | null };
}

/**
 * Admin-only: the exact Claude requests for the current form ({ input }) or
 * one of the admin's OWN saved listings ({ generationId }) — inputs contain
 * private viewing notes. No AI call, no credit.
 */
export const exportWorkbenchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { generationId?: string; input?: unknown }) => {
    if (raw?.generationId !== undefined) {
      const id = raw.generationId;
      if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
        throw new Error("Invalid listing.");
      return { generationId: id, input: null as unknown };
    }
    if (!raw?.input || typeof raw.input !== "object") throw new Error("Nothing to export.");
    return { generationId: null as string | null, input: raw.input as unknown };
  })
  .handler(async ({ data, context }): Promise<WorkbenchExport> => {
    await assertAdmin(context as unknown as AdminContext);
    const { coerceLegacyInput } = await import("./listing-types");
    const { normaliseInput, promptVars } = await import("./prompts/render");
    const { buildCoreRequest, buildExtractRequest, buildMarketingRequest } =
      await import("./prompts/calls");
    const { PROMPT_VERSION } = await import("./prompts/version.gen");
    const { toApiBody, getConfiguredClaudeModel } = await import("./ai-gateway.server");

    let rawInput: unknown = data.input;
    let storedPromptVersion: string | null = null;
    if (data.generationId) {
      const { supabase, userId } = context;
      const { data: row, error } = await supabase
        .from("generations")
        .select("inputs, output, voice")
        .eq("id", data.generationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !row) throw new Error("That listing couldn't be found.");
      rawInput = { voice: row.voice, ...((row.inputs ?? {}) as Record<string, unknown>) };
      const meta = (row.output as { meta?: { promptVersion?: unknown } } | null)?.meta;
      storedPromptVersion = typeof meta?.promptVersion === "string" ? meta.promptVersion : null;
    }
    const coerced = coerceLegacyInput(rawInput);
    let input;
    try {
      input = normaliseInput(coerced);
    } catch {
      input = normaliseInput({ ...coerced, voice: "professional" });
    }
    const model = await getConfiguredClaudeModel();
    const notes = input.voiceNotes?.trim() ?? "";
    return {
      promptVersion: PROMPT_VERSION,
      model,
      storedPromptVersion,
      variables: promptVars(input),
      requests: {
        core: JSON.stringify(toApiBody(buildCoreRequest(input), model), null, 2),
        marketing: JSON.stringify(toApiBody(buildMarketingRequest(input), model), null, 2),
        extract:
          notes.length >= 10
            ? JSON.stringify(toApiBody(buildExtractRequest(notes), model), null, 2)
            : null,
      },
    };
  });
