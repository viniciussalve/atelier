import type { ReactNode } from "react";
import { ScoreControl } from "@/components/library/evaluation/score-control";
import { score } from "@/lib/library/commands";
import { criteriaForSection } from "@/lib/library/criteria";
import { useLibrary } from "@/lib/library/store";
import type { Asset, SpecimenSection as SectionId } from "@/lib/library/types";

/**
 * One part of a specimen. When a criterion is judged on this part, its score
 * opens the section, so it can be rated while looking at it; otherwise the title does.
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
      {/* A judged part opens with its scores: the criterion names what to look at, so no title repeats it. */}
      <div
        className="flex min-h-8 flex-wrap items-center gap-2"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {criteria.length ? (
          criteria.map((criterion) => (
            <ScoreControl
              key={criterion.id}
              onPaper={onPaper}
              criterion={criterion}
              entry={asset.criteria[criterion.id]}
              onScore={(value) => score(paneId, asset.id, criterion.id, value)}
              onNote={(note) => setCriterionNote(asset.id, criterion.id, note)}
            />
          ))
        ) : (
          <h3 className="text-xs font-medium opacity-60">{title}</h3>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** One small screen of a specimen: its name in the app's own type, then the screen in a frame. */
export function SpecimenScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 font-sans text-xs font-normal opacity-60">{title}</figcaption>
      <div className="overflow-hidden rounded-lg border border-current/15">{children}</div>
    </figure>
  );
}
