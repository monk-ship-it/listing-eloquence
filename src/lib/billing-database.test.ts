import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import {
  persistSubscriptionMutation,
  persistSubscriptionSnapshot,
  readBillingRow,
  reconcileSubscriberRow,
} from "./billing-sync.server";
import { processBillingEvent } from "./billing-webhook.server";
import { PLAN_PRICING } from "./config";

const user = "00000000-0000-4000-8000-000000000001";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE subscribers(user_id uuid PRIMARY KEY, email text, plan text DEFAULT 'starter', status text DEFAULT 'none', stripe_subscription_id text, stripe_customer_id text, stripe_price_id text, trial_end timestamptz, current_period_end timestamptz, cancel_at_period_end boolean DEFAULT false, updated_at timestamptz);
    INSERT INTO subscribers(user_id,email) VALUES('${user}','synthetic@example.invalid');`);
  for (const file of [
    "0003_billing_event_and_checkout_guards.sql",
    "0004_checkout_attempt_trial_parameters.sql",
    "0007_billing_snapshot_compare_and_swap.sql",
  ])
    await db.exec(
      readFileSync(new URL(`../../drizzle/migrations/${file}`, import.meta.url), "utf8"),
    );
});
afterAll(async () => {
  await db.close();
});
async function claim(plan = "starter", prior = false) {
  const result = await db.query<{
    value: { attemptId: string; trialDays: number; expiresAt: number };
  }>("SELECT claim_billing_checkout($1,$2,$3,$4) AS value", [
    user,
    plan,
    "https://copybymonk.com",
    prior,
  ]);
  return result.rows[0].value;
}
async function apply(
  id: string,
  created: number,
  event: number,
  checkout: boolean,
  status = "active",
) {
  const fields = {
    status,
    plan: "starter",
    cancel_at_period_end: false,
    email: "domenico@copybymonk.com",
  };
  return (
    await db.query<{ applied: boolean }>(
      "SELECT apply_billing_event($1,$2,$3,$4,$5,$6) AS applied",
      [user, id, created, event, JSON.stringify(fields), checkout],
    )
  ).rows[0].applied;
}
describe("actual billing PostgreSQL guards (isolated synthetic database)", () => {
  it("durably reserves one 14-day trial and identical parameters after response loss", async () => {
    const first = await claim();
    const retry = await claim();
    expect(first.trialDays).toBe(14);
    expect(retry).toEqual(first);
    await expect(claim("pro")).rejects.toThrow("CHECKOUT_PENDING");
  });
  it("never grants a second trial after an expired attempt", async () => {
    await db.exec(`UPDATE billing_checkout_state SET expires_at=now()-interval '1 second'`);
    expect((await claim()).trialDays).toBe(0);
  });
  it("rejects old events and old-subscription checkout without changing verified email", async () => {
    expect(await apply("sub_new", 200, 300, true)).toBe(true);
    expect(await apply("sub_new", 200, 299, false, "unpaid")).toBe(false);
    expect(await apply("sub_old", 100, 400, true, "canceled")).toBe(false);
    const row = (
      await db.query<{ status: string; email: string; stripe_subscription_id: string }>(
        "SELECT * FROM subscribers",
      )
    ).rows[0];
    expect(row.status).toBe("active");
    expect(row.stripe_subscription_id).toBe("sub_new");
    expect(row.email).toBe("synthetic@example.invalid");
  });
  it("only attaches a newer checkout after the previous subscription ended", async () => {
    expect(await apply("sub_new", 200, 500, false, "canceled")).toBe(true);
    expect(await apply("sub_newer", 600, 700, false)).toBe(false);
    expect(await apply("sub_newer", 600, 700, true)).toBe(true);
    expect(await apply("sub_new", 200, 800, true)).toBe(false);
  });
  it("cannot execute privileged checkout or billing writes as an authenticated customer", async () => {
    await db.exec("SET ROLE authenticated");
    try {
      await expect(claim()).rejects.toThrow("permission denied");
      await expect(apply("sub_attack", 900, 900, true)).rejects.toThrow("permission denied");
    } finally {
      await db.exec("RESET ROLE");
    }
  });
});

// Exercise the application write path against actual PostgreSQL locking/CAS,
// with controlled delayed Stripe responses. No live provider calls are made.
function postgresClient() {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (column: string, value: string) => ({
          maybeSingle: async () => {
            if (!["user_id", "stripe_subscription_id"].includes(column))
              throw new Error("Unexpected test filter");
            const result = await db.query<{ value: Record<string, unknown> }>(
              `SELECT to_jsonb(s) AS value FROM subscribers s WHERE ${column}=$1`,
              [value],
            );
            return { data: result.rows[0]?.value ?? null, error: null };
          },
        }),
      }),
    }),
    rpc: vi.fn(async (_name: string, args: Record<string, unknown>) => {
      const result = await db.query<{ applied: boolean }>(
        "SELECT apply_billing_event($1,$2,$3,$4,$5,$6,$7,$8) AS applied",
        [
          args._user_id,
          args._subscription_id,
          args._subscription_created,
          args._event_created,
          JSON.stringify(args._fields),
          args._checkout,
          args._expected_updated_at,
          args._check_version,
        ],
      );
      return { data: result.rows[0].applied, error: null };
    }),
  };
}

describe("delayed billing responses cannot overwrite newer state", () => {
  it("keeps the version monotonic even when a caller supplies an older timestamp", async () => {
    const monotonicUser = "00000000-0000-4000-8000-000000000006";
    await db.query(
      "INSERT INTO subscribers(user_id,updated_at) VALUES($1,'2099-01-01T00:00:00Z')",
      [monotonicUser],
    );
    await db.exec("BEGIN");
    try {
      await db.query("UPDATE subscribers SET updated_at='2000-01-01T00:00:00Z' WHERE user_id=$1", [
        monotonicUser,
      ]);
      const first = (
        await db.query<{ value: string }>(
          "SELECT updated_at::text AS value FROM subscribers WHERE user_id=$1",
          [monotonicUser],
        )
      ).rows[0].value;
      await db.query("UPDATE subscribers SET updated_at='2000-01-01T00:00:00Z' WHERE user_id=$1", [
        monotonicUser,
      ]);
      const check = (
        await db.query<{ increased: boolean }>(
          "SELECT updated_at>$2::timestamptz AS increased FROM subscribers WHERE user_id=$1",
          [monotonicUser, first],
        )
      ).rows[0];
      expect(check.increased).toBe(true);
      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  });
  it.each(["reconciliation", "cancel", "resume", "webhook"] as const)(
    "re-reads after a stale %s response loses CAS",
    async (kind) => {
      const suffix = { reconciliation: "2", cancel: "3", resume: "4", webhook: "5" }[kind];
      const raceUser = `00000000-0000-4000-8000-00000000000${suffix}`;
      const subscriptionId = `sub_race_${kind}`;
      await db.query(
        "INSERT INTO subscribers(user_id,status,plan,stripe_subscription_id,stripe_price_id,updated_at) VALUES($1,'active','starter',$2,$3,'2026-10-22T10:00:00Z')",
        [raceUser, subscriptionId, PLAN_PRICING.starter.priceId],
      );
      const client = postgresClient();
      const before = (await readBillingRow(client, raceUser))!;
      const latestCancel = kind !== "cancel";
      const subscription = (cancel: boolean) => ({
        id: subscriptionId,
        created: 10,
        customer: "cus_synthetic",
        status: "active",
        cancel_at_period_end: cancel,
        items: {
          data: [
            {
              price: { id: PLAN_PRICING.starter.priceId, currency: "gbp" },
              current_period_end: 2_000_000_000,
            },
          ],
        },
      });
      let resolveOld!: (value: ReturnType<typeof subscription>) => void;
      let started!: () => void;
      const didStart = new Promise<void>((resolve) => {
        started = resolve;
      });
      const oldResponse = new Promise<ReturnType<typeof subscription>>((resolve) => {
        resolveOld = resolve;
      });
      const getSubscription = vi
        .fn()
        .mockImplementationOnce(() => {
          started();
          return oldResponse;
        })
        .mockResolvedValue(subscription(latestCancel));
      const deps = { db: client, getSubscription };
      const pending =
        kind === "reconciliation"
          ? reconcileSubscriberRow(before, deps)
          : kind === "webhook"
            ? processBillingEvent(
                {
                  type: "customer.subscription.updated",
                  created: 100,
                  data: { object: { id: subscriptionId } },
                },
                deps,
              )
            : null;
      if (pending) await didStart;
      // A newer user action/webhook wins while the first provider request is slow.
      const winner = await persistSubscriptionSnapshot(client, before, subscription(latestCancel));
      expect(winner.applied).toBe(true);
      expect(winner.row.updated_at).not.toBe(before.updated_at);
      if (pending) {
        resolveOld(subscription(!latestCancel));
        await pending;
        expect(getSubscription).toHaveBeenCalledTimes(2);
      } else {
        // A POST has already succeeded at Stripe, but its response arrived late.
        getSubscription.mockReset().mockResolvedValue(subscription(latestCancel));
        const result = await persistSubscriptionMutation(before, subscription(!latestCancel), deps);
        expect(result.cancel_at_period_end).toBe(latestCancel);
        expect(getSubscription).toHaveBeenCalledTimes(1);
      }
      const final = (await readBillingRow(client, raceUser))!;
      expect(final.cancel_at_period_end).toBe(latestCancel);
      expect(
        client.rpc.mock.calls.some((call) => call[1]._expected_updated_at === before.updated_at),
      ).toBe(true);
      expect(final.stripe_price_id).toBe(PLAN_PRICING.starter.priceId);
    },
  );
});
