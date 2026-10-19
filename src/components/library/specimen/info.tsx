import { ScoreFace } from "@/components/library/evaluation/badges";
import { Property } from "@/components/library/shared/field";
import {
  SCALE,
  STATUS_LABEL,
  VERDICT_LABEL,
  criteriaFor,
  evaluationStatus,
  overallScore,
  scaleLabel,
} from "@/lib/library/criteria";
import { folderPath } from "@/lib/library/folders";
import { formatDate } from "@/lib/library/format";
import { useLibrary } from "@/lib/library/store";
import type { Asset } from "@/lib/library/types";

/** Facts and the evaluation at a glance; read-only, to compare panes side by side. */
export function SpecimenInfo({ asset }: { asset: Asset }) {
  const folders = useLibrary((state) => state.folders);
  const score = overallScore(asset);

  return (
    <div className="max-w-lg space-y-8 font-sans">
      <section aria-label="Avaliação">
        <h3 className="mb-2 text-xs font-medium opacity-60">Avaliação</h3>
        <div className="mb-3 flex items-center gap-3">
          <ScoreFace value={score} size={32} className="text-current" />
          <span className="text-2xl leading-none font-semibold">{scaleLabel(score)}</span>
          <span className="text-sm opacity-70">
            {VERDICT_LABEL[asset.verdict]}, {STATUS_LABEL[evaluationStatus(asset)].toLowerCase()}
          </span>
        </div>
        <ul className="space-y-2">
          {criteriaFor(asset.kind).map((criterion) => {
            const entry = asset.criteria[criterion.id];
            return (
              <li key={criterion.id} className="text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex-1">{criterion.label}</span>
                  <ScoreFace value={entry?.value ?? null} className="text-current" />
                  <span className="w-20 text-xs opacity-70">
                    {entry?.value ? SCALE[entry.value] : "Sem nota"}
                  </span>
                </div>
                {entry?.note ? <p className="mt-0.5 text-xs opacity-70">{entry.note}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>
      {asset.notes ? (
        <section aria-label="Notas">
          <h3 className="mb-2 text-xs font-medium opacity-60">Notas</h3>
          <p className="text-sm leading-relaxed">{asset.notes}</p>
        </section>
      ) : null}
      <section
        aria-label="Propriedades"
        className="[&_div]:border-current/10 [&_span:first-child]:text-current/60"
      >
        <h3 className="mb-1 text-xs font-medium opacity-60">Propriedades</h3>
        <Property label="Estilo">{asset.style || "—"}</Property>
        {asset.kind === "font" ? <Property label="Pesos">{asset.weights || "—"}</Property> : null}
        <Property label="Tamanho">{asset.sizeLabel || "—"}</Property>
        <Property label="Formato">{asset.format || "—"}</Property>
        <Property label="Licença">{asset.license || "—"}</Property>
        <Property label="Pastas">
          {asset.folderIds.map((id) => folderPath(folders, id).join(" / ")).join(", ") || "—"}
        </Property>
        <Property label="Tags">{asset.tags.join(", ") || "—"}</Property>
        <Property label="Modificado">{formatDate(asset.modifiedAt)}</Property>
      </section>
    </div>
  );
}
