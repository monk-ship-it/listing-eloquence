/**
 * Listing-credit reservation lifecycle, kept free of Supabase imports so it can
 * be unit-tested. `release_generation_slot` only deletes rows still in
 * 'reserved' state, so releasing after a successful finalize is a no-op — a
 * completed credit can never be refunded twice or charged twice.
 */
export type SlotRpc = (
  fn: "finalize_generation_slot" | "release_generation_slot",
  args: Record<string, string>,
) => Promise<{ data: unknown; error: unknown }>;

export async function releaseSlot(rpc: SlotRpc, userId: string, reservationId: string | null) {
  if (!reservationId) return false;
  try {
    const { data, error } = await rpc("release_generation_slot", {
      _user_id: userId,
      reservation_id: reservationId,
    });
    if (error) {
      console.error("release_generation_slot failed", error);
      return false;
    }
    return data === true;
  } catch (err) {
    console.error("release_generation_slot failed", err);
    return false;
  }
}

/**
 * Finalize a reserved slot. On any failure (RPC error, false, or thrown) the
 * reservation is released before returning false, so the slot never leaks.
 */
export async function finalizeOrRelease(
  rpc: SlotRpc,
  userId: string,
  reservationId: string,
  generationId: string,
): Promise<boolean> {
  let ok = false;
  try {
    const { data, error } = await rpc("finalize_generation_slot", {
      _user_id: userId,
      reservation_id: reservationId,
      generation_id: generationId,
    });
    ok = !error && data === true;
    if (error) console.error("finalize_generation_slot failed", error);
  } catch (err) {
    console.error("finalize_generation_slot failed", err);
  }
  if (!ok) await releaseSlot(rpc, userId, reservationId);
  return ok;
}
