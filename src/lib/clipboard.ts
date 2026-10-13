import type { EmailBlast } from "./listing-types";
import { EMAIL_LINK_PLACEHOLDER, EMAIL_SIGNOFF_PLACEHOLDER } from "./listing-types";

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
    // iOS Safari won't copy from a readonly field; make it editable instead.
    ta.contentEditable = "true";
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.style.fontSize = "16px"; // avoid iOS zoom-on-focus
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
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
 * Paste-ready plain-text email for Gmail, Outlook, Alto, Reapit etc.:
 * Subject, headline, body, key-feature bullets, CTA with link placeholder,
 * then the sign-off placeholder. Quill never invents links or contact info.
 */
export function formatEmailForPaste(
  emailBlast: EmailBlast | null | undefined,
  opts: { subject?: string; keyFeatures?: string[]; includeFeatures?: boolean } = {},
): string {
  if (!emailBlast) return "";
  const subject = opts.subject ?? emailBlast.subjectLines?.[0] ?? "";
  const blocks: string[] = [];
  if (subject) blocks.push(`Subject: ${subject}`);
  if (emailBlast.headline) blocks.push(emailBlast.headline);
  if (emailBlast.body) blocks.push(emailBlast.body.trim());
  if (opts.includeFeatures !== false && opts.keyFeatures && opts.keyFeatures.length > 0) {
    blocks.push(opts.keyFeatures.map((f) => `• ${f}`).join("\n"));
  }
  blocks.push(`${emailBlast.callToAction || "View property details"}: ${EMAIL_LINK_PLACEHOLDER}`);
  blocks.push(EMAIL_SIGNOFF_PLACEHOLDER);
  return blocks.join("\n\n");
}

/** Body paragraphs only. */
export function formatEmailBodyOnly(emailBlast: EmailBlast | null | undefined): string {
  return emailBlast?.body?.trim() ?? "";
}

/** Caption plus hashtags, with no trailing blank line when there are none. */
export function formatSocialPost(p: { caption: string; hashtags?: string[] }): string {
  const tags = (p.hashtags ?? []).map((t) => `#${t.replace(/^#/, "")}`).join(" ");
  return tags ? `${p.caption}\n\n${tags}` : p.caption;
}

/**
 * Build the full "copy all" text for a generated listing.
 * Order: headline → Key Features → Description → Teaser → Email → Social pack.
 * The email omits its bullet list here so Key Features appear only once.
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
  const email = formatEmailForPaste(output.emailBlast, { includeFeatures: false });
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
    email ? `\n--- Email Blast ---\n${email}` : "",
    social ? `\n--- Social pack ---\n${social}` : "",
  ]
    .filter((s) => s !== "")
    .join("\n");
}
