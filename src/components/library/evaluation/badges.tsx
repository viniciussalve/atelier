import { VERDICT_LABEL } from "@/lib/library/criteria";
import type { Verdict } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { VERDICT_CHIP, VERDICT_DOT } from "./tones";

/** Colored dot for a verdict. Decorative: name the control with `withVerdict`. */
export function VerdictDot({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span
      aria-hidden
      title={VERDICT_LABEL[verdict]}
      className={cn("inline-block size-2 shrink-0 rounded-full", VERDICT_DOT[verdict], className)}
    />
  );
}

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  if (!verdict) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium",
        VERDICT_CHIP[verdict],
        className,
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
