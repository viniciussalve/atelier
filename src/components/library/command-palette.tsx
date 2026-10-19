import { useEffect, useRef, type ReactNode } from "react";
import { Command, defaultFilter } from "cmdk";
import {
  Columns2,
  Equal,
  Folder,
  LayoutGrid,
  PanelRight,
  Rows2,
  Search,
  Type,
  Shapes,
  X,
} from "lucide-react";
import { ScoreBadge, VerdictDot } from "@/components/library/evaluation/badges";
import { KIND_LABEL } from "@/components/library/shared/labels";
import { isMacPlatform } from "@/components/library/shared/use-media-query";
import {
  activeAssetId,
  close,
  equalizeAll,
  openItem,
  showLibrary,
  showView,
  split,
} from "@/lib/library/commands";
import { folderPath, ignoringAccents } from "@/lib/library/folders";
import { shortcutLabel } from "@/lib/library/shortcuts";
import { useLibrary } from "@/lib/library/store";
import type { Asset, Kind } from "@/lib/library/types";
import { useWorkspace } from "@/lib/library/workspace";

const item =
  "flex h-9 cursor-default items-center gap-2.5 rounded-md px-2 text-sm text-muted outline-none select-none data-[selected=true]:bg-elevated data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";
const heading =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle";

// cmdk's own fuzzy ranking, but "titulos" finds "Títulos", as in the sidebar.
const filter = ignoringAccents(defaultFilter);

/** ⌘K: jump to any item, folder or command. ⌘Enter opens an item beside the current pane. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assets = useLibrary((state) => state.assets);
  const folders = useLibrary((state) => state.folders);
  const canSplit = useWorkspace((state) => state.canSplit);
  const paneCount = useWorkspace((state) => Object.keys(state.panes).length);
  const toSide = useRef(false);
  const mac = isMacPlatform();

  // ⌘/Ctrl+Enter applies to the selection it triggers, not to later ones:
  // opening or closing the palette clears it, whatever was selected.
  useEffect(() => {
    toSide.current = false;
  }, [open]);

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const openAsset = (asset: Asset) => {
    const side = toSide.current && canSplit;
    run(() => openItem(asset.id, side ? "side" : "pin"));
  };

  const group = (kind: Kind) => (
    <Command.Group heading={KIND_LABEL[kind]} className={heading}>
      {assets
        .filter((asset) => asset.kind === kind)
        .map((asset) => (
          <Command.Item
            key={asset.id}
            value={`${asset.name} ${asset.id}`}
            keywords={[...asset.tags, asset.style, asset.license]}
            onSelect={() => openAsset(asset)}
            className={item}
          >
            <VerdictDot verdict={asset.verdict} />
            <span
              className="flex-1 truncate text-fg"
              style={kind === "font" ? { fontFamily: asset.family } : undefined}
            >
              {asset.name}
            </span>
            <ScoreBadge asset={asset} />
          </Command.Item>
        ))}
    </Command.Group>
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Abrir item, pasta ou comando"
      filter={filter}
      loop
      overlayClassName="fixed inset-0 z-50 bg-ink/70"
      contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface text-fg shadow-[0_24px_64px_rgb(0_0_0/0.5)]"
      onKeyDown={(event) => {
        toSide.current = event.key === "Enter" && (event.metaKey || event.ctrlKey);
      }}
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="size-4 text-subtle" />
        <Command.Input
          placeholder="Buscar fonte, conjunto, pasta ou comando"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-subtle"
        />
      </div>
      <Command.List className="max-h-[min(26rem,60vh)] overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
          Nada encontrado.
        </Command.Empty>
        {group("font")}
        {group("icon")}
        <Command.Group heading="Pastas" className={heading}>
          {folders.map((folder) => (
            <Command.Item
              key={folder.id}
              value={`pasta ${folderPath(folders, folder.id).join(" ")} ${folder.id}`}
              onSelect={() => run(() => showView(folder.kind, { type: "folder", id: folder.id }))}
              className={item}
            >
              <Folder />
              <span className="flex-1 truncate text-fg">
                {folderPath(folders, folder.id).join(" / ")}
              </span>
              <span className="text-xs text-subtle">{KIND_LABEL[folder.kind]}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Comandos" className={heading}>
          <Action
            icon={<Type />}
            label="Ir para Fontes"
            onSelect={() => run(() => showLibrary("font"))}
          />
          <Action
            icon={<Shapes />}
            label="Ir para Ícones"
            onSelect={() => run(() => showLibrary("icon"))}
          />
          <Action
            icon={<LayoutGrid />}
            label="Mostrar o que falta avaliar"
            onSelect={() => run(() => showView(useLibrary.getState().kind, { type: "pending" }))}
          />
          {canSplit ? (
            <>
              <Action
                icon={<Columns2 />}
                label="Dividir à direita"
                shortcut={shortcutLabel("splitRight", mac)}
                onSelect={() => run(() => split(useWorkspace.getState().activePaneId, "right"))}
              />
              <Action
                icon={<Rows2 />}
                label="Dividir abaixo"
                shortcut={shortcutLabel("splitDown", mac)}
                onSelect={() => run(() => split(useWorkspace.getState().activePaneId, "bottom"))}
              />
            </>
          ) : null}
          {paneCount > 1 ? (
            <Action
              icon={<Equal />}
              label="Igualar tamanhos dos painéis"
              onSelect={() => run(equalizeAll)}
            />
          ) : null}
          <Action
            icon={<PanelRight />}
            label="Mostrar ou ocultar o inspetor"
            onSelect={() =>
              run(() => {
                const state = useWorkspace.getState();
                state.setInspector(!(state.canSplit ? state.inspectorOpen : state.inspectorDrawer));
              })
            }
          />
          {activeAssetId() ? (
            <Action
              icon={<X />}
              label="Fechar aba"
              shortcut={shortcutLabel("closeTab", mac)}
              onSelect={() =>
                run(() => {
                  const state = useWorkspace.getState();
                  const pane = state.panes[state.activePaneId];
                  if (pane) close(pane.id, pane.active);
                })
              }
            />
          ) : null}
        </Command.Group>
      </Command.List>
      <p className="flex gap-4 border-t border-border px-3 py-2 text-xs text-subtle">
        <span>Enter abre</span>
        {canSplit ? <span>{mac ? "⌘" : "Ctrl+"}Enter abre ao lado</span> : null}
        <span>Esc fecha</span>
      </p>
    </Command.Dialog>
  );
}

function Action({
  icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item value={label} onSelect={onSelect} className={item}>
      {icon}
      <span className="flex-1 text-fg">{label}</span>
      {shortcut ? <kbd className="font-sans text-xs text-subtle">{shortcut}</kbd> : null}
    </Command.Item>
  );
}
