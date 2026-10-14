/**
 * Writes docs/workbench/ (and src/lib/prompts/version.gen.ts) from the app's
 * prompt code. `--check` writes nothing, lists stale files and exits 1.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { renderWorkbenchFiles } from "../src/lib/prompts/workbench-export";
import { loadExportCases } from "./prompt-evals/load-cases";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");
const files = renderWorkbenchFiles(loadExportCases(ROOT));
const stale: string[] = [];
for (const [rel, content] of Object.entries(files)) {
  const p = join(ROOT, rel);
  const current = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (current === content) continue;
  stale.push(rel);
  if (!check) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}
if (check) {
  if (stale.length) {
    console.error(`Stale Workbench files (run bun run prompts:export):\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Workbench files up to date (${Object.keys(files).length} files).`);
} else {
  console.log(`Wrote ${stale.length} file(s); ${Object.keys(files).length} total.`);
}
