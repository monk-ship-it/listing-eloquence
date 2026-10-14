/**
 * Prompt eval harness. Runs the app's real generation code (generation.server.ts)
 * over scripts/prompt-evals/cases/*.json and writes docs/evals/<stamp>-<label>/.
 *
 *   bun run evals -- [--label x] [--cases pack|extract|all] [--only id,id] [--runs 1]
 *                    [--model id] [--concurrency 2] [--llm-grade] [--out dir] [--dry]
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCore, runExtraction, runMarketing } from "../../src/lib/generation.server";
import { toApiBody } from "../../src/lib/ai-gateway.server";
import {
  buildCoreRequest,
  buildExtractRequest,
  buildMarketingRequest,
  DEFAULT_CLAUDE_MODEL,
} from "../../src/lib/prompts/calls";
import { PROMPT_VERSION } from "../../src/lib/prompts/version.gen";
import { caseInput } from "../../src/lib/prompts/workbench-export";
import { FIELD_DEFS } from "../../src/lib/listing-fields";
import type { ListingOutput } from "../../src/lib/listing-types";
import { gradeExtraction, gradePack, gradeRaw, packFromFinal, packFromRaw } from "./graders";
import { llmGrade } from "./llm-grader";
import { loadCases } from "./load-cases";
import { reportDir, writeReport, type ReportHeader } from "./report";
import type { CallTiming, CaseResult, EvalCase } from "./types";

const ROOT = join(import.meta.dir, "../..");
const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string, d?: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};

const label = opt("label", "run")!.replace(/[^a-z0-9-]+/gi, "-");
const which = opt("cases", "all")!;
const only = opt("only")
  ?.split(",")
  .map((s) => s.trim());
const runs = Math.max(1, Number(opt("runs", "1")));
const model = opt("model", process.env.EVAL_MODEL || DEFAULT_CLAUDE_MODEL)!;
const concurrency = Math.max(1, Number(opt("concurrency", "2")));
const doLlm = flag("llm-grade");
const dry = flag("dry");

const all = loadCases(ROOT);
let cases: EvalCase[] = [
  ...(which === "extract" ? [] : all.pack),
  ...(which === "pack" ? [] : all.extract),
];
if (only) cases = cases.filter((c) => only.includes(c.id));

// Validate every input key against FIELD_DEFS.
const known = new Set<string>([
  ...FIELD_DEFS.map((d) => d.key as string),
  "voice",
  "sellerApproved",
]);
for (const c of cases)
  for (const k of Object.keys(c.input ?? {}))
    if (!known.has(k)) throw new Error(`Case ${c.id}: unknown input key "${k}"`);

let gitSha = "unknown";
try {
  gitSha = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
} catch {
  /* not a git checkout */
}

const header: ReportHeader = {
  label,
  model,
  promptVersion: PROMPT_VERSION,
  gitSha,
  cases: cases.length,
  runs,
  llmGrade: doLlm,
  startedAt: new Date(),
};
const outDir = opt("out") ? join(ROOT, opt("out")!) : reportDir(ROOT, header);

if (dry) {
  mkdirSync(outDir, { recursive: true });
  for (const c of cases) {
    const body =
      c.call === "pack"
        ? {
            core: toApiBody(buildCoreRequest(caseInput(c)), model),
            marketing: toApiBody(buildMarketingRequest(caseInput(c)), model),
          }
        : { extract: toApiBody(buildExtractRequest((c.notes ?? "").trim()), model) };
    writeFileSync(join(outDir, `${c.id}.requests.json`), JSON.stringify(body, null, 2) + "\n");
  }
  console.log(`Dry run: wrote ${cases.length} request file(s) to ${outDir}`);
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Use --dry to render requests only.");
  process.exit(2);
}

