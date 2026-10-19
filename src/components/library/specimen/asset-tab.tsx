import { ArrowLeft, ArrowRight } from "lucide-react";
import { VerdictBadge } from "@/components/library/evaluation/badges";
import { InspectorBody } from "@/components/library/inspector/inspector";
import { IconButton } from "@/components/ui/icon-button";
import { navigate } from "@/lib/library/commands";
import { useAsset, useCollection, usePane } from "@/lib/library/hooks";
import { useWorkspace } from "@/lib/library/workspace";
import { FontSpecimen } from "./font-specimen";
import { IconSpecimen } from "./icon-specimen";

export function AssetTab({ paneId, assetId }: { paneId: string; assetId: string }) {
  const asset = useAsset(assetId);
  const pane = usePane(paneId);
  const updateSettings = useWorkspace((state) => state.updateSettings);
  const { list } = useCollection(asset?.kind ?? "font");

  if (!asset || !pane) {
    return (
      <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
        Este item não está mais na biblioteca.
      </div>
    );
  }

  const index = list.findIndex((item) => item.id === asset.id);
  const onSettings = (patch: Parameters<typeof updateSettings>[1]) => updateSettings(paneId, patch);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <h2 className="min-w-0 truncate text-sm font-medium">{asset.name}</h2>
        <VerdictBadge verdict={asset.verdict} />
        <span className="ml-auto text-xs text-muted tabular-nums">
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
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-border min-[860px]:hidden">
          <InspectorBody asset={asset} />
        </div>
        {asset.kind === "font" ? (
          <FontSpecimen asset={asset} settings={pane.settings} onSettings={onSettings} />
        ) : (
          <IconSpecimen asset={asset} settings={pane.settings} onSettings={onSettings} />
        )}
      </div>
    </div>
  );
}
