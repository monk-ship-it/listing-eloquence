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
 * Build the full "copy all" text for a generated listing.
 * Order: headline, Key Features, Description, Teaser, Social pack.
 */
export function buildCopyAllText(output: {
  headline: string;
  listing: string;
  summary?: string;
  keyFeatures?: string[];
  social?: { platform: string; caption: string; hashtags: string[] }[];
}): string {
  const features = formatKeyFeaturesBlock(output.keyFeatures);
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
    social ? `\n--- Social pack ---\n${social}` : "",
  ]
    .filter((s) => s !== "")
    .join("\n");
}
