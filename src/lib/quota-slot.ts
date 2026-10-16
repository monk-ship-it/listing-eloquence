/**
 * Listing-credit reservation lifecycle, kept free of Supabase imports so it can
 * be unit-tested.
 *
 * DB semantics (reserve/finalize/release_generation_slot):
 * - finalize flips a 'reserved' row to 'completed'; release deletes only
 *   'reserved' rows, so releasing after a commit is a no-op (no double refund).
 * - reserve deletes 'reserved' rows whose reserved_until has passed, so a
 *   reservation we can't settle expires on its own and is never charged.
 *
 * A finalize error does NOT prove nothing committed (the response can be lost
 * after the UPDATE). We therefore re-read the row before deciding.
 */
export type SlotRpc = (
  fn: "finalize_generation_slot" | "release_generation_slot",
  args: Record<string, string>,
) => Promise<{ data: unknown; error: unknown }>;

/** 'completed' | 'reserved' | 'missing' (row gone), or null if the read failed. */
export type SlotStatus = "completed" | "reserved" | "missing" | null;
export type ReadSlot = (reservationId: string) => Promise<SlotStatus>;

/** finalized = credit used; released = no credit used; unresolved = unknown, row left to expire. */
export type SlotOutcome = "finalized" | "released" | "unresolved";

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

async function safeRead(read: ReadSlot, id: string): Promise<SlotStatus> {
  try {
    return await read(id);
  } catch (err) {
    console.error("generation_usage read failed", err);
    return null;
  }
}

export async function finalizeOrRelease(
  rpc: SlotRpc,
  read: ReadSlot,
  userId: string,
  reservationId: string,
  generationId: string,
): Promise<SlotOutcome> {
  try {
    const { data, error } = await rpc("finalize_generation_slot", {
      _user_id: userId,
      reservation_id: reservationId,
      generation_id: generationId,
    });
    if (!error && data === true) return "finalized";
    if (error) console.error("finalize_generation_slot failed", error);
  } catch (err) {
    console.error("finalize_generation_slot failed", err);
  }

  // Reconcile: the commit may have happened even though we saw a failure.
  const first = await safeRead(read, reservationId);
  if (first === "completed") return "finalized";
  if (first === "missing") return "released";
  if (first === null) return "unresolved";

  await releaseSlot(rpc, userId, reservationId);
  const after = await safeRead(read, reservationId);
  if (after === "missing") return "released";
  if (after === "completed") return "finalized";
  return "unresolved";
}
