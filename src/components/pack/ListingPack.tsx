import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Copy, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmailBlastCard, GenerateMarketingButton, useAgencyDetails } from "@/components/EmailBlastCard";
import type { ListingInput, ListingOutput } from "@/lib/listing-types";
import {
  buildCopyAllText,
  copyText,
  formatKeyFeaturesBlock,
  formatSellerEmail,
  formatSocialPost,
  hasAgencyDetails,
  withAgency,
  withDraft,
  withMaterialInfo,
} from "@/lib/clipboard";
import { buildMaterialInfoBlock, checkMaterialInfo, summariseChecks } from "@/lib/material-info";
import {
  factCheckPack,
  keyFeatureCaveatFlags,
  privateLeakFlags,
  publicInputsToText,
  type FactFlag,
} from "@/lib/fact-check";
import { cn } from "@/lib/utils";

async function copyToast(text: string, label: string) {
  const ok = await copyText(text);
  if (ok) toast.success(label);
  else toast.error("Couldn't copy — please copy manually.");
}

const NOT_IN_NOTES = "Not in your notes — check before publishing";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Underlines flagged terms amber with a tooltip. */
function makeHighlighter(flags: FactFlag[]) {
  const terms = [...new Set(flags.map((f) => f.term))].sort((a, b) => b.length - a.length);
  if (terms.length === 0) return (text: string): ReactNode => text;
  const kindOf = new Map(flags.map((f) => [f.term.toLowerCase(), f.kind]));
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
  return (text: string): ReactNode =>
    text.split(re).map((part, i) => {
      const kind = kindOf.get(part.toLowerCase());
      if (!kind || i % 2 === 0) return part;
      const tip =
        kind === "banned"
          ? "Banned filler phrase — reword before publishing"
          : kind === "contact"
            ? "Contact details or links are stripped by portals — remove"
            : kind === "private-leak"
              ? "From your private viewing / photo notes — remove from public copy"
              : kind === "missing-caveat"
                ? "Matches a known issue — keep its caveat (e.g. no approval, not yet redecorated)"
                : NOT_IN_NOTES;
      return (
        <span
          key={i}
          title={tip}
          aria-label={`${part} (${tip})`}
          className="underline decoration-warning decoration-wavy decoration-2 underline-offset-4"
        >
          {part}
        </span>
      );
    });
}

function Counter({ n, warn, max }: { n: number; warn?: number; max: number }) {
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        n > max ? "font-semibold text-destructive" : warn && n > warn ? "text-warning" : "text-muted-foreground",
      )}
    >
      {n}/{max}
    </span>
  );
}

