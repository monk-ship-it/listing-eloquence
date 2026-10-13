/**
 * Light, pure normalisers for single-value fields filled by dictation or by
 * "Fill the form from my voice note". Each returns the input (tidied) when it
 * can't confidently normalise, so nothing is ever lost.
 */

const UNITS: Record<string, number> = {
  zero: 0,
  nought: 0,
  oh: 0,
  one: 1,
  a: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};
const SCALES: Record<string, number> = {
  k: 1_000,
  grand: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  mil: 1_000_000,
  million: 1_000_000,
};

/** Remove trailing full stops / punctuation that speech engines add. */
export function stripTrailing(s: string): string {
  return s
    .trim()
    .replace(/[.!?,;:]+$/g, "")
    .trim();
}

function digitValue(w: string): number | null {
  if (/^\d+$/.test(w)) return Number(w);
  if (w in UNITS && w !== "a") return UNITS[w];
  return null;
}

/** Parse an integer phrase like "three hundred and fifty thousand". */
function parseInteger(tokens: string[]): number | null {
  if (tokens.length === 0) return null;
  let total = 0;
  let current = 0;
  let seen = false;
  for (const w of tokens) {
    if (w === "and") continue;
    if (/^\d+(\.\d+)?$/.test(w)) {
      current += Number(w);
      seen = true;
    } else if (w in UNITS) {
      current += UNITS[w];
      seen = true;
    } else if (w in TENS) {
      current += TENS[w];
      seen = true;
    } else if (w === "hundred") {
      current = (current || 1) * 100;
      seen = true;
    } else if (w === "thousand") {
      total += (current || 1) * 1_000;
      current = 0;
      seen = true;
    } else if (w === "million") {
      total += (current || 1) * 1_000_000;
      current = 0;
      seen = true;
    } else {
      return null;
    }
  }
  return seen ? total + current : null;
}

/**
 * Number words or digits → number. Handles "four", "two and a half",
 * "one point four five million", "1.45 million", "350k", "£350,000".
 * Returns null when the phrase isn't a number.
 */
export function wordsToNumber(input: string): number | null {
  let t = stripTrailing(input)
    .toLowerCase()
    .replace(/[£,]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;

  // "350k", "1.45m", "1.45 million"
  const numeric = t.match(/^(\d+(?:\.\d+)?)\s*(k|m|mil|million|thousand|grand)?$/);
  if (numeric) {
    const n = Number(numeric[1]);
    return numeric[2] ? n * SCALES[numeric[2]] : n;
  }

  let half = 0;
  if (/\s*and a half$/.test(t)) {
    half = 0.5;
    t = t.replace(/\s*and a half$/, "").trim();
  } else if (t === "a half" || t === "half") {
    return 0.5;
  }

  const tokens = t.split(" ").filter(Boolean);
  let scale = 1;
  const last = tokens[tokens.length - 1];
  const pointIdx = tokens.indexOf("point");
  if (pointIdx !== -1 && last && last in SCALES && tokens.length > 1) {
    scale = SCALES[last];
    tokens.pop();
  }

  if (pointIdx !== -1) {
    const intPart = parseInteger(tokens.slice(0, pointIdx));
    const decTokens = tokens.slice(pointIdx + 1);
    if (intPart === null || decTokens.length === 0) return null;
    let decimals = "";
    for (const w of decTokens) {
      const d = digitValue(w);
      if (d === null) return null;
      decimals += String(d);
    }
    return Number(`${intPart}.${decimals}`) * scale;
  }

  const n = parseInteger(tokens);
  if (n === null) return null;
  return (n + half) * scale;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Bedrooms/bathrooms/receptions/lease years: "four" → "4", "two and a half" → "2.5". */
export function normaliseCount(s: string): string {
  const clean = stripTrailing(s);
  const stripped = clean.replace(
    /\s*(bed(room)?s?|bath(room)?s?|reception(s| rooms?)?|years?)$/i,
    "",
  );
  const n = wordsToNumber(stripped);
  return n === null ? clean : formatNumber(n);
}

/** Year built: keep a 4-digit year as-is; otherwise try number words. */
export function normaliseYear(s: string): string {
  const clean = stripTrailing(s);
  const year = clean.match(/\b(1[5-9]\d{2}|20\d{2})s?\b/);
  if (year) return year[0];
  const n = wordsToNumber(clean);
  return n === null ? clean : formatNumber(n);
}

/** "band D", "council tax band d" → "D". */
export function normaliseCouncilTax(s: string): string {
  const clean = stripTrailing(s);
  const m =
    clean.match(/^(?:council\s*tax\s*)?(?:band\s*)?([a-h])$/i) ??
    clean.match(/\bband\s+([a-h])\b/i);
  return m ? m[1].toUpperCase() : clean;
}

/** "EPC C", "energy rating c" → "C". */
export function normaliseEpc(s: string): string {
  const clean = stripTrailing(s);
  const m =
    clean.match(
      /^(?:epc|energy(?:\s*performance)?(?:\s*certificate)?)?\s*(?:rating|band)?\s*(?:of\s*)?([a-g])$/i,
    ) ?? clean.match(/\b(?:epc|rating|band)\s+(?:of\s+)?([a-g])\b/i);
  return m ? m[1].toUpperCase() : clean;
}

/**
 * Prices → "1,450,000". Accepts "one point four five million",
 * "1.45 million", "three hundred and fifty thousand", "350k", "£350,000".
 */
export function normalisePrice(s: string): string {
  const clean = stripTrailing(s);
  const body = clean
    .replace(
      /^(guide\s*price|asking\s*price|offers\s*(in\s*excess\s*of|over)|oieo|offers\s*in\s*the\s*region\s*of|oiro|price)\s*(of\s*)?/i,
      "",
    )
    .replace(/\s*(pounds|gbp)$/i, "")
    .trim();
  const n = wordsToNumber(body);
  if (n === null || n < 1000) return clean;
  return Math.round(n).toLocaleString("en-GB");
}

/** "freehold" → "Freehold", "share of freehold" → "Share of freehold". */
export function normaliseTenure(s: string): string {
  const clean = stripTrailing(s);
  const k = clean.toLowerCase();
  if (/share\s+of\s+(the\s+)?freehold/.test(k)) return "Share of freehold";
  if (/\bleasehold\b/.test(k)) return "Leasehold";
  if (/\bfreehold\b/.test(k)) return "Freehold";
  if (/\bcommonhold\b/.test(k)) return "Commonhold";
  return clean ? clean[0].toUpperCase() + clean.slice(1) : clean;
}

const BY_FIELD: Record<string, (s: string) => string> = {
  bedrooms: normaliseCount,
  bathrooms: normaliseCount,
  receptions: normaliseCount,
  leaseYears: normaliseCount,
  yearBuilt: normaliseYear,
  councilTaxBand: normaliseCouncilTax,
  epc: normaliseEpc,
  price: normalisePrice,
  tenure: normaliseTenure,
};

/** Apply the field's normaliser (or just strip trailing punctuation). */
export function normaliseForField(key: string, value: string): string {
  const fn = BY_FIELD[key];
  return fn ? fn(value) : stripTrailing(value);
}
