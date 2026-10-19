import {
  VERDICTS,
  criteriaFor,
  formatScore,
  overallScore,
  scaleLabel,
  scoredCount,
} from "@/lib/library/criteria";
import { scoreInActivePane } from "@/lib/library/commands";
import { useLibrary } from "@/lib/library/store";
import type { Asset } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { ScoreMeter, StatusText } from "./badges";
import { ScoreControl } from "./score-control";
import { VERDICT_SOLID } from "./tones";

/** The whole evaluation of one item: computed score, verdict, and each criterion. */
export function Scorecard({ asset }: { asset: Asset }) {
  const updateAsset = useLibrary((state) => state.updateAsset);
  const setCriterionNote = useLibrary((state) => state.setCriterionNote);
  const score = overallScore(asset);
  const { scored, total } = scoredCount(asset);

  return (
    <div className="space-y-6">
      <section aria-label="Nota geral" className="flex items-end gap-4">
        <div>
          <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
            {formatScore(score)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {score === null ? "Dê nota a um critério para começar" : scaleLabel(score)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <ScoreMeter value={score} className="[&>span]:w-1.5" />
          <p className="mt-2 text-xs text-muted tabular-nums">
            {scored} de {total} critérios
          </p>
        </div>
      </section>
      <p className="-mt-3 text-xs text-subtle">
        Média dos critérios avaliados, ponderada pelo peso de cada um.
      </p>

      <section aria-label="Veredito">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Veredito</p>
          <StatusText asset={asset} />
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

      <section aria-label="Critérios" className="space-y-5">
        <p className="text-xs font-medium text-muted">Critérios</p>
        {criteriaFor(asset.kind).map((criterion) => (
          <ScoreControl
            key={criterion.id}
            variant="full"
            criterion={criterion}
            entry={asset.criteria[criterion.id]}
            onScore={(value) => scoreInActivePane(asset.id, criterion.id, value)}
            onNote={(note) => setCriterionNote(asset.id, criterion.id, note)}
          />
        ))}
      </section>
    </div>
  );
}
