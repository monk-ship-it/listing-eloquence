/**
 * Durable pre-call reservations for paid AI providers (extraction, marketing
 * regeneration, transcription). The reservation is taken atomically in the
 * database BEFORE the provider is called; every attempt counts, so failures,
 * races and lost tracking writes can never give quota-free provider calls.
 */
export type ProviderKind = "extract" | "marketing" | "transcribe";

type RpcResult = { data: unknown; error: { message?: string } | null };

// Exact RPC overloads remain compatible with Supabase's generated function
// names and argument types; accepting an arbitrary string is too broad.
type Rpc = {
  rpc(fn: "reserve_provider_call", args: { _user_id: string; _kind: string; _bytes: number }): PromiseLike<RpcResult>;
  rpc(
    fn: "settle_provider_call",
    args: { _user_id: string; _reservation_id: string; _succeeded: boolean },
  ): PromiseLike<RpcResult>;
};

const LIMIT_CODE: Record<ProviderKind, string> = {
  extract: "EXTRACT_LIMIT_REACHED",
  marketing: "REGEN_LIMIT_REACHED",
  transcribe: "TRANSCRIPTION_DAILY_LIMIT",
};
const BUSY_CODE: Record<ProviderKind, string> = {
  extract: "RATE_LIMIT",
  marketing: "RATE_LIMIT",
  transcribe: "TRANSCRIPTION_RATE_LIMIT",
};
const UNAVAILABLE_CODE: Record<ProviderKind, string> = {
  extract: "AI_UNAVAILABLE",
  marketing: "AI_UNAVAILABLE",
  transcribe: "TRANSCRIPTION_FAILED",
};

/** Throws a friendly code (no provider call may follow) when the reservation fails. */
export async function reserveProviderCall(db: Rpc, userId: string, kind: ProviderKind, bytes = 0): Promise<string> {
  let result: RpcResult;
  try {
    result = await db.rpc("reserve_provider_call", { _user_id: userId, _kind: kind, _bytes: bytes });
  } catch {
    console.error("provider reservation failed", { kind });
    throw new Error(UNAVAILABLE_CODE[kind]);
  }
  const msg = String(result.error?.message ?? "");
  if (msg.includes("PROVIDER_LIMIT_REACHED") || msg.includes("PROVIDER_BYTES_EXCEEDED"))
    throw new Error(LIMIT_CODE[kind]);
  if (msg.includes("PROVIDER_IN_FLIGHT")) throw new Error(BUSY_CODE[kind]);
  if (result.error || typeof result.data !== "string" || !result.data) {
    console.error("provider reservation failed", { kind });
    throw new Error(UNAVAILABLE_CODE[kind]);
  }
  return result.data;
}

/** Best-effort settle. An unsettled row stays counted and expires from in-flight. */
export async function settleProviderCall(
  db: Rpc,
  userId: string,
  reservationId: string,
  succeeded: boolean,
): Promise<void> {
  try {
    const { error } = await db.rpc("settle_provider_call", {
      _user_id: userId,
      _reservation_id: reservationId,
      _succeeded: succeeded,
    });
    if (error) console.error("provider settle failed (attempt remains counted)");
  } catch {
    console.error("provider settle failed (attempt remains counted)");
  }
}
