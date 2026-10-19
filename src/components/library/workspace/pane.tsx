import { Columns2, Equal, MoreHorizontal, PanelLeft, Rows2, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Collection } from "@/components/library/browser/collection";
import { AssetTab } from "@/components/library/specimen/asset-tab";
import { isMacPlatform } from "@/components/library/shared/use-media-query";
import { useTabLabel } from "@/components/library/shared/use-tab-label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { closeWholePane, equalizeAll, focus, split } from "@/lib/library/commands";
import { usePane } from "@/lib/library/hooks";
import { shortcutLabel } from "@/lib/library/shortcuts";
import { useWorkspace } from "@/lib/library/workspace";
import { MAX_PANES, assetIdOf, orderedPanes, type SyncKey } from "@/lib/library/workspace-model";
import { DropOverlay } from "./drop-overlay";
import { TabStrip } from "./tab-strip";

const SYNC_OPTIONS: { key: SyncKey; label: string }[] = [
  { key: "text", label: "Texto de prova" },
  { key: "size", label: "Corpo e tamanho" },
  { key: "ground", label: "Fundo" },
  { key: "tab", label: "Aba da prova" },
  { key: "scroll", label: "Rolagem" },
];

export function PaneView({ paneId, onOpenNav }: { paneId: string; onOpenNav: () => void }) {
  const pane = usePane(paneId);
  const focused = useWorkspace((state) => state.activePaneId === paneId);
  const canSplit = useWorkspace((state) => state.canSplit);
  const paneCount = useWorkspace((state) => Object.keys(state.panes).length);
  if (!pane) return null;
  const assetId = assetIdOf(pane.active);
  const mac = isMacPlatform();
  const full = paneCount >= MAX_PANES;

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
          {!canSplit && paneCount > 1 ? <PaneSwitcher /> : null}
        </div>
        <TabStrip pane={pane} focused={focused} />
        <div className="flex items-center gap-0.5 border-l border-border px-1">
          {canSplit ? (
            <>
              <IconButton
                label={full ? `Até ${MAX_PANES} painéis` : "Dividir à direita"}
                shortcut={full ? undefined : shortcutLabel("splitRight", mac)}
                size="sm"
                disabled={full}
                onClick={() => split(paneId, "right")}
              >
                <Columns2 className="size-4" />
              </IconButton>
              <IconButton
                label={full ? `Até ${MAX_PANES} painéis` : "Dividir abaixo"}
                shortcut={full ? undefined : shortcutLabel("splitDown", mac)}
                size="sm"
                disabled={full}
                onClick={() => split(paneId, "bottom")}
              >
                <Rows2 className="size-4" />
              </IconButton>
            </>
          ) : null}
          <PaneMenu paneId={paneId} paneCount={paneCount} />
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        {assetId ? <AssetTab paneId={paneId} assetId={assetId} /> : <Collection paneId={paneId} />}
        <DropOverlay paneId={paneId} />
      </div>
    </section>
  );
}

function PaneMenu({ paneId, paneCount }: { paneId: string; paneCount: number }) {
  const sync = useWorkspace((state) => state.sync);
  const setSync = useWorkspace((state) => state.setSync);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Mais ações do painel"
        className="grid size-7 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg data-[state=open]:bg-elevated data-[state=open]:text-fg"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Sincronizar painéis</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Mudar em um painel muda em todos</DropdownMenuLabel>
            {SYNC_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.key}
                checked={sync[option.key]}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(on) => setSync(option.key, on === true)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {paneCount > 1 ? (
          <>
            <DropdownMenuItem onSelect={equalizeAll}>
              <Equal /> Igualar tamanhos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => closeWholePane(paneId)}>
              <X /> Fechar painel
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** On narrow screens, picks which pane to show. */
function PaneSwitcher() {
  const panes = useWorkspace(useShallow((state) => orderedPanes(state)));
  const activePaneId = useWorkspace((state) => state.activePaneId);
  const index = panes.findIndex((pane) => pane.id === activePaneId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-7 rounded-md px-2 text-xs text-muted tabular-nums hover:bg-elevated hover:text-fg">
        Painel {index + 1} de {panes.length}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={activePaneId} onValueChange={focus}>
          {panes.map((pane, position) => (
            <PaneOption key={pane.id} id={pane.id} tab={pane.active} position={position} />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PaneOption({
  id,
  tab,
  position,
}: {
  id: string;
  tab: Parameters<typeof useTabLabel>[0];
  position: number;
}) {
  const label = useTabLabel(tab);
  return (
    <DropdownMenuRadioItem value={id}>
      <span className="text-muted tabular-nums">{position + 1}</span>
      {label}
    </DropdownMenuRadioItem>
  );
}
