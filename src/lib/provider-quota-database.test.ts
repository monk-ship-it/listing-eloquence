import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";

const user = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';`);
  for (const file of ["0000_transcription_usage.sql", "0002_generation_errors_and_regen_usage.sql", "0005_provider_call_reservations.sql", "0006_provider_call_limits_hardening.sql"])
    await db.exec(readFileSync(new URL(`../../drizzle/migrations/${file}`, import.meta.url), "utf8"));
});
beforeEach(async () => { await db.exec("TRUNCATE provider_call_reservations, regen_usage, transcription_usage"); });
afterAll(async () => { await db.close(); });
async function reserve(kind: string, bytes = 0, userId = user) {
  return (await db.query<{ id: string }>("SELECT reserve_provider_call($1,$2,$3) AS id", [userId, kind, bytes])).rows[0].id;
}
async function settle(id: string, succeeded = true, userId = user) {
  return (await db.query<{ settled: boolean }>("SELECT settle_provider_call($1,$2,$3) AS settled", [userId, id, succeeded])).rows[0].settled;
}

describe("actual provider quota PostgreSQL functions (isolated synthetic database)", () => {
  it("allows exactly one contender for the final daily allowance", async () => {
    await db.query("INSERT INTO regen_usage(user_id,kind) SELECT $1,'extract' FROM generate_series(1,39)", [user]);
    const results = await Promise.allSettled([reserve("extract"), reserve("extract")]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    expect((await db.query("SELECT * FROM provider_call_reservations")).rows).toHaveLength(1);
  });

  it("does not refund failed or expired attempts and includes historical marketing usage", async () => {
    await db.query("INSERT INTO regen_usage(user_id,kind) SELECT $1,'marketing' FROM generate_series(1,29)", [user]);
    const id = await reserve("marketing");
    expect(await settle(id, false)).toBe(true);
    await expect(reserve("marketing")).rejects.toThrow("PROVIDER_LIMIT_REACHED");
    await db.exec("UPDATE provider_call_reservations SET status='reserved', reserved_until=now()-interval '1 second'");
    await expect(reserve("marketing")).rejects.toThrow("PROVIDER_LIMIT_REACHED");
  });

  it("bounds in-flight calls across the UTC day boundary and recovers expired slots", async () => {
    await reserve("extract"); await reserve("extract");
    await db.exec("UPDATE provider_call_reservations SET created_at=(date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')-interval '1 second'");
    await expect(reserve("extract")).rejects.toThrow("PROVIDER_IN_FLIGHT");
    await db.exec("UPDATE provider_call_reservations SET reserved_until=now()-interval '1 second'");
    expect(await reserve("extract")).toBeTypeOf("string");
  });

  it("atomically enforces the combined transcription byte budget", async () => {
    await db.query("INSERT INTO transcription_usage(user_id,bytes) VALUES($1,31457280)", [user]);
    const results = await Promise.allSettled([reserve("transcribe", 6 * 1024 * 1024), reserve("transcribe", 6 * 1024 * 1024)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
  });

  it("enforces the rolling call cap and releases usage after its window", async () => {
    await db.query("INSERT INTO transcription_usage(user_id,bytes) SELECT $1,1 FROM generate_series(1,200)", [user]);
    await expect(reserve("transcribe", 1)).rejects.toThrow("PROVIDER_LIMIT_REACHED");
    await db.exec("UPDATE transcription_usage SET created_at=now()-interval '25 hours'");
    const ids = await Promise.all([reserve("transcribe", 1), reserve("transcribe", 1), reserve("transcribe", 1)]);
    await expect(reserve("transcribe", 1)).rejects.toThrow("PROVIDER_IN_FLIGHT");
    expect(await settle(ids[0])).toBe(true);
    expect(await reserve("transcribe", 1)).toBeTypeOf("string");
  });

  it("settles idempotently, isolates users and rejects invalid budgets", async () => {
    const id = await reserve("marketing");
    expect(await settle(id, true, other)).toBe(false);
    expect(await settle(id)).toBe(true);
    expect(await settle(id, false)).toBe(false);
    await expect(reserve("unknown")).rejects.toThrow("INVALID_KIND");
    await expect(reserve("transcribe", -1)).rejects.toThrow("INVALID_BYTES");
    await expect(reserve("transcribe", 10485761)).rejects.toThrow("PROVIDER_BYTES_EXCEEDED");
  });

  it("denies customer/anonymous quota writes and permits the service role", async () => {
    for (const role of ["authenticated", "anon"]) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await expect(reserve("extract")).rejects.toThrow("permission denied");
        await expect(settle(user)).rejects.toThrow("permission denied");
        await expect(db.query("SELECT * FROM provider_call_reservations")).rejects.toThrow("permission denied");
      } finally { await db.exec("RESET ROLE"); }
    }
    await db.exec("SET ROLE service_role");
    try { const id = await reserve("extract"); expect(await settle(id)).toBe(true); }
    finally { await db.exec("RESET ROLE"); }
    const row = (await db.query<{ enabled: boolean }>("SELECT relrowsecurity AS enabled FROM pg_class WHERE oid='provider_call_reservations'::regclass")).rows[0];
    expect(row.enabled).toBe(true);
  });
});