function CopyIcon({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-11 w-11 shrink-0"
      aria-label={label}
      onClick={onClick}
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
}

/**
 * The generated pack — identical on the generator and Saved listings.
 * `input` is the set of facts the pack was generated from.
 */
export function ListingPack({
  output,
  input,
  generationId,
  onOutputChange,
  onJumpToField,
}: {
  output: ListingOutput;
  input: ListingInput;
  generationId: string | null;
  onOutputChange: (o: ListingOutput) => void;
  onJumpToField?: (field: string) => void;
}) {
  const [appendMi, setAppendMi] = useState(true);
  const miBlock = useMemo(() => buildMaterialInfoBlock(input), [input]);
  const checks = useMemo(() => summariseChecks(checkMaterialInfo(input)), [input]);
  const flags = useMemo(
    () => [
      ...factCheckPack(output, publicInputsToText(input)),
      ...privateLeakFlags(output, input),
      ...keyFeatureCaveatFlags(output.keyFeatures, input.disclosures),
    ],
    [output, input],
  );
  const hl = useMemo(() => makeHighlighter(flags), [flags]);
  const mi = appendMi ? miBlock : "";

  const fixCount = checks.open.length;
  const agency = useAgencyDetails();
  const draft = input.sellerApproved !== true;
  const copy = (text: string, label: string) => copyToast(withDraft(text, draft), label);
  const strapLen = output.summary?.length ?? 0;

  return (
    <div className="space-y-6">
      {(fixCount > 0 || flags.length > 0) && (
        <Card className="border-warning/50 bg-warning/5 p-5">
          <div className="flex items-start gap-2">
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold">
                {fixCount > 0
                  ? `${fixCount} thing${fixCount === 1 ? "" : "s"} to fix before you publish`
                  : "Check before you publish"}
              </h3>
              {flags.length > 0 && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {flags.length} detail{flags.length === 1 ? "" : "s"} to check — underlined below.
                </p>
              )}
              {fixCount > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {checks.open.map((i) => (
                    <li key={i.id} className="flex items-start gap-2">
                      <Badge
                        variant={i.severity === "block" ? "destructive" : "secondary"}
                        className="mt-0.5 shrink-0 text-[10px] uppercase"
                      >
                        {i.severity === "block"
                          ? "Must fix"
                          : i.severity === "conflict"
                            ? "Conflict"
                            : i.severity === "warn"
                              ? "Add"
                              : "Confirm"}
                      </Badge>
                      {onJumpToField ? (
                        <button
                          type="button"
                          onClick={() => onJumpToField(i.field)}
                          className="min-h-8 text-left underline-offset-2 hover:underline"
                        >
                          <span className="font-medium">{i.label}</span> — {i.message}
                        </button>
                      ) : (
                        <span>
                          <span className="font-medium">{i.label}</span> — {i.message}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {flags.some((f) => f.kind === "banned" || f.kind === "contact") && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Includes banned phrases or contact details that portals strip.
                </p>
              )}
              {flags.some((f) => f.kind === "private-leak") && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Includes wording from your private viewing or photo notes — remove it before publishing.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Brochure / email headline
              </p>
              <Counter n={output.headline.length} max={70} />
              {draft && (
                <Badge
                  variant="outline"
                  className="border-warning/60 text-[10px] uppercase text-warning"
                  title="Seller approval not confirmed — copies are labelled draft (TPO Code 7j)"
                >
                  Draft
                </Badge>
              )}
            </div>
            <h2 className="mt-1 break-words font-display text-xl font-semibold">{hl(output.headline)}</h2>
          </div>
          <CopyIcon
            label="Copy full listing pack"
            onClick={() =>
              copyToast(withAgency(buildCopyAllText(output, { materialInfo: mi, draft }), agency), "Full pack copied.")
            }
          />
        </div>
      </Card>

      {output.keyFeatures.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Key features</h3>
            <CopyIcon
              label="Copy key features"
              onClick={() => copy(formatKeyFeaturesBlock(output.keyFeatures), "Key features copied.")}
            />
          </div>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {output.keyFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 break-words">
                  {hl(f)}
                  {f.length > 80 && (
                    <span className="ml-1.5 text-xs font-semibold text-destructive">{f.length}/80</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Description</h3>
            <p className="text-xs text-muted-foreground">
              Plain text — safe to paste into Rightmove, Zoopla and OnTheMarket
            </p>
          </div>
          <CopyIcon
            label="Copy description"
            onClick={() => copy(withMaterialInfo(output.listing, mi), "Description copied.")}
          />
        </div>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {output.listing.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="break-words">
              {hl(p)}
            </p>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="font-display text-lg font-semibold">Strapline (portal summary)</h3>
            <Counter n={strapLen} warn={160} max={250} />
          </div>
          <CopyIcon label="Copy strapline" onClick={() => copy(output.summary, "Strapline copied.")} />
        </div>
        <p className="mt-2 break-words text-sm text-muted-foreground">{hl(output.summary)}</p>
        {strapLen > 160 && strapLen <= 250 && (
          <p className="mt-1 text-xs text-warning">Over 160 characters — portals may cut it off in search results.</p>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">Material Information</h3>
          </div>
          {miBlock && (
            <CopyIcon label="Copy Material Information" onClick={() => copy(miBlock, "Material Information copied.")} />
          )}
        </div>
        {miBlock ? (
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground">
            {miBlock}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No material information entered yet.</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Switch id={`mi-append-${generationId ?? "new"}`} checked={appendMi} onCheckedChange={setAppendMi} />
          <Label htmlFor={`mi-append-${generationId ?? "new"}`} className="text-sm">
            Add to description when copying
          </Label>
        </div>
      </Card>

      <EmailBlastCard
        emailBlast={output.emailBlast}
        keyFeatures={output.keyFeatures}
        generationId={generationId}
        marketingStatus={output.marketingStatus}
        onGenerated={onOutputChange}
        renderText={hl}
        draft={draft}
      />

      <SellerEmailCard
        output={output}
        materialInfo={miBlock}
        sellerApproved={input.sellerApproved === true}
        generationId={generationId}
        onGenerated={onOutputChange}
      />

      <Card className="p-6">
        <h3 className="font-display text-lg font-semibold">Social pack</h3>
        {output.social.length === 0 && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">The social posts didn't generate this time.</p>
            <GenerateMarketingButton
              generationId={generationId}
              label="Generate social posts — free, doesn't use a listing"
              onGenerated={onOutputChange}
            />
          </>
        )}
        <div className="mt-4 space-y-4">
          {output.social.map((post) => (
            <div key={post.platform} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{post.platform}</Badge>
                <CopyIcon
                  label={`Copy ${post.platform} post`}
                  onClick={() => copy(formatSocialPost(post), "Post copied.")}
                />
              </div>
              <p className="mt-2 break-words text-sm text-muted-foreground">{hl(post.caption)}</p>
              {post.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {post.hashtags.map((h) => (
                    <span key={h} className="text-xs text-primary">
                      #{h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SellerEmailCard({
  output,
  materialInfo,
  sellerApproved,
  generationId,
  onGenerated,
}: {
  output: ListingOutput;
  materialInfo: string;
  sellerApproved: boolean;
  generationId: string | null;
  onGenerated: (o: ListingOutput) => void;
}) {
  const [open, setOpen] = useState(!sellerApproved);
  const [sellerName, setSellerName] = useState("");
  const agency = useAgencyDetails();
  const signed = hasAgencyDetails(agency);
  const e = output.sellerEmail;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold">Seller approval email</h3>
          <p className="text-xs text-muted-foreground">
            Ask the seller to check the draft particulars before they go live (TPO Code).
          </p>
        </div>
        {sellerApproved && (
          <Badge className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Seller approved
          </Badge>
        )}
      </div>

      {sellerApproved && !open ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-3 min-h-11 px-0 text-sm sm:min-h-9"
          onClick={() => setOpen(true)}
        >
          Show the approval email
        </Button>
      ) : !e ? (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {output.emailBlast
              ? "This listing was saved before seller approval emails existed."
              : "The seller email didn't generate this time."}
          </p>
          <GenerateMarketingButton
            generationId={generationId}
            label="Generate seller email — free, doesn't use a listing"
            onGenerated={onGenerated}
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
          <p className="mt-1 break-words text-sm font-medium">{e.subject}</p>
          <div className="mt-4 max-w-sm space-y-1.5">
            <Label htmlFor={`seller-name-${generationId ?? "new"}`} className="text-xs text-muted-foreground">
              Seller name (replaces [Seller name] when you copy)
            </Label>
            <Input
              id={`seller-name-${generationId ?? "new"}`}
              value={sellerName}
              onChange={(ev) => setSellerName(ev.target.value)}
              placeholder="Mrs Patel"
              autoComplete="off"
            />
          </div>
          <div className="mt-3 space-y-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
            {e.body}
          </div>
          <Button
            type="button"
            className="mt-4 min-h-11 sm:min-h-10"
            onClick={() =>
              copyToast(
                withAgency(
                  formatSellerEmail(e, {
                    sellerName,
                    listing: withMaterialInfo(output.listing, materialInfo),
                    keyFeatures: output.keyFeatures,
                  }),
                  agency,
                ),
                !sellerName.trim()
                  ? "Email copied — no seller name yet, so replace [Seller name] before sending."
                  : signed
                    ? "Email copied with the draft details and your sign-off — ready to send."
                    : "Email copied with the draft details — add your sign-off, then send.",
              )
            }
          >
            <Copy className="mr-2 h-4 w-4" /> Copy email
          </Button>
        </>
      )}
    </Card>
  );
}
