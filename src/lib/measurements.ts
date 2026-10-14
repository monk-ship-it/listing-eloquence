/**
 * Deterministic metric → imperial for room dimensions. Pure, no AI.
 * "5.2m x 4.1m" → "5.20m x 4.10m (17'1" x 13'5")".
 * totalInches = round(m / 0.0254); feet = floor(in / 12); inches = in % 12.
 * Qualifiers (max, into bay, narrowing to …) are kept; text that already has
 * imperial is left alone.
 */

/** 4.52 → 14'10" */
export function metresToFeetInches(m: number): string {
  const total = Math.round(m / 0.0254);
  return `${Math.floor(total / 12)}'${total % 12}"`;
}

const NUM = String.raw`(\d+(?:\.\d+)?)\s?m(?![a-z])`;
const QUAL = String.raw`(?:\s*\((?:max|maximum|min|minimum|approx\.?)\)|\s+(?:max|maximum)\b|\s+into\s+(?:the\s+)?bay\b|\s+narrowing\s+to\s+${NUM})*`;
const DIM_RE = new RegExp(String.raw`${NUM}${QUAL}(?:\s*(?:x|×|by)\s*${NUM}${QUAL})+`, "gi");
const NUM_RE = new RegExp(NUM, "gi");
const HAS_IMPERIAL = /\d+\s*'|\d+\s*(?:ft|feet|foot)\b|\d+\s*″|\d+\s*′/i;

function convertOne(expr: string): string {
  const metric = expr.replace(NUM_RE, (_m, n: string) => `${Number(n).toFixed(2)}m`);
  const imperial = expr
    .replace(NUM_RE, (_m, n: string) => metresToFeetInches(Number(n)))
    .replace(/\s*\(([^)]*)\)/g, " $1")
    .replace(/\s*×\s*/g, " x ")
    .replace(/\s+by\s+/gi, " x ");
  return `${metric} (${imperial})`;
}

/** Converts every metric dimension pair in the text. Segments split on ; or new lines. */
export function addImperial(text: string): string {
  if (!text) return text;
  return text
    .split(/(;|\n)/)
    .map((seg) => (seg === ";" || seg === "\n" || HAS_IMPERIAL.test(seg) ? seg : seg.replace(DIM_RE, (m) => convertOne(m))))
    .join("");
}
