import { LOGO_URL, APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  withByline = false,
}: {
  className?: string;
  showText?: boolean;
  withByline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 sm:gap-2.5", className)}>
      <img
        src={LOGO_URL}
        alt={`${APP_NAME} logo`}
        className="h-8 w-8 rounded-xl object-cover ring-1 ring-primary/40 sm:h-9 sm:w-9"
      />
      {showText && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            {APP_NAME}
          </span>
          {withByline && (
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
              by CopyByMonk
            </span>
          )}
        </span>
      )}
    </span>
  );
}
