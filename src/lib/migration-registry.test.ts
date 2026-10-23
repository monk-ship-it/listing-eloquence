import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

describe("release migration registry", () => {
  it("registers every SQL migration in order so deployments cannot skip required RPC changes", () => {
    const directory = resolve(process.cwd(), "drizzle/migrations");
    const journal = JSON.parse(readFileSync(resolve(directory, "meta/_journal.json"), "utf8"));
    const migrations = readdirSync(directory).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
    expect(journal.entries.map((entry: { tag: string }) => `${entry.tag}.sql`)).toEqual(migrations);
    expect(journal.entries.map((entry: { idx: number }) => entry.idx)).toEqual(migrations.map((_, index) => index));
  });
});
