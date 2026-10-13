import { Mic, Trash2, Globe, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDictationContext, type DictationSink } from "@/components/dictation/DictationProvider";
import type { LanguageCode } from "@/hooks/useDictationSettings";
import { FIELD_BY_KEY } from "@/lib/listing-fields";

interface VoiceNotesProps {
  value: string;
  onChange: (value: string) => void;
  /** Reads/writes the latest value synchronously (used by dictation). */
  sink: DictationSink;
  onFill: () => void;
  filling: boolean;
  disabled?: boolean;
}

const DEF = FIELD_BY_KEY.voiceNotes;

/**
 * Voice-notes section: large Start/Stop dictation button (shared page
 * engine, appends with a space) plus "Fill the form from these notes".
 */
export function VoiceNotes({ value, onChange, sink, onFill, filling, disabled }: VoiceNotesProps) {
  const d = useDictationContext();
  const mine = d.activeKey === "voiceNotes";
  const status = mine ? d.status : "idle";
  const otherBusy = d.activeKey !== null && !mine;
  const justFinished = d.lastFinishedKey === "voiceNotes" && value.trim().length >= 10;

  const statusLine = !d.supported
    ? "Voice dictation isn’t supported in this browser — type or paste your notes instead."
    : status === "listening"
      ? "Listening… speak naturally."
      : status === "processing"
        ? "Transcribing…"
        : d.errorKey === "voiceNotes" && d.error
          ? d.error
          : value.trim()
            ? "Dictation stopped. You can edit the notes before generating."
            : "Ready to dictate.";

  const isError = !mine && d.errorKey === "voiceNotes" && !!d.error;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold">Voice notes</h2>
        <p className="text-sm text-muted-foreground">
          Speak the property details naturally, then edit before generating. Quill will use these
          notes when generating the listing pack.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="field-voiceNotes" className="text-xs text-muted-foreground">
          {DEF.label}
        </Label>
        <Textarea
          id="field-voiceNotes"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={DEF.rows}
          placeholder={DEF.placeholder}
          className="min-h-[7.5rem] resize-y text-base"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {d.supported && (
            <Button
              type="button"
              variant={status === "listening" ? "destructive" : "default"}
              onClick={() => d.toggle("voiceNotes", DEF.label, sink, DEF.dictateMode)}
              disabled={disabled || otherBusy || (mine && status !== "listening")}
              className="min-h-11 gap-2 sm:min-h-10"
              aria-label={status === "listening" ? "Stop dictation" : "Dictate voice notes"}
            >
              {mine && status !== "listening" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status === "processing" ? "Transcribing…" : "Starting…"}
                </>
              ) : status === "listening" ? (
                <>
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
                  Stop dictation
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start dictation
                </>
              )}
            </Button>
          )}
          {value.trim() && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange("")}
              disabled={disabled || mine}
              className="min-h-11 gap-2 sm:min-h-10"
            >
              <Trash2 className="h-4 w-4" />
              Clear voice notes
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Select value={d.lang} onValueChange={(v) => d.setLang(v as LanguageCode)}>
            <SelectTrigger className="h-11 w-[10rem] text-xs sm:h-8" aria-label="Dictation language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {d.languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p
        className={`mt-3 flex items-center gap-1.5 text-xs ${
          isError ? "text-destructive" : "text-muted-foreground"
        }`}
        role="status"
        aria-live="polite"
      >
        {status === "listening" && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        )}
        {statusLine}
      </p>

      <div className="mt-4 border-t border-border/60 pt-4">
        {justFinished && !filling && (
          <p className="mb-2 text-xs font-medium text-primary">
            Got it — want Quill to fill the form from what you just said?
          </p>
        )}
        <Button
          type="button"
          variant={justFinished ? "default" : "outline"}
          onClick={onFill}
          disabled={disabled || filling || d.activeKey !== null || value.trim().length < 10}
          className="min-h-11 w-full gap-2 sm:min-h-10 sm:w-auto"
        >
          {filling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your notes…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" /> Fill the form from these notes
            </>
          )}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Free — doesn’t use a listing. Only fills what you said; you check everything before
          generating.
        </p>
      </div>
    </div>
  );
}
