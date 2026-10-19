import { PanelLeft } from "lucide-react";
import { Collection } from "@/components/library/browser/collection";
import { AssetTab } from "@/components/library/specimen/asset-tab";
import { IconButton } from "@/components/ui/icon-button";
import { focus } from "@/lib/library/commands";
import { usePane } from "@/lib/library/hooks";
import { useWorkspace } from "@/lib/library/workspace";
import { assetIdOf } from "@/lib/library/workspace-model";
import { TabStrip } from "./tab-strip";

export function PaneView({ paneId, onOpenNav }: { paneId: string; onOpenNav: () => void }) {
  const pane = usePane(paneId);
  const focused = useWorkspace((state) => state.activePaneId === paneId);
  if (!pane) return null;
  const assetId = assetIdOf(pane.active);

  return (
    <section
      aria-label="Painel"
      className="@container flex h-full min-h-0 min-w-0 flex-col bg-bg"
      onPointerDownCapture={() => focus(paneId)}
      onFocusCapture={() => focus(paneId)}
    >
      <header className="flex h-9 shrink-0 items-stretch border-b border-border bg-surface">
        <div className="flex items-center border-r border-border px-1 min-[860px]:hidden">
          <IconButton label="Abrir a barra" size="sm" onClick={onOpenNav}>
            <PanelLeft className="size-4" />
          </IconButton>
        </div>
        <TabStrip pane={pane} focused={focused} />
      </header>
      <div className="min-h-0 flex-1">
        {assetId ? <AssetTab paneId={paneId} assetId={assetId} /> : <Collection paneId={paneId} />}
      </div>
    </section>
  );
}