async function runCase(c: EvalCase, run: number): Promise<CaseResult> {
  const timings: CallTiming[] = [];
  const onMeta = (m: {
    call: CallTiming["call"];
    attempt: number;
    ms: number;
    stopReason: string | null;
    usage: { input_tokens?: number; output_tokens?: number } | null;
  }) =>
    timings.push({
      call: m.call,
      attempt: m.attempt,
      ms: m.ms,
      stopReason: m.stopReason,
      inputTokens: m.usage?.input_tokens ?? 0,
      outputTokens: m.usage?.output_tokens ?? 0,
    });
  const raw: Record<string, unknown> = {};
  const onRaw = (call: string, r: unknown) => {
    raw[call] = r;
  };
  const sum = (call: string) => {
    const t = timings.filter((x) => x.call === call);
    return t.length ? t.reduce((a, b) => a + b.ms, 0) : undefined;
  };
  const retries = () => {
    const by = new Map<string, number>();
    for (const t of timings) by.set(t.call, Math.max(by.get(t.call) ?? 0, t.attempt));
    return [...by.values()].reduce((a, n) => a + n - 1, 0);
  };
  const base = { id: c.id, run, call: c.call, timings, raw };

  if (c.call === "extract") {
    const notes = (c.notes ?? "").trim();
    try {
      const res = await runExtraction(notes, { model, onMeta, onRaw });
      const g = gradeExtraction(c, raw.extract, res);
      return {
        ...base,
        pass: !g.findings.some((f) => f.severity === "fail"),
        findings: g.findings,
        extractMs: sum("extract"),
        retries: retries(),
        output: res,
        extraction: { precision: g.precision, recall: g.recall },
      };
    } catch (e) {
      return {
        ...base,
        pass: false,
        findings: [],
        retries: retries(),
        error: String((e as Error).message ?? e),
        extractMs: sum("extract"),
      };
    }
  }

  const input = caseInput(c);
  const [coreRes, mktRes] = await Promise.allSettled([
    runCore(input, { model, onMeta, onRaw }),
    runMarketing(input, { model, onMeta, onRaw }),
  ]);
  if (coreRes.status === "rejected") {
    return {
      ...base,
      pass: false,
      findings: [],
      retries: retries(),
      error: `core: ${(coreRes.reason as Error)?.message}`,
      coreMs: sum("core"),
      marketingMs: sum("marketing"),
    };
  }
  const final: ListingOutput =
    mktRes.status === "fulfilled"
      ? { ...coreRes.value, ...mktRes.value }
      : { ...coreRes.value, emailBlast: null, social: [], marketingStatus: "failed" };
  const finalPack = packFromFinal(final);
  const findings = [
    ...gradePack(finalPack, input, c),
    ...gradeRaw(packFromRaw(raw.core, raw.marketing), input),
  ];
  if (mktRes.status === "rejected")
    findings.push({
      grader: "marketing",
      severity: "fail",
      message: `marketing call failed: ${(mktRes.reason as Error)?.message}`,
    });
  let llm: CaseResult["llm"];
  if (doLlm) {
    try {
      llm = await llmGrade(finalPack, input, model);
    } catch (e) {
      llm = { error: String((e as Error).message ?? e) };
    }
  }
  return {
    ...base,
    pass: !findings.some((f) => f.severity === "fail"),
    findings,
    coreMs: sum("core"),
    marketingMs: sum("marketing"),
    retries: retries(),
    output: final,
    llm,
  };
}

const jobs: [EvalCase, number][] = [];
for (const c of cases) for (let r = 1; r <= runs; r++) jobs.push([c, r]);
const results: CaseResult[] = new Array(jobs.length);
let next = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (next < jobs.length) {
      const i = next++;
      const [c, r] = jobs[i];
      const t0 = Date.now();
      results[i] = await runCase(c, r);
      console.log(
        `${results[i].pass ? "PASS" : "FAIL"} ${c.id}#${r} (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
      );
    }
  }),
);

writeReport(outDir, header, results);
console.log(`Report: ${join(outDir, "report.md")}`);
process.exit(results.every((r) => r.pass) ? 0 : 1);
