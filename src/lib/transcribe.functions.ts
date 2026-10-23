import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANGUAGES } from "@/hooks/useDictationSettings";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Speech-to-text for voice notes. Audio is forwarded to Lovable AI and never
 * stored. Requires active access but does not consume a listing.
 */
export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Invalid upload.");
    const file = input.get("audio");
    const lang = String(input.get("lang") ?? "en-GB");
    if (!(file instanceof File) || !file.size) throw new Error("No audio was recorded.");
    if (file.size > MAX_BYTES) throw new Error("RECORDING_TOO_LARGE");
    const type = (file.type || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("audio/") && type !== "video/webm" && type !== "video/mp4") {
      throw new Error("Unsupported audio format.");
    }
    if (!LANGUAGES.some((l) => l.code === lang)) throw new Error("Unsupported language.");
    return { file, lang, type };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { isCompedUserId } = await import("./comped.server");
    const { hasActiveAccess, readReconciledSubscriber } = await import("./subscription.functions");
    const sub = await readReconciledSubscriber(supabase, userId);
    const comped = isCompedUserId(userId);
    if (!comped && !hasActiveAccess(sub?.status ?? "none", sub?.current_period_end ?? null, sub?.stripe_price_id)) {
      throw new Error("SUBSCRIPTION_REQUIRED");
    }

    // Rolling 24h budget (200 calls, 40 MB, bounded in-flight) reserved atomically
    // BEFORE the provider call; every attempt counts, so failures can't bypass it.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { reserveProviderCall, settleProviderCall } = await import("./provider-quota");
    const reservationId = await reserveProviderCall(supabaseAdmin, userId, "transcribe", data.file.size);
    try {
      const { callTranscription } = await import("./transcription.server");
      const text = await callTranscription(data);
      await settleProviderCall(supabaseAdmin, userId, reservationId, true);
      return { text };
    } catch (err) {
      await settleProviderCall(supabaseAdmin, userId, reservationId, false);
      throw err;
    }
  });

