import {
  STATUS_LABEL,
  VERDICT_LABEL,
  evaluationStatus,
  overallScore,
  roundedScore,
  scaleLabel,
  scoredCount,
} from "@/lib/library/criteria";
import { FaceIcon } from "@/components/ui/face-icon";
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

/** The face of a rounded mean or score, in the proof blue. */
export function ScoreFace({
  value,
  size = 16,
  className,
}: {
  value: number | null;
  size?: number;
  className?: string;
}) {
  const level = roundedScore(value);
  if (level === null) return null;
  return <FaceIcon level={level} size={size} className={cn("shrink-0 text-proof", className)} />;
}

/**
 * The face of the weighted score with its word ("Bom"), or a quiet "Sem nota".
 * `compact` drops the word where room is short; the name stays for assistive tech.
 */
export function ScoreBadge({
  asset,
  compact = false,
  className,
}: {
  asset: Asset;
  compact?: boolean;
  className?: string;
}) {
  const score = overallScore(asset);
  const { scored, total } = scoredCount(asset);
  if (score === null) return <span className={cn("text-xs text-subtle", className)}>Sem nota</span>;
  const label = scaleLabel(score);
  const detail = `${label}, média ponderada de ${scored} de ${total} critérios`;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={detail}
      {...(compact ? { role: "img", "aria-label": detail } : {})}
    >
      <ScoreFace value={score} />
      {compact ? null : <span className="text-xs font-medium whitespace-nowrap">{label}</span>}
    </span>
  );
}

export function StatusText({ asset, className }: { asset: Asset; className?: string }) {
  const status = evaluationStatus(asset);
  return (
    <span className={cn("text-xs", STATUS_TEXT[status], className)}>{STATUS_LABEL[status]}</span>
  );
}
