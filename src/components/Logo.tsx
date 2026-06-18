import { LOGO_URL, APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 sm:gap-2.5", className)}>
      <img
        src={LOGO_URL}
        alt={`${APP_NAME} logo`}
        className="h-8 w-8 rounded-full object-cover ring-1 ring-primary/40 sm:h-9 sm:w-9"
      />
      {showText && (
        <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
      )}
    </span>
  );
}
