import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderWorkbenchFiles } from "./workbench-export";
import { loadExportCases } from "../../../scripts/prompt-evals/load-cases";

const ROOT = join(__dirname, "../../..");

describe("docs/workbench is up to date", () => {
  it("every generated file matches (run bun run prompts:export)", () => {
    const files = renderWorkbenchFiles(loadExportCases(ROOT));
    const stale = Object.entries(files)
      .filter(([rel, c]) => {
        const p = join(ROOT, rel);
        return !existsSync(p) || readFileSync(p, "utf8") !== c;
      })
      .map(([rel]) => rel);
    expect(stale, "Stale Workbench files — run bun run prompts:export").toEqual([]);
  });
});
