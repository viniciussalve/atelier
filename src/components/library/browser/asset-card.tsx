import type { DragEvent, MouseEvent } from "react";
import { Check } from "lucide-react";
import { ScoreBadge, VerdictBadge } from "@/components/library/evaluation/badges";
import { withVerdict } from "@/components/library/evaluation/tones";
import { SetGlyphs } from "@/components/library/icons";
import type { Asset } from "@/lib/library/types";
import { cn } from "@/lib/utils";

const LIGHT_INK = "#eceef2"; // --color-fg

export type CardHandlers = {
  onOpen: (event: MouseEvent) => void;
  onPin: () => void;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
};

/** A collection card: the item drawn in its own face, then name, verdict, score and facts. */
export function AssetCard({
  asset,
  selected,
  selecting,
  onSelect,
  handlers,
}: {
  asset: Asset;
  selected: boolean;
  /** Something is selected, so every checkbox shows. */
  selecting: boolean;
  onSelect: () => void;
  handlers: CardHandlers;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface transition-colors",
        selected ? "border-proof" : "border-border hover:border-muted",
      )}
    >
      <button
        type="button"
        draggable
        onDragStart={handlers.onDragStart}
        onDragEnd={handlers.onDragEnd}
        onClick={handlers.onOpen}
        onDoubleClick={handlers.onPin}
        aria-label={withVerdict(asset.name, asset.verdict)}
        className="block w-full text-left"
      >
        <div className="flex h-32 flex-col justify-end gap-1 bg-elevated px-4 pb-3">
          {asset.kind === "font" ? (
            <>
              <span
                className="truncate text-2xl leading-tight"
                style={{ fontFamily: asset.family }}
              >
                {asset.name}
              </span>
              <span
                className="truncate text-[15px] text-muted"
                style={{ fontFamily: asset.family }}
              >
                Aa Gg Il1 O0 ç ã
              </span>
            </>
          ) : (
            <div className="grid h-full place-items-center">
              <SetGlyphs
                prefix={asset.iconKey}
                names={asset.samples.slice(0, 6)}
                size={22}
                color={LIGHT_INK}
              />
            </div>
          )}
        </div>
        <div className="space-y-1.5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{asset.name}</p>
            <VerdictBadge verdict={asset.verdict} />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <ScoreBadge asset={asset} />
            <span className="ml-auto truncate">{asset.license || asset.style}</span>
          </div>
          {asset.tags.length ? (
            <p className="flex gap-1 overflow-hidden">
              {asset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="truncate rounded bg-elevated px-1.5 py-0.5 text-[11px] text-muted"
                >
                  {tag}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Selecionar ${asset.name} para comparar`}
        onClick={onSelect}
        className={cn(
          "absolute top-2 left-2 grid size-6 place-items-center rounded-md border transition-opacity",
          selected
            ? "border-proof bg-proof text-proof-fg"
            : "border-border bg-surface/90 text-transparent hover:text-muted",
          selecting || selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
        )}
      >
        <Check className="size-3.5" />
      </button>
    </div>
  );
}
