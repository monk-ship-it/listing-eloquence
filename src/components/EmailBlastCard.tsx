import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, Loader2, Mail, Sparkles } from "lucide-react";
import {
  EMAIL_LINK_PLACEHOLDER,
  EMAIL_SIGNOFF_PLACEHOLDER,
  type EmailBlast,
  type ListingOutput,
} from "@/lib/listing-types";
import { copyText, formatEmailBodyOnly, formatEmailForPaste, withDraft, wordCount } from "@/lib/clipboard";
import { generateMarketingForGeneration } from "@/lib/listing.functions";

async function copyWithToast(text: string, label: string) {
  const ok = await copyText(text);
  if (ok) toast.success(label);
  else toast.error("Couldn't copy — please copy manually.");
}

function friendlyMarketingError(msg: string): string {
  if (msg.includes("REGEN_LIMIT_REACHED"))
    return "You've reached today's limit for free email & social generations. Try again tomorrow.";
  if (msg.includes("SUBSCRIPTION_REQUIRED")) return "Your trial or subscription is required to generate.";
  if (msg.includes("RATE_LIMIT")) return "Lots of requests right now — please wait a moment and try again.";
  if (msg.includes("AI_TIMEOUT")) return "That took too long to write. Please try again.";
  if (msg.includes("MALFORMED_AI_OUTPUT") || msg.includes("AI_TRUNCATED"))
    return "The writer returned an incomplete draft. Please try again — it's still free.";
  if (msg.includes("AI_UNAVAILABLE")) return "The writer is temporarily unavailable. Please try again shortly.";
  return msg || "Couldn't generate the email. Please try again.";
}

/**
 * Free "fill in email & social" action for a saved listing. Never uses a
 * listing credit. Calls onGenerated with the updated output.
 */
export function GenerateMarketingButton({
  generationId,
  label,
  onGenerated,
}: {
  generationId: string | null | undefined;
  label: string;
  onGenerated: (output: ListingOutput) => void;
}) {
  const fn = useServerFn(generateMarketingForGeneration);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!generationId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await fn({ data: { generationId } });
      onGenerated(out);
      toast.success("Email & social generated.");
    } catch (err) {
      const msg = friendlyMarketingError(err instanceof Error ? err.message : "");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={run} disabled={busy || !generationId}>
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" /> {label}
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Email Blast section — used identically on the generator result and Saved
 * Listings. When the email is missing (legacy rows or a failed marketing
 * call), offers a free generate button instead.
 */
export function EmailBlastCard({
  emailBlast,
  keyFeatures,
  generationId,
  marketingStatus,
  onGenerated,
  renderText,
  draft,
}: {
  emailBlast: EmailBlast | null;
  keyFeatures?: string[];
  generationId?: string | null;
  marketingStatus?: "failed";
  onGenerated?: (output: ListingOutput) => void;
  renderText?: (text: string) => ReactNode;
  /** Seller hasn't approved: every copy is prefixed with the draft label. */
  draft?: boolean;
}) {
  const [chosen, setChosen] = useState(0);

  return (
    <Card className="p-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-primary">
          <Mail className="h-4 w-4 shrink-0" />
          <h3 className="font-display text-lg font-semibold text-foreground">Email Blast</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          New-instruction email for your applicant database — copy and paste into your CRM or email.
        </p>
      </div>

      {!emailBlast ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {marketingStatus === "failed"
              ? "The email didn't generate this time."
              : "This listing was saved before Email Blasts existed."}
          </p>
          {onGenerated && (
            <GenerateMarketingButton
              generationId={generationId}
              label="Generate Email Blast — free, doesn't use a listing"
              onGenerated={onGenerated}
            />
          )}
        </div>
      ) : (
        <EmailBlastBody
          emailBlast={emailBlast}
          keyFeatures={keyFeatures}
          chosen={Math.min(chosen, Math.max(0, emailBlast.subjectLines.length - 1))}
          onChoose={setChosen}
          renderText={renderText}
          draft={draft}
        />
      )}
    </Card>
  );
}

