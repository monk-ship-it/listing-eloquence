import { Mic, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDictation } from "@/hooks/useDictation";
import { cn } from "@/lib/utils";

interface DictateButtonProps {
  /** Receives the transcribed text when dictation finishes. */
  onResult: (text: string) => void;
  className?: string;
  /** Speech recognition language code. Defaults to en-GB. */
  lang?: string;
}

/**
 * Microphone control with inline transcription status:
 * idle → tap to record, listening → live indicator + stop, processing →
 * spinner + cancel, error → message.
 */
export function DictateButton({ onResult, className, lang }: DictateButtonProps) {
  const { status, error, supported, toggle, stop } = useDictation(onResult, lang);

  if (!supported) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {status === "listening" && (
        <span className="flex items-center gap-1 text-xs font-medium text-destructive">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Listening…
        </span>
      )}
      {status === "error" && error && (
        <span className="flex items-center gap-1 text-xs font-medium text-destructive" title={error}>
          <AlertCircle className="h-3 w-3" />
          <span className="max-w-[8rem] truncate">{error}</span>
        </span>
      )}

      {status === "listening" ? (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={stop}
          aria-label="Stop dictation"
          className="h-8 w-8"
        >
          {/* square stop icon */}
          <span className="h-3 w-3 rounded-[2px] bg-current" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggle}
          aria-label="Dictate"
          className="h-8 w-8"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
