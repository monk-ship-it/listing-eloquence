/**
 * Rewrites src/lib/prompts/__fixtures__ from today's prompt code. Only run
 * this when a prompt change is intentional — the golden test exists to make
 * every change to what Claude receives a deliberate, reviewed step.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ListingInput } from "../src/lib/listing-types";
import {
  CORE_SCHEMA,
  MARKETING_SCHEMA,
  buildCoreRequest,
  buildExtractSchema,
  buildMarketingRequest,
} from "../src/lib/prompts/calls";
import { EXTRACT_SYSTEM } from "../src/lib/prompts/templates";

const FX = join(import.meta.dir, "../src/lib/prompts/__fixtures__");
const inputs = JSON.parse(readFileSync(join(FX, "inputs.json"), "utf8")) as Record<
  string,
  ListingInput
>;
const w = (f: string, s: string) => writeFileSync(join(FX, f), s);
for (const [name, input] of Object.entries(inputs)) {
  w(`${name}.system.txt`, buildCoreRequest(input).system);
  w(`${name}.core.txt`, buildCoreRequest(input).user);
  w(`${name}.core-reminder.txt`, buildCoreRequest(input, { reminder: true }).user);
  w(`${name}.marketing.txt`, buildMarketingRequest(input).user);
}
w("core.schema.json", JSON.stringify(CORE_SCHEMA, null, 2) + "\n");
w("marketing.schema.json", JSON.stringify(MARKETING_SCHEMA, null, 2) + "\n");
w("extract.schema.json", JSON.stringify(buildExtractSchema(), null, 2) + "\n");
w("extract.system.txt", EXTRACT_SYSTEM);
console.log(`Golden fixtures rewritten for ${Object.keys(inputs).length} inputs.`);
