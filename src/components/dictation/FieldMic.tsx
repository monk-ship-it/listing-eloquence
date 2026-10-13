import { Loader2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DictateMode } from "@/lib/listing-fields";
import { useDictationContext, type DictationSink } from "./DictationProvider";

/** Per-field microphone. Uses the page's shared dictation engine. */
export function FieldMic({
  fieldKey,
  label,
  sink,
  mode,
  className,
  disabled,
}: {
  fieldKey: string;
  label: string;
  sink: DictationSink;
  mode: DictateMode;
  className?: string;
  disabled?: boolean;
}) {
  const d = useDictationContext();
  if (!d.supported) return null;
  const active = d.activeKey === fieldKey;
  const listening = active && d.status === "listening";
  const processing = active && !listening && d.activeKey !== null;
  const otherBusy = d.activeKey !== null && !active;

  return (
    <button
      type="button"
      onClick={() => d.toggle(fieldKey, label, sink, mode)}
      disabled={disabled || otherBusy || processing}
      aria-label={
        listening
          ? `Stop dictating ${label}`
          : processing
            ? d.status === "processing"
              ? "Transcribing…"
              : "Starting microphone…"
            : `Dictate ${label}`
      }
      aria-pressed={listening}
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9",
        listening && "text-destructive hover:text-destructive",
        className,
      )}
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : listening ? (
        <span className="h-3 w-3 animate-pulse rounded-[2px] bg-destructive" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}

/** "Listening…" / "Transcribing…" text shown next to a field's label. */
export function FieldDictationStatus({ fieldKey }: { fieldKey: string }) {
  const d = useDictationContext();
  if (d.activeKey !== fieldKey) return null;
  if (d.status !== "listening" && d.status !== "processing") return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-destructive" aria-live="polite">
      {d.status === "listening" ? (
        <>
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> Listening…
        </>
      ) : (
        <span className="text-muted-foreground">Transcribing…</span>
      )}
    </span>
  );
}
