import type { EmailBlast } from "./listing-types";
import { EMAIL_BLAST_PLACEHOLDERS } from "./listing-types";

/**
 * Copy text to the clipboard. Awaits the Clipboard API when available,
 * falls back to a hidden textarea + execCommand for older browsers or
 * insecure contexts. Returns true on success.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy fallback
  }
  let ta: HTMLTextAreaElement | null = null;
  try {
    ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (ta && ta.parentNode) {
      try {
        ta.parentNode.removeChild(ta);
      } catch {
        // ignore
      }
    }
  }
}

/** Format an array of key-feature bullets as a copyable dashed list. */
export function formatKeyFeaturesBlock(features: string[] | undefined): string {
  if (!features || features.length === 0) return "";
  return ["Key features:", ...features.map((f) => `- ${f}`)].join("\n");
}

/**
 * Format an Email Blast as clearly-headed plain text, easy to paste into
 * Mailchimp, Outlook or a CRM editor. Reuses the generated Key Features so
 * agents don't have to rebuild a second bullet list.
 *
 * Appends the fixed editable placeholder block — Quill never invents
 * property URLs, agent contact info, or platform sending controls.
 */
export function formatEmailBlastBlock(
  emailBlast: EmailBlast | null | undefined,
  keyFeatures?: string[],
): string {
  if (!emailBlast) return "";
  const lines: string[] = ["--- Email Blast ---", ""];

  if (emailBlast.subjectLines && emailBlast.subjectLines.length > 0) {
    lines.push("Subject line options:");
    emailBlast.subjectLines.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }
  if (emailBlast.previewText) {
    lines.push(`Preview text: ${emailBlast.previewText}`);
    lines.push("");
  }
  if (emailBlast.headline) {
    lines.push(`Headline: ${emailBlast.headline}`);
    lines.push("");
  }
  if (emailBlast.body) {
    lines.push("Body:");
    lines.push(emailBlast.body);
    lines.push("");
  }
  const features = formatKeyFeaturesBlock(keyFeatures);
  if (features) {
    lines.push(features);
    lines.push("");
  }
  if (emailBlast.callToAction) {
    lines.push(`Call to action: ${emailBlast.callToAction}`);
    lines.push("");
  }
  for (const p of EMAIL_BLAST_PLACEHOLDERS) lines.push(p);
  return lines.join("\n");
}

/**
 * Build the full "copy all" text for a generated listing.
 * Order: headline → Key Features → Description → Teaser → Email Blast → Social pack.
 */
export function buildCopyAllText(output: {
  headline: string;
  listing: string;
  summary?: string;
  keyFeatures?: string[];
  emailBlast?: EmailBlast | null;
  social?: { platform: string; caption: string; hashtags: string[] }[];
}): string {
  const features = formatKeyFeaturesBlock(output.keyFeatures);
  const email = formatEmailBlastBlock(output.emailBlast, output.keyFeatures);
  const social = (output.social ?? [])
    .map((p) => {
      const tags = (p.hashtags ?? []).map((t) => `#${t.replace(/^#/, "")}`).join(" ");
      return `${p.platform}:\n${p.caption}${tags ? `\n${tags}` : ""}`;
    })
    .join("\n\n");
  return [
    output.headline,
    features ? `\n${features}` : "",
    `\nDescription:\n${output.listing}`,
    output.summary ? `\nTeaser: ${output.summary}` : "",
    email ? `\n${email}` : "",
    social ? `\n--- Social pack ---\n${social}` : "",
  ]
    .filter((s) => s !== "")
    .join("\n");
}
