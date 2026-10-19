import {
  STATUS_LABEL,
  VERDICT_LABEL,
  evaluationStatus,
  formatScore,
  overallScore,
  scaleLabel,
  scoredCount,
} from "@/lib/library/criteria";
import type { Asset, Verdict } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { STATUS_TEXT, VERDICT_CHIP, VERDICT_DOT } from "./tones";

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

/** Five ticks filled up to the rounded score. */
export function ScoreMeter({ value, className }: { value: number | null; className?: string }) {
  const filled = value === null ? 0 : Math.round(value);
  return (
    <span aria-hidden className={cn("inline-flex items-end gap-px", className)}>
      {[1, 2, 3, 4, 5].map((tick) => (
        <span
          key={tick}
          className={cn("w-1 rounded-[1px]", tick <= filled ? "bg-proof" : "bg-border")}
          style={{ height: 4 + tick * 1.5 }}
        />
      ))}
    </span>
  );
}

/** Weighted score as "4,9" with its meter, or a quiet "Sem nota". */
export function ScoreBadge({ asset, className }: { asset: Asset; className?: string }) {
  const score = overallScore(asset);
  const { scored, total } = scoredCount(asset);
  if (score === null) return <span className={cn("text-xs text-subtle", className)}>Sem nota</span>;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={`${scaleLabel(score)}, média ponderada de ${scored} de ${total} critérios`}
    >
      <span className="text-xs font-medium tabular-nums">{formatScore(score)}</span>
      <ScoreMeter value={score} />
    </span>
  );
}

export function StatusText({ asset, className }: { asset: Asset; className?: string }) {
  const status = evaluationStatus(asset);
  return (
    <span className={cn("text-xs", STATUS_TEXT[status], className)}>{STATUS_LABEL[status]}</span>
  );
}
