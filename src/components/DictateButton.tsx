import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDictation } from "@/hooks/useDictation";
import { cn } from "@/lib/utils";

interface DictateButtonProps {
  /** Receives the transcribed text when dictation finishes. */
  onResult: (text: string) => void;
  className?: string;
  label?: string;
}

/** Compact microphone button that dictates speech into a field. */
export function DictateButton({ onResult, className, label }: DictateButtonProps) {
  const { recording, busy, toggle } = useDictation(onResult);

  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "outline"}
      size={label ? "sm" : "icon"}
      onClick={toggle}
      disabled={busy}
      aria-label={recording ? "Stop dictation" : "Dictate"}
      className={cn(label ? "h-8" : "h-8 w-8", className)}
    >
      {busy ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", label && "mr-1.5")} />
      ) : recording ? (
        <Square className={cn("h-4 w-4", label && "mr-1.5")} />
      ) : (
        <Mic className={cn("h-4 w-4", label && "mr-1.5")} />
      )}
      {label ? (busy ? "Transcribing…" : recording ? "Stop" : label) : null}
    </Button>
  );
}
