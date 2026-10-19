import type { ReactNode } from "react";
import { ScoreControl } from "@/components/library/evaluation/score-control";
import { score } from "@/lib/library/commands";
import { criteriaForSection } from "@/lib/library/criteria";
import { useLibrary } from "@/lib/library/store";
import type { Asset, SpecimenSection as SectionId } from "@/lib/library/types";

/**
 * One part of a specimen. When a criterion is judged on this part, its score
 * sits in the section header, so it can be rated while looking at it.
 */
export function SpecimenSection({
  title,
  section,
  asset,
  paneId,
  onPaper,
  children,
}: {
  title: string;
  section?: SectionId;
  asset: Asset;
  paneId: string;
  onPaper: boolean;
  children: ReactNode;
}) {
  const setCriterionNote = useLibrary((state) => state.setCriterionNote);
  const criteria = section ? criteriaForSection(asset.kind, section) : [];

  return (
    <section aria-label={title} className="scroll-mt-4">
      <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="text-xs font-medium opacity-60">{title}</h3>
        {criteria.length ? (
          <div
            className="ml-auto flex flex-wrap justify-end gap-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {criteria.map((criterion) => (
              <ScoreControl
                key={criterion.id}
                variant="inline"
                onPaper={onPaper}
                criterion={criterion}
                entry={asset.criteria[criterion.id]}
                onScore={(value) => score(paneId, asset.id, criterion.id, value)}
                onNote={(note) => setCriterionNote(asset.id, criterion.id, note)}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