function EmailBlastBody({
  emailBlast,
  keyFeatures,
  chosen,
  onChoose,
  renderText = (t) => t,
  draft,
}: {
  emailBlast: EmailBlast;
  keyFeatures?: string[];
  chosen: number;
  onChoose: (i: number) => void;
  renderText?: (text: string) => ReactNode;
  draft?: boolean;
}) {
  const pmWords = wordCount(emailBlast.personalMessage);
  const subject = emailBlast.subjectLines[chosen] ?? "";
  return (
    <>
      {emailBlast.subjectLines.length > 0 && (
        <div className="mt-4">
          <p id="subject-options-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Subject line — tap to choose
          </p>
          <div role="radiogroup" aria-label="Subject line options" className="mt-2 grid gap-2">
            {emailBlast.subjectLines.map((s, i) => {
              const selected = i === chosen;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1 rounded-md border transition-colors ${
                    selected ? "border-primary bg-primary/10" : "border-border/60 bg-card/40"
                  }`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChoose(i)}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md p-2.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span
                      aria-hidden="true"
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 break-words">{s}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 sm:h-9 sm:w-9"
                    aria-label={`Copy subject line ${i + 1}`}
                    onClick={() => copyWithToast(withDraft(s, draft), "Subject line copied.")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {emailBlast.previewText && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview text</p>
          <p className="mt-1 break-words text-sm text-foreground/90">{emailBlast.previewText}</p>
        </div>
      )}

      {emailBlast.headline && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Headline</p>
          <p className="mt-1 break-words font-display text-base font-semibold leading-snug">{emailBlast.headline}</p>
        </div>
      )}

      {emailBlast.body && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body</p>
          <div className="mt-1 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {emailBlast.body.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="break-words">
                {renderText(p)}
              </p>
            ))}
          </div>
        </div>
      )}

      {keyFeatures && keyFeatures.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Key features (reused from the pack)
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
            {keyFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="break-words">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {emailBlast.callToAction && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Call to action</p>
          <p className="mt-1 break-words text-sm font-medium text-primary">
            {emailBlast.callToAction}: {EMAIL_LINK_PLACEHOLDER}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="min-h-11 sm:min-h-10"
          onClick={() =>
            copyWithToast(
              withDraft(formatEmailForPaste(emailBlast, { subject, keyFeatures }), draft),
              "Email copied — add your link and sign-off, then paste.",
            )
          }
        >
          <Copy className="mr-2 h-4 w-4" /> Copy email
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 sm:min-h-10"
          onClick={() => copyWithToast(withDraft(formatEmailBodyOnly(emailBlast), draft), "Email body copied.")}
        >
          Copy body only
        </Button>
      </div>

      {emailBlast.personalMessage && (
        <div className="mt-5 rounded-lg border border-border/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                CRM property-alert message
              </p>
              <span
                className={`text-xs tabular-nums ${
                  pmWords < 40 || pmWords > 80 ? "font-semibold text-warning" : "text-muted-foreground"
                }`}
              >
                {pmWords} words (40–80)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="Copy CRM property-alert message"
              onClick={() =>
                copyWithToast(withDraft(emailBlast.personalMessage ?? "", draft), "Property-alert message copied.")
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            For the message box in Alto, Reapit, Street and similar property alerts.
          </p>
          <p className="mt-2 break-words text-sm text-muted-foreground">{renderText(emailBlast.personalMessage)}</p>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1.5 font-semibold text-foreground/80">Before you send</p>
        <ul className="space-y-1">
          <li className="break-words">Replace {EMAIL_LINK_PLACEHOLDER} with the listing URL.</li>
          <li className="break-words">Replace {EMAIL_SIGNOFF_PLACEHOLDER} with your sign-off.</li>
        </ul>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Your email platform adds the sender details and unsubscribe link.
      </p>
    </>
  );
}
