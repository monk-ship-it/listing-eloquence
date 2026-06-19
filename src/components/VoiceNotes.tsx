import { Mic, Trash2, Globe } from "lucide-react";
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
import { useDictation } from "@/hooks/useDictation";
import { useDictationSettings } from "@/hooks/useDictationSettings";

interface VoiceNotesProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Single dedicated voice-notes section. Replaces the per-field mic buttons:
 * dictation transcripts are appended to one large editable textarea.
 */
export function VoiceNotes({ value, onChange }: VoiceNotesProps) {
  const { lang, setLang, languages } = useDictationSettings();

  const append = (text: string) =>
    onChange(value.trim() ? `${value.trim()} ${text}` : text);

  const { status, error, supported, toggle } = useDictation(append, lang);

  const statusLine = !supported
    ? "Voice dictation isn’t supported in this browser — type or paste your notes instead."
    : status === "listening"
      ? "Listening… speak naturally."
      : status === "error"
        ? error || "Microphone access was blocked. Please allow access or type your notes manually."
        : value.trim()
          ? "Dictation stopped. You can edit the notes before generating."
          : "Ready to dictate.";

  const isError = status === "error";

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
        <Label htmlFor="voice-notes" className="text-xs text-muted-foreground">
          Dictated property notes
        </Label>
        <Textarea
          id="voice-notes"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder="Example: Four-bedroom semi-detached house on Brenzett Close, open-plan kitchen, heated marble flooring, log burner in the main living room, two bathrooms, leasehold, guide price…"
          className="min-h-[7.5rem] resize-y text-base"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {supported && (
            <Button
              type="button"
              variant={status === "listening" ? "destructive" : "default"}
              onClick={toggle}
              className="gap-2"
            >
              {status === "listening" ? (
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
            <Button type="button" variant="outline" onClick={() => onChange("")} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear voice notes
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
            <SelectTrigger className="h-8 w-[10rem] text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
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
    </div>
  );
}
