import { LayoutGrid, X } from "lucide-react";
import { VerdictDot } from "@/components/library/evaluation/badges";
import { withVerdict } from "@/components/library/evaluation/tones";
import { viewTitle } from "@/components/library/shared/labels";
import { activate, close, pin } from "@/lib/library/commands";
import { useAsset } from "@/lib/library/hooks";
import { useLibrary } from "@/lib/library/store";
import { useWorkspace } from "@/lib/library/workspace";
import { assetIdOf, type Pane, type TabKey } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";

export function TabStrip({ pane, focused }: { pane: Pane; focused: boolean }) {
  const lonely = pane.tabs.length === 1 && pane.tabs[0] === "collection";
  const onlyPane = useWorkspace((state) => Object.keys(state.panes).length === 1);
  return (
    <div
      role="tablist"
      aria-label="Abas do painel"
      className="flex min-w-0 flex-1 items-stretch overflow-x-auto"
    >
      {pane.tabs.map((key) => (
        <Tab
          key={key}
          paneId={pane.id}
          tabKey={key}
          active={pane.active === key}
          focused={focused}
          preview={pane.preview === key}
          closable={!(lonely && onlyPane)}
        />
      ))}
    </div>
  );
}

function Tab({
  paneId,
  tabKey,
  active,
  focused,
  preview,
  closable,
}: {
  paneId: string;
  tabKey: TabKey;
  active: boolean;
  focused: boolean;
  preview: boolean;
  closable: boolean;
}) {
  const assetId = assetIdOf(tabKey);
  const asset = useAsset(assetId);
  const kind = useLibrary((state) => state.kind);
  const view = useLibrary((state) => state.nav[state.kind].view);
  const folders = useLibrary((state) => state.folders);
  const setDrag = useWorkspace((state) => state.setDrag);
  const label = assetId ? (asset?.name ?? "Item removido") : viewTitle(view, folders, kind);

  return (
    <div
      className={cn(
        "group relative flex max-w-56 min-w-0 shrink-0 items-center border-r border-border",
        active ? "bg-bg text-fg" : "text-muted hover:bg-elevated/50 hover:text-fg",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className={cn("absolute inset-x-0 top-0 h-0.5", focused ? "bg-proof" : "bg-subtle")}
        />
      ) : null}
      <button
        type="button"
        role="tab"
        aria-selected={active}
        aria-label={asset ? withVerdict(label, asset.verdict) : label}
        title={preview ? `${label} (prévia: clique duas vezes para fixar)` : label}
        draggable
        onDragStart={(event) => {
          if (assetId) event.dataTransfer.setData("text/asset-id", assetId);
          else event.dataTransfer.setData("text/plain", label);
          event.dataTransfer.effectAllowed = "move";
          setDrag({ type: "tab", fromPaneId: paneId, key: tabKey });
        }}
        onDragEnd={() => setDrag(null)}
        onClick={() => activate(paneId, tabKey)}
        onDoubleClick={() => pin(paneId, tabKey)}
        onAuxClick={(event) => {
          if (event.button === 1 && closable) close(paneId, tabKey);
        }}
        className="flex h-9 min-w-0 items-center gap-2 pr-1 pl-3 text-sm"
      >
        {assetId ? (
          <VerdictDot verdict={asset?.verdict ?? ""} />
        ) : (
          <LayoutGrid className="size-3.5 shrink-0 text-subtle" />
        )}
        <span className={cn("truncate", preview && "italic")}>{label}</span>
      </button>
      {closable ? (
        <button
          type="button"
          aria-label={`Fechar ${label}`}
          onClick={() => close(paneId, tabKey)}
          className={cn(
            "mr-1.5 grid size-5 shrink-0 place-items-center rounded text-subtle hover:bg-elevated hover:text-fg",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <span className="w-2" />
      )}
    </div>
  );
}
