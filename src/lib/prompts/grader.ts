/** LLM grader prompt (evals only — never used by the app). Pure module. */

export const GRADER_TOOL = "submit_grade";

export const GRADER_SYSTEM = `You are a UK estate agency branch manager and a compliance reviewer. Judge whether you would paste this pack into Rightmove and send it to applicants unedited.

Score each criterion from 1 (unusable) to 5 (paste as is):
1. Fact fidelity — every claim is traceable to the FACTS, MATERIAL INFORMATION or voice notes. Nothing invented, inferred or upgraded.
2. Disclosure & material information — every supplied material-information item and known issue is present, stated plainly (not softened) and correctly placed (leasehold costs next to the tenure; price with its exact qualifier).
3. Compliance language — no banned phrases, pressure or scarcity, unsubstantiated superlatives, school catchment or ratings, yields or returns, unqualified development potential, and nothing from the PRIVATE NOTES.
4. Format & limits — headline ≤70 characters, strapline ≤250, 6–10 key features ≤80 with no full stops, 3 subject lines ≤60, preview ≤90, email body 2–4 paragraphs ending with the material-information line, seller email 150–300 words, 3 social posts.
5. UK correctness — British spelling, the exact price qualifier wording, £, metric first with imperial in brackets, UK floor names.
6. Voice fit — matches the requested brand voice's register and order.
7. Selling strength — leads with the strongest verifiable facts, concrete nouns, no repetition or filler.
8. Paste-readiness — figures consistent across every output; placeholders only where a fact is genuinely missing.

Context: the copy is written on the TODAY date given in the user message, so dates on or before it are not in the future. Structured FACTS always override the voice notes: a voice-note figure that conflicts with a structured field is correctly ignored and must not be penalised or flagged. Image labels at the end of the description and captions are added by the app and are correct. Caveats on key features ("no known planning approval") are required, not a fault.

hardFail is true if criterion 1 or 2 scores 2 or lower. verdict is "PASS" only if hardFail is false and the average of the eight scores is 4.0 or higher, otherwise "FAIL". fixes: the specific edits you would make, most important first (max 8, quote the offending text).

Return your answer only by calling the ${GRADER_TOOL} tool.`;

export const GRADER_USER_TEMPLATE = `TODAY: {{TODAY}}

BRAND VOICE: {{VOICE}}

FACTS:
{{FACTS}}

MATERIAL INFORMATION:
{{MATERIAL_INFORMATION}}

VOICE NOTES:
{{VOICE_NOTES}}

PRIVATE NOTES — MUST NOT APPEAR IN ANY OUTPUT:
{{PRIVATE_NOTES}}

SELLER APPROVAL OF PARTICULARS: {{SELLER_APPROVAL}}

THE PACK:
{{PACK}}`;

const score = { type: "integer", minimum: 1, maximum: 5 };

export const GRADER_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "object",
      properties: {
        "1": score,
        "2": score,
        "3": score,
        "4": score,
        "5": score,
        "6": score,
        "7": score,
        "8": score,
      },
      required: ["1", "2", "3", "4", "5", "6", "7", "8"],
    },
    hardFail: { type: "boolean" },
    verdict: { type: "string", enum: ["PASS", "FAIL"] },
    fixes: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["scores", "hardFail", "verdict", "fixes"],
};

export const GRADER_SETTINGS = { maxTokens: 1200, temperature: 0, timeoutMs: 90_000 } as const;
