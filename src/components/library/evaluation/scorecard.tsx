import {
  SCALE,
  VERDICTS,
  criteriaFor,
  overallScore,
  scaleLabel,
  scoredCount,
} from "@/lib/library/criteria";
import { useLibrary } from "@/lib/library/store";
import type { Asset } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { ScoreFace, StatusText } from "./badges";
import { VERDICT_SOLID } from "./tones";

/**
 * The overall score, a read-only line per criterion and the verdict. Criteria are
 * scored in the specimen sections, next to what they judge, not here.
 */
export function Scorecard({ asset }: { asset: Asset }) {
  const updateAsset = useLibrary((state) => state.updateAsset);
  const score = overallScore(asset);
  const { scored, total } = scoredCount(asset);

  return (
    <div className="space-y-5">
      <section
        aria-label="Nota geral"
        title="A carinha da média dos critérios avaliados, ponderada pelo peso de cada um"
        className="flex items-center gap-3"
      >
        {score === null ? (
          <span
            aria-hidden
            className="size-9 shrink-0 rounded-full border border-dashed border-border"
          />
        ) : (
          <ScoreFace value={score} size={36} />
        )}
        <div>
          <p className="text-xl leading-none font-semibold tracking-tight">{scaleLabel(score)}</p>
          <p className="mt-1.5 text-xs text-muted tabular-nums">
            {score === null ? "Dê nota nas seções da prova" : `${scored} de ${total} critérios`}
          </p>
        </div>
      </section>

      <ul aria-label="Critérios" className="space-y-1.5">
        {criteriaFor(asset.kind).map((criterion) => {
          const value = asset.criteria[criterion.id]?.value ?? null;
          return (
            <li key={criterion.id} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate text-muted">{criterion.label}</span>
              <ScoreFace value={value} size={14} />
              <span className={cn("w-16 text-right", value ? "text-fg" : "text-subtle")}>
                {value ? SCALE[value] : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      <section aria-label="Veredito">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Veredito</p>
          {asset.verdict ? null : <StatusText asset={asset} />}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {VERDICTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={asset.verdict === entry.id}
              onClick={() =>
                updateAsset(asset.id, { verdict: asset.verdict === entry.id ? "" : entry.id })
              }
              className={cn(
                "h-8 rounded-md text-sm transition-colors",
                asset.verdict === entry.id
                  ? VERDICT_SOLID[entry.id]
                  : "bg-elevated text-muted hover:text-fg",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
