import { ArrowLeft, ArrowRight, PanelRightOpen } from "lucide-react";
import { ScoreBadge, VerdictBadge } from "@/components/library/evaluation/badges";
import { groundOf } from "@/components/library/shared/grounds";
import { IconButton } from "@/components/ui/icon-button";
import { navigate } from "@/lib/library/commands";
import { useAsset, useCollection, usePane } from "@/lib/library/hooks";
import { useWorkspace } from "@/lib/library/workspace";
import { FONT_SIZE_RANGE, ICON_SIZE_RANGE } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { GroundPicker, SizeSlider } from "./controls";
import { FontProof } from "./font-specimen";
import { IconProof } from "./icon-specimen";

export function AssetTab({ paneId, assetId }: { paneId: string; assetId: string }) {
  const asset = useAsset(assetId);
  const pane = usePane(paneId);
  const updateSettings = useWorkspace((state) => state.updateSettings);
  const inspectorShown = useWorkspace((state) =>
    state.canSplit ? state.inspectorOpen : state.inspectorDrawer,
  );
  const setInspector = useWorkspace((state) => state.setInspector);
  const { list } = useCollection(asset?.kind ?? "font");

  if (!asset || !pane) {
    return (
      <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
        Este item não está mais na biblioteca.
      </div>
    );
  }

  const { settings } = pane;
  const index = list.findIndex((item) => item.id === asset.id);
  const onSettings = (patch: Parameters<typeof updateSettings>[1]) => updateSettings(paneId, patch);
  const ground = groundOf(settings.ground);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium @sm:flex-none">{asset.name}</h2>
        <VerdictBadge verdict={asset.verdict} className="hidden @xs:inline-flex" />
        <ScoreBadge asset={asset} className="hidden @md:inline-flex" />
        <span className="ml-auto hidden text-xs whitespace-nowrap text-muted tabular-nums @sm:inline">
          {index >= 0 ? `${index + 1} de ${list.length}` : "Fora da lista atual"}
        </span>
        <IconButton
          label="Item anterior"
          shortcut="←"
          size="sm"
          disabled={index <= 0}
          onClick={() => navigate(paneId, asset.id, -1)}
        >
          <ArrowLeft className="size-4" />
        </IconButton>
        <IconButton
          label="Próximo item"
          shortcut="→"
          size="sm"
          disabled={index < 0 || index >= list.length - 1}
          onClick={() => navigate(paneId, asset.id, 1)}
        >
          <ArrowRight className="size-4" />
        </IconButton>
        <button
          type="button"
          aria-pressed={inspectorShown}
          onClick={() => setInspector(!inspectorShown)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm transition-colors",
            inspectorShown ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
          )}
        >
          <PanelRightOpen className="size-4" />
          <span className="hidden @lg:inline">Avaliar</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-3 py-1.5">
        {asset.kind === "font" ? (
          <SizeSlider
            label="Corpo"
            value={settings.fontSize}
            min={FONT_SIZE_RANGE.min}
            max={FONT_SIZE_RANGE.max}
            onChange={(fontSize) => onSettings({ fontSize })}
          />
        ) : (
          <SizeSlider
            label="Tamanho"
            value={settings.iconSize}
            min={ICON_SIZE_RANGE.min}
            max={ICON_SIZE_RANGE.max}
            step={4}
            onChange={(iconSize) => onSettings({ iconSize })}
          />
        )}
        <div className="ml-auto">
          <GroundPicker value={settings.ground} onChange={(next) => onSettings({ ground: next })} />
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 overflow-y-auto", ground.surface)}>
        <div className="px-5 py-8 @lg:px-10">
          {asset.kind === "font" ? (
            <FontProof asset={asset} paneId={paneId} settings={settings} onSettings={onSettings} />
          ) : (
            <IconProof asset={asset} paneId={paneId} settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
}
