import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CaseResult } from "./types";

export interface ReportHeader {
  label: string;
  model: string;
  promptVersion: string;
  gitSha: string;
  cases: number;
  runs: number;
  llmGrade: boolean;
  startedAt: Date;
}

const s = (ms?: number) => (ms === undefined ? "–" : (ms / 1000).toFixed(1));
const pad = (n: number) => String(n).padStart(2, "0");
const md = (t: string) => t.replace(/\|/g, "\\|").replace(/\n/g, " ");

export function reportDir(root: string, h: ReportHeader): string {
  const d = h.startedAt;
  const stamp = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
  return join(root, "docs/evals", `${stamp}-${h.label}`);
}

export function writeReport(dir: string, h: ReportHeader, results: CaseResult[]): string {
  mkdirSync(dir, { recursive: true });
  for (const r of results)
    writeFileSync(join(dir, `${r.id}.run${r.run}.json`), JSON.stringify(r, null, 2) + "\n");

  let inTok = 0;
  let outTok = 0;
  for (const r of results)
    for (const t of r.timings) {
      inTok += t.inputTokens;
      outTok += t.outputTokens;
    }

  const lines: string[] = [];
  lines.push(`# Prompt eval — ${h.label}`, "");
  lines.push(`- Model: \`${h.model}\``);
  lines.push(`- PROMPT_VERSION: \`${h.promptVersion}\``);
  lines.push(`- Git sha: \`${h.gitSha}\``);
  lines.push(`- Cases × runs: ${h.cases} × ${h.runs}`);
  lines.push(`- LLM grader: ${h.llmGrade ? "on" : "off"}`);
  lines.push(
    `- Tokens: ${inTok.toLocaleString("en-GB")} in / ${outTok.toLocaleString("en-GB")} out`,
  );
  lines.push(`- Started: ${h.startedAt.toISOString()}`);
  const passed = results.filter((r) => r.pass).length;
  lines.push(`- Result: **${passed}/${results.length} passed**`, "");

  lines.push(
    "| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |",
  );
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const r of results) {
    const fails = r.findings.filter((f) => f.severity === "fail").length;
    const warns = r.findings.filter((f) => f.severity === "warn").length;
    const llm = !r.llm
      ? "–"
      : "error" in r.llm
        ? "error"
        : `${r.llm.verdict} ${r.llm.average.toFixed(2)}`;
    const id = h.runs > 1 ? `${r.id} #${r.run}` : r.id;
    lines.push(
      `| ${id} | ${r.pass ? "PASS" : "FAIL"} | ${fails} | ${warns} | ${s(r.coreMs)} | ${s(r.marketingMs)} | ${s(r.extractMs)} | ${r.retries} | ${llm} |`,
    );
  }
  lines.push("");

  // Most common failures, by grader + message shape.
  const counts = new Map<string, Set<string>>();
  for (const r of results)
    for (const f of r.findings.filter((x) => x.severity === "fail")) {
      const key = `${f.grader}: ${f.message.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, "N")}`;
      if (!counts.has(key)) counts.set(key, new Set());
      counts.get(key)!.add(r.id);
    }
  const top = [...counts.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 10);
  if (top.length) {
    lines.push(
      "## Most common failures",
      "",
      "| # cases | Failure | Cases |",
      "| ---: | --- | --- |",
    );
    for (const [k, ids] of top) lines.push(`| ${ids.size} | ${md(k)} | ${[...ids].join(", ")} |`);
    lines.push("");
  }

  lines.push("## Details", "");
  for (const r of results) {
    const fails = r.findings.filter((f) => f.severity === "fail");
    const warns = r.findings.filter((f) => f.severity === "warn");
    lines.push(
      `### ${r.id}${h.runs > 1 ? ` (run ${r.run})` : ""} — ${r.pass ? "PASS" : "FAIL"}`,
      "",
    );
    if (r.error) lines.push(`- **Error:** ${r.error}`);
    if (r.extraction)
      lines.push(
        `- Precision ${r.extraction.precision.toFixed(2)}, recall ${r.extraction.recall.toFixed(2)}`,
      );
    for (const f of fails)
      lines.push(
        `- FAIL \`${f.grader}\` ${md(f.message)}${f.text ? ` — \`${md(f.text).slice(0, 220)}\`` : ""}`,
      );
    if (warns.length)
      lines.push(
        `- ${warns.length} warning(s): ${warns.map((w) => `\`${w.grader}\` ${md(w.message)}`).join("; ")}`,
      );
    if (r.llm && !("error" in r.llm)) {
      lines.push(
        `- LLM: ${r.llm.verdict} (avg ${r.llm.average.toFixed(2)}; ${Object.entries(r.llm.scores)
          .map(([k, v]) => `${k}:${v}`)
          .join(" ")})`,
      );
      for (const fx of r.llm.fixes) lines.push(`  - ${md(fx)}`);
    } else if (r.llm) lines.push(`- LLM grader error: ${r.llm.error}`);
    lines.push("");
  }
  const text = lines.join("\n");
  writeFileSync(join(dir, "report.md"), text);
  return text;
}
