import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const user = "00000000-0000-4000-8000-000000000001";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE subscribers(user_id uuid PRIMARY KEY, email text, plan text DEFAULT 'starter', status text DEFAULT 'none', stripe_subscription_id text, stripe_customer_id text, stripe_price_id text, trial_end timestamptz, current_period_end timestamptz, cancel_at_period_end boolean DEFAULT false, updated_at timestamptz);
    INSERT INTO subscribers(user_id,email) VALUES('${user}','synthetic@example.invalid');`);
  for (const file of ["0003_billing_event_and_checkout_guards.sql", "0004_checkout_attempt_trial_parameters.sql"])
    await db.exec(readFileSync(new URL(`../../drizzle/migrations/${file}`, import.meta.url), "utf8"));
});
afterAll(async () => { await db.close(); });
async function claim(plan = "starter", prior = false) {
  const result = await db.query<{ value: { attemptId: string; trialDays: number; expiresAt: number } }>("SELECT claim_billing_checkout($1,$2,$3,$4) AS value",[user,plan,"https://copybymonk.com",prior]);
  return result.rows[0].value;
}
async function apply(id: string, created: number, event: number, checkout: boolean, status = "active") {
  const fields = { status, plan: "starter", cancel_at_period_end: false, email: "domenico@copybymonk.com" };
  return (await db.query<{ applied: boolean }>("SELECT apply_billing_event($1,$2,$3,$4,$5,$6) AS applied",[user,id,created,event,JSON.stringify(fields),checkout])).rows[0].applied;
}
describe("actual billing PostgreSQL guards (isolated synthetic database)", () => {
  it("durably reserves one 14-day trial and identical parameters after response loss", async () => {
    const first = await claim(); const retry = await claim();
    expect(first.trialDays).toBe(14); expect(retry).toEqual(first);
    await expect(claim("pro")).rejects.toThrow("CHECKOUT_PENDING");
  });
  it("never grants a second trial after an expired attempt", async () => {
    await db.exec(`UPDATE billing_checkout_state SET expires_at=now()-interval '1 second'`);
    expect((await claim()).trialDays).toBe(0);
  });
  it("rejects old events and old-subscription checkout without changing verified email", async () => {
    expect(await apply("sub_new",200,300,true)).toBe(true);
    expect(await apply("sub_new",200,299,false,"unpaid")).toBe(false);
    expect(await apply("sub_old",100,400,true,"canceled")).toBe(false);
    const row = (await db.query<{ status: string; email: string; stripe_subscription_id: string }>("SELECT * FROM subscribers")).rows[0];
    expect(row.status).toBe("active"); expect(row.stripe_subscription_id).toBe("sub_new"); expect(row.email).toBe("synthetic@example.invalid");
  });
  it("only attaches a newer checkout after the previous subscription ended", async () => {
    expect(await apply("sub_new",200,500,false,"canceled")).toBe(true);
    expect(await apply("sub_newer",600,700,false)).toBe(false);
    expect(await apply("sub_newer",600,700,true)).toBe(true);
    expect(await apply("sub_new",200,800,true)).toBe(false);
  });
  it("cannot execute privileged checkout or billing writes as an authenticated customer", async () => {
    await db.exec("SET ROLE authenticated");
    try {
      await expect(claim()).rejects.toThrow("permission denied");
      await expect(apply("sub_attack",900,900,true)).rejects.toThrow("permission denied");
    } finally { await db.exec("RESET ROLE"); }
  });
});