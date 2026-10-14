import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ListingInput } from "../listing-types";
import { MASTER_LISTING_SYSTEM_PROMPT } from "../master-listing-prompt";
import { BANNED_PHRASES as CHECKER_BANNED } from "../fact-check";
import { BANNED_ENTRIES } from "./banned";
import {
  CORE_SCHEMA,
  MARKETING_SCHEMA,
  buildCoreRequest,
  buildExtractRequest,
  buildExtractSchema,
  buildMarketingRequest,
} from "./calls";
import {
  CORE_USER_TEMPLATE,
  EXTRACT_SYSTEM,
  MARKETING_USER_TEMPLATE,
  SYSTEM_TEMPLATE,
  fillTemplate,
  placeholdersOf,
} from "./templates";
import { promptVars } from "./render";

const FX = join(__dirname, "__fixtures__");
const read = (f: string) => readFileSync(join(FX, f), "utf8");
const inputs = JSON.parse(read("inputs.json")) as Record<string, ListingInput>;

describe("golden prompts (v2 — update only via bun run prompts:golden)", () => {
  for (const [name, input] of Object.entries(inputs)) {
    it(`${name}: system, core, core+reminder, marketing`, () => {
      expect(buildCoreRequest(input).system).toBe(read(`${name}.system.txt`));
      expect(buildMarketingRequest(input).system).toBe(read(`${name}.system.txt`));
      expect(buildCoreRequest(input).user).toBe(read(`${name}.core.txt`));
      expect(buildCoreRequest(input, { reminder: true }).user).toBe(
        read(`${name}.core-reminder.txt`),
      );
      expect(buildMarketingRequest(input).user).toBe(read(`${name}.marketing.txt`));
    });
  }
  it("tool schemas", () => {
    expect(JSON.stringify(CORE_SCHEMA, null, 2) + "\n").toBe(read("core.schema.json"));
    expect(JSON.stringify(MARKETING_SCHEMA, null, 2) + "\n").toBe(read("marketing.schema.json"));
    expect(JSON.stringify(buildExtractSchema(), null, 2) + "\n").toBe(read("extract.schema.json"));
  });
  it("extraction system prompt + user turn", () => {
    expect(EXTRACT_SYSTEM).toBe(read("extract.system.txt"));
    expect(buildExtractRequest("abc").user).toBe("AGENT VOICE NOTES:\nabc");
  });
});

describe("templates", () => {
  it("promptVars keys exactly match the template placeholders", () => {
    const used = new Set(
      [SYSTEM_TEMPLATE, CORE_USER_TEMPLATE, MARKETING_USER_TEMPLATE].flatMap(placeholdersOf),
    );
    expect(Object.keys(promptVars(inputs.heritage)).sort()).toEqual([...used].sort());
  });
  it("fillTemplate is strict", () => {
    expect(() => fillTemplate("a {{X}}", {})).toThrow(/missing/);
    expect(() => fillTemplate("a {{X}}", { X: "1", Y: "2" })).toThrow(/unused/);
    expect(fillTemplate("a {{X}}", { X: "{{Y}}" })).toBe("a {{Y}}");
  });
  it("banned list in the master prompt equals the fact-check list", () => {
    const line = MASTER_LISTING_SYSTEM_PROMPT.split("\n").find((l) => l.startsWith("- BANNED:"))!;
    const inPrompt = [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
    const variants = BANNED_ENTRIES.flatMap((e) => e.variants ?? []).map((v) => v.toLowerCase());
    expect([...inPrompt, ...variants].sort()).toEqual([...CHECKER_BANNED].sort());
    expect(CHECKER_BANNED).toContain("beautifully presented");
  });
});
