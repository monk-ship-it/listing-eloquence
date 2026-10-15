import type { ListingInput } from "../../src/lib/listing-types";

export interface EvalCase {
  id: string;
  call: "pack" | "extract";
  tags?: string[];
  /** Merged over EMPTY_INPUT, then normaliseInput (pack cases). */
  input?: Partial<ListingInput>;
  /** Voice notes (extract cases). */
  notes?: string;
  /** Text that must appear in each listed section (case-insensitive). */
  mustInclude?: { text: string; sections: string[] }[];
  /** Must not appear in any public output (word-boundary aware, case-insensitive). */
  mustNotInclude?: string[];
  /** Regex checks (case-insensitive) on sections, or on every matching key feature. */
  patterns?: {
    sections?: string[];
    match?: string;
    notMatch?: string;
    eachKeyFeature?: { if: string; then: string };
  }[];
  /** Extraction expectations; null = must NOT be returned. */
  expectFields?: Record<string, string | null>;
}

export type Severity = "fail" | "warn";

export interface Finding {
  grader: string;
  severity: Severity;
  message: string;
  /** The offending text, if any. */
  text?: string;
}

export interface CallTiming {
  call: "core" | "marketing" | "extract";
  attempt: number;
  ms: number;
  stopReason: string | null;
  inputTokens: number;
  outputTokens: number;
  /** Why this attempt ran (empty for a first attempt). */
  reason?: string[];
}

export interface LlmGrade {
  scores: Record<string, number>;
  hardFail: boolean;
  verdict: "PASS" | "FAIL";
  /** Claims the grader found unsupported by the facts (any → hard fail). */
  unsupported?: string[];
  fixes: string[];
  average: number;
}

export interface CaseResult {
  id: string;
  run: number;
  call: "pack" | "extract";
  pass: boolean;
  findings: Finding[];
  timings: CallTiming[];
  coreMs?: number;
  marketingMs?: number;
  extractMs?: number;
  retries: number;
  error?: string;
  output?: unknown;
  raw?: Record<string, unknown>;
  extraction?: { precision: number; recall: number };
  llm?: LlmGrade | { error: string };
}
