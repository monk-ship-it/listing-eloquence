/** Optional LLM grader (--llm-grade). Uses the same callClaudeTool as the app. */
import { callClaudeTool, type CallMeta } from "../../src/lib/ai-gateway.server";
import type { ListingInput } from "../../src/lib/listing-types";
import {
  GRADER_SCHEMA,
  GRADER_SETTINGS,
  GRADER_SYSTEM,
  GRADER_TOOL,
  GRADER_USER_TEMPLATE,
} from "../../src/lib/prompts/grader";
import { fillTemplate } from "../../src/lib/prompts/templates";
import { privateNotesLines, promptVars } from "../../src/lib/prompts/render";
import { VOICES } from "../../src/lib/voices";
import type { GradePack } from "./graders";
import type { LlmGrade } from "./types";

function packText(p: GradePack): string {
  const e = p.emailBlast;
  return [
    `HEADLINE: ${p.headline}`,
    `STRAPLINE: ${p.summary}`,
    `KEY FEATURES:\n${p.keyFeatures.map((f) => `- ${f}`).join("\n")}`,
    `PORTAL DESCRIPTION:\n${p.listing}`,
    e
      ? `EMAIL BLAST:\nSubject lines:\n${e.subjectLines.map((s) => `- ${s}`).join("\n")}\nPreview: ${e.previewText}\nHeadline: ${e.headline}\nBody:\n${e.body}\nCTA: ${e.callToAction ?? ""}`
      : "EMAIL BLAST: (missing)",
    `SELLER APPROVAL EMAIL:\n${p.sellerEmail?.body ?? "(missing)"}`,
    `SOCIAL:\n${p.social.map((s) => `[${s.platform}] ${s.caption}\n${s.hashtags.map((h) => `#${h}`).join(" ")}`).join("\n\n")}`,
  ].join("\n\n");
}

export async function llmGrade(
  pack: GradePack,
  input: ListingInput,
  model: string,
  onMeta?: (m: CallMeta) => void,
): Promise<LlmGrade> {
  const v = promptVars(input);
  const voice = VOICES.find((x) => x.id === input.voice);
  const user = fillTemplate(GRADER_USER_TEMPLATE, {
    TODAY: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    VOICE: `${voice?.name ?? input.voice} — ${voice?.descriptor ?? ""}`,
    FACTS: v.PROPERTY_DETAILS,
    MATERIAL_INFORMATION: v.MATERIAL_INFORMATION,
    VOICE_NOTES: input.voiceNotes?.trim() || "(none)",
    PRIVATE_NOTES: privateNotesLines(input) || "(none)",
    SELLER_APPROVAL: v.SELLER_APPROVAL,
    PACK: packText(pack),
  });
  const raw = (await callClaudeTool({
    system: GRADER_SYSTEM,
    user,
    toolName: GRADER_TOOL,
    toolDescription: "Submit the scores, verdict and fixes.",
    inputSchema: GRADER_SCHEMA,
    maxTokens: GRADER_SETTINGS.maxTokens,
    temperature: GRADER_SETTINGS.temperature,
    timeoutMs: GRADER_SETTINGS.timeoutMs,
    model,
    onMeta,
  })) as Partial<LlmGrade>;
  const scores = (raw.scores ?? {}) as Record<string, number>;
  const vals = ["1", "2", "3", "4", "5", "6", "7", "8"].map((k) => Number(scores[k]) || 0);
  const average = vals.reduce((a, b) => a + b, 0) / 8;
  // Recompute the verdict from the rubric rather than trusting the model's arithmetic.
  const hardFail = vals[0] <= 2 || vals[1] <= 2;
  return {
    scores,
    hardFail,
    verdict: !hardFail && average >= 4 ? "PASS" : "FAIL",
    fixes: Array.isArray(raw.fixes) ? raw.fixes.filter((x) => typeof x === "string") : [],
    average: Math.round(average * 100) / 100,
  };
}
