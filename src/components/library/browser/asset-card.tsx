import type { DragEvent, MouseEvent, ReactNode } from "react";
import { Check } from "lucide-react";
import { ScoreBadge, VerdictBadge } from "@/components/library/evaluation/badges";
import { withVerdict } from "@/components/library/evaluation/tones";
import { Glyph } from "@/components/library/icons";
import { overallScore } from "@/lib/library/criteria";
import { previewText } from "@/lib/library/preview";
import type { Asset, CollectionPreview } from "@/lib/library/types";
import { cn } from "@/lib/utils";

const LIGHT_INK = "#eceef2"; // --color-fg

/** Fades a one-line specimen out at the right edge instead of cutting it with an ellipsis. */
const FADE_RIGHT = "[mask-image:linear-gradient(to_right,black_85%,transparent)]";

export type CardHandlers = {
  onOpen: (event: MouseEvent) => void;
  onPin: () => void;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
};

type ItemProps = {
  asset: Asset;
  preview: CollectionPreview;
  selected: boolean;
  /** Something is selected, so every checkbox shows. */
  selecting: boolean;
  onSelect: () => void;
  handlers: CardHandlers;
};

/** A collection card: name and facts on top, then the item drawn large with the shared preview. */
export function AssetCard({ asset, preview, selected, selecting, onSelect, handlers }: ItemProps) {
  return (
    <div
      className={cn(
        "group relative flex rounded-lg border bg-surface transition-colors",
        selected ? "border-proof" : "border-border hover:border-muted",
      )}
    >
      <OpenButton asset={asset} handlers={handlers} className="flex flex-col gap-5 p-4 pb-5">
        <Heading asset={asset} stacked />
        <Specimen asset={asset} preview={preview} wrap />
      </OpenButton>
      <SelectBox
        asset={asset}
        selected={selected}
        selecting={selecting}
        onSelect={onSelect}
        className="absolute right-3 bottom-3"
      />
    </div>
  );
}

/** A collection row: one line of facts, then one line of specimen that fades at the edge. */
export function AssetRow({ asset, preview, selected, selecting, onSelect, handlers }: ItemProps) {
  return (
    <div
      className={cn(
        "group relative flex border-b border-border transition-colors",
        selected ? "bg-proof/5" : "hover:bg-surface",
      )}
    >
      <OpenButton asset={asset} handlers={handlers} className="flex flex-col gap-3 py-5 pr-4 pl-12">
        <Heading asset={asset} />
        <Specimen asset={asset} preview={preview} />
      </OpenButton>
      <SelectBox
        asset={asset}
        selected={selected}
        selecting={selecting}
        onSelect={onSelect}
        className="absolute top-5 left-4"
      />
    </div>
  );
}

function OpenButton({
  asset,
  handlers,
  className,
  children,
}: {
  asset: Asset;
  handlers: CardHandlers;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={handlers.onDragStart}
      onDragEnd={handlers.onDragEnd}
      onClick={handlers.onOpen}
      onDoubleClick={handlers.onPin}
      aria-label={withVerdict(asset.name, asset.verdict)}
      className={cn("w-full min-w-0 text-left", className)}
    >
      {children}
    </button>
  );
}

/** Name, the evaluation when there is one, and the two facts that tell items apart. */
function Heading({ asset, stacked = false }: { asset: Asset; stacked?: boolean }) {
  const facts = [asset.style, asset.kind === "font" ? asset.weights : asset.sizeLabel].filter(
    Boolean,
  );
  const evaluation = (
    <span className="flex shrink-0 items-center gap-2">
      {overallScore(asset) !== null ? <ScoreBadge asset={asset} compact /> : null}
      <VerdictBadge verdict={asset.verdict} />
    </span>
  );
  const factList = facts.length ? (
    <span className="flex min-w-0 gap-3 text-xs text-muted">
      {facts.map((fact) => (
        <span key={fact} className="truncate">
          {fact}
        </span>
      ))}
    </span>
  ) : null;

  if (stacked) {
    return (
      <span className="flex min-h-10 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{asset.name}</span>
          {evaluation}
        </span>
        {factList}
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-4">
      <span className="truncate text-sm font-medium">{asset.name}</span>
      {factList}
      <span className="ml-auto">{evaluation}</span>
    </span>
  );
}

/** The item itself: the preview text in the font, or the set's sample icons. */
function Specimen({
  asset,
  preview,
  wrap = false,
}: {
  asset: Asset;
  preview: CollectionPreview;
  wrap?: boolean;
}) {
  if (asset.kind === "font") {
    return (
      <span
        aria-hidden
        className={cn(
          "block leading-[1.15] text-fg",
          wrap ? "line-clamp-3 break-words" : cn("overflow-hidden whitespace-nowrap", FADE_RIGHT),
        )}
        style={{ fontFamily: asset.family, fontSize: preview.size }}
      >
        {previewText(preview)}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn("flex gap-4", wrap ? "flex-wrap" : cn("overflow-hidden", FADE_RIGHT))}
      style={{ minHeight: preview.size }}
    >
      {asset.samples.map((name) => (
        <span key={name} className="shrink-0">
          <Glyph prefix={asset.iconKey} name={name} size={preview.size} color={LIGHT_INK} />
        </span>
      ))}
    </span>
  );
}

function SelectBox({
  asset,
  selected,
  selecting,
  onSelect,
  className,
}: {
  asset: Asset;
  selected: boolean;
  selecting: boolean;
  onSelect: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Selecionar ${asset.name} para comparar`}
      onClick={onSelect}
      className={cn(
        "grid size-6 place-items-center rounded-md border transition-opacity",
        selected
          ? "border-proof bg-proof text-proof-fg"
          : "border-border bg-surface/90 text-transparent hover:text-muted",
        selecting || selected
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
        className,
      )}
    >
      <Check className="size-3.5" />
    </button>
  );
}
