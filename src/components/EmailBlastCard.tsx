import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Mail } from "lucide-react";
import { EMAIL_BLAST_PLACEHOLDERS, type EmailBlast } from "@/lib/listing-types";
import { formatEmailBlastBlock } from "@/lib/clipboard";

/**
 * Renders the generated Email Blast section — used identically on the
 * generator result and Saved Listings expanded view so the same content
 * appears in the same order and copies to the same plain-text format.
 */
export function EmailBlastCard({
  emailBlast,
  keyFeatures,
  onCopy,
}: {
  emailBlast: EmailBlast;
  keyFeatures?: string[];
  onCopy: (text: string) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <Mail className="h-4 w-4 shrink-0" />
            <h3 className="font-display text-lg font-semibold text-foreground">Email Blast</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Database email copy — Quill doesn't send emails or manage contacts.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Copy Email Blast"
          onClick={() => onCopy(formatEmailBlastBlock(emailBlast, keyFeatures))}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {emailBlast.subjectLines?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Subject line options
          </p>
          <ol className="mt-2 grid gap-2 text-sm">
            {emailBlast.subjectLines.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-2.5"
              >
                <Badge variant="secondary" className="shrink-0">
                  {i + 1}
                </Badge>
                <span className="min-w-0 break-words">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {emailBlast.previewText && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview text
          </p>
          <p className="mt-1 break-words text-sm text-foreground/90">{emailBlast.previewText}</p>
        </div>
      )}

      {emailBlast.headline && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Headline
          </p>
          <p className="mt-1 break-words font-display text-base font-semibold leading-snug">
            {emailBlast.headline}
          </p>
        </div>
      )}

      {emailBlast.body && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Body
          </p>
          <div className="mt-1 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {emailBlast.body.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="break-words">
                {p}
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Call to action
          </p>
          <p className="mt-1 break-words text-sm font-medium text-primary">
            {emailBlast.callToAction}
          </p>
        </div>
      )}

      <div className="mt-5 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1.5 font-semibold text-foreground/80">Fill in before sending</p>
        <ul className="space-y-1">
          {EMAIL_BLAST_PLACEHOLDERS.map((p) => (
            <li key={p} className="break-words">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
