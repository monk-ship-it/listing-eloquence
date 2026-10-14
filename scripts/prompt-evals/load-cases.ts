import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvalCase } from "./types";

export function loadCases(root: string): { pack: EvalCase[]; extract: EvalCase[] } {
  const dir = join(root, "scripts/prompt-evals/cases");
  const read = (f: string) => JSON.parse(readFileSync(join(dir, f), "utf8")) as EvalCase[];
  return { pack: read("pack.json"), extract: read("extract.json") };
}

export function loadExportCases(root: string): EvalCase[] {
  const { pack, extract } = loadCases(root);
  return [...pack, ...extract];
}
