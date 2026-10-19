import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  ChevronsDownUp,
  CircleDashed,
  Command,
  FolderPlus,
  FolderX,
  History,
  LayoutGrid,
  PanelLeftClose,
  Search,
  Tag,
  X,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Segmented } from "@/components/ui/segmented";
import { openItem, showLibrary, showView } from "@/lib/library/commands";
import { viewCounts } from "@/lib/library/filters";
import { explorerTree, filterExplorer, type ExplorerNode } from "@/lib/library/folders";
import { shortcutLabel } from "@/lib/library/shortcuts";
import { useLibrary } from "@/lib/library/store";
import { useWorkspace } from "@/lib/library/workspace";
import { isMacPlatform } from "@/components/library/shared/use-media-query";
import type { Kind, View } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { AiLinkRow } from "./ai-link-row";
import { Explorer, type Draft } from "./explorer";

type QuickView = Exclude<View["type"], "folder">;

const QUICK_VIEWS: {
  type: QuickView;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { type: "all", label: "Tudo", icon: LayoutGrid },
  { type: "recent", label: "Recentes", icon: History },
  { type: "pending", label: "Para avaliar", icon: CircleDashed },
  { type: "uncategorized", label: "Sem pasta", icon: FolderX },
  { type: "untagged", label: "Sem tag", icon: Tag },
];

function firstAsset(nodes: ExplorerNode[]): string | null {
  for (const node of nodes) {
    if (node.type === "asset") return node.asset.id;
    const found = firstAsset(node.children);
    if (found) return found;
  }
  return null;
}

export function Sidebar({
  open,
  onClose,
  onNavigate,
  onQuickOpen,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onQuickOpen: () => void;
}) {
  const kind = useLibrary((state) => state.kind);
  const view = useLibrary((state) => state.nav[state.kind].view);
  const assets = useLibrary((state) => state.assets);
  const folders = useLibrary((state) => state.folders);
  const collapseAll = useLibrary((state) => state.collapseAll);
  // Below 860 px the bar is a drawer: closed, it leaves the Tab order and the accessibility tree.
  const wide = useWorkspace((state) => state.canSplit);
  const drawer = open && !wide;
  const bar = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  // Open, the drawer is modal (the page behind it is inert): focus moves in, and
  // goes back to the button that opened it unless closing put it somewhere else.
  useEffect(() => {
    const aside = bar.current;
    if (!drawer || !aside) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    aside.querySelector<HTMLElement>("button, input")?.focus();
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body || aside.contains(active)) opener?.focus();
    };
  }, [drawer]);

  const counts = useMemo(() => viewCounts(assets, kind), [assets, kind]);
  const libraryCounts = useMemo(
    () => ({
      font: assets.filter((item) => item.kind === "font").length,
      icon: assets.filter((item) => item.kind === "icon").length,
    }),
    [assets],
  );
  const tree = useMemo(() => explorerTree(folders, assets, kind), [folders, assets, kind]);
  const shown = useMemo(() => filterExplorer(tree, search), [tree, search]);
  const searching = search.trim().length > 0;

  return (
    <aside
      ref={bar}
      aria-label="Biblioteca"
      inert={!open && !wide}
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 min-[860px]:static min-[860px]:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col gap-3 px-3 pt-4 pb-3">
        <div className="flex items-start gap-2 px-1">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold tracking-tight">Atelier</p>
            <p className="text-xs text-muted">Avaliação de artefatos</p>
          </div>
          <button
            type="button"
            onClick={onQuickOpen}
            aria-label="Abrir item, pasta ou comando"
            className="mt-0.5 inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-muted hover:border-muted hover:text-fg"
          >
            <Command className="size-3.5" />
            {/* In the drawer the close button takes its room. */}
            <kbd className="hidden font-sans min-[860px]:inline">
              {shortcutLabel("quickOpen", isMacPlatform())}
            </kbd>
          </button>
          <IconButton
            label="Fechar a barra"
            size="sm"
            className="min-[860px]:hidden"
            onClick={onClose}
          >
            <PanelLeftClose className="size-4" />
          </IconButton>
        </div>
        <Segmented<Kind>
          label="Biblioteca"
          value={kind}
          onChange={(next) => {
            setDraft(null);
            showLibrary(next);
          }}
          options={[
            { value: "font", label: "Fontes", count: libraryCounts.font },
            { value: "icon", label: "Ícones", count: libraryCounts.icon },
          ]}
        />
        <label className="flex h-8 items-center gap-2 rounded-md border border-border bg-bg px-2 focus-within:border-proof/60">
          <Search className="size-3.5 shrink-0 text-subtle" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSearch("");
              if (event.key === "Enter") {
                const id = firstAsset(shown);
                if (id) {
                  openItem(id, "pin");
                  onNavigate();
                }
              }
            }}
            placeholder={kind === "font" ? "Filtrar pastas e fontes" : "Filtrar pastas e conjuntos"}
            aria-label="Filtrar a barra"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          {searching ? (
            <button
              type="button"
              aria-label="Limpar filtro"
              onClick={() => setSearch("")}
              className="text-subtle hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </label>
      </div>

      <nav aria-label="Vistas e pastas" className="flex-1 overflow-y-auto px-2 pb-4">
        <AiLinkRow />
        {searching ? null : (
          <section aria-label="Vistas" className="mb-4">
            <p className="px-2 pb-1 text-xs font-medium text-muted">Vistas</p>
            <ul className="flex flex-col gap-px">
              {QUICK_VIEWS.map(({ type, label, icon: Icon }) => {
                const active = view.type === type;
                return (
                  <li key={type}>
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        showView(kind, { type } as View);
                        onNavigate();
                      }}
                      className={cn(
                        "flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors",
                        active
                          ? "bg-elevated text-fg"
                          : "text-muted hover:bg-elevated/60 hover:text-fg",
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-proof" : "text-subtle")} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className="text-xs text-subtle tabular-nums">{counts[type]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-label="Pastas">
          <div className="flex items-center gap-1 pr-1 pb-1 pl-2">
            <p className="flex-1 text-xs font-medium text-muted">
              {searching ? "Resultados" : "Pastas"}
            </p>
            {searching ? null : (
              <>
                <IconButton label="Recolher todas" size="sm" onClick={collapseAll}>
                  <ChevronsDownUp className="size-3.5" />
                </IconButton>
                <IconButton
                  label="Nova pasta"
                  size="sm"
                  onClick={() => setDraft({ mode: "create", parentId: null })}
                >
                  <FolderPlus className="size-3.5" />
                </IconButton>
              </>
            )}
          </div>
          {shown.length === 0 && !draft ? (
            <p className="px-2 py-2 text-sm text-muted">
              {searching
                ? `Nada com “${search.trim()}”.`
                : "Nenhuma pasta ainda. Crie uma para agrupar itens."}
            </p>
          ) : (
            <Explorer
              nodes={shown}
              kind={kind}
              forceOpen={searching}
              draft={draft}
              onDraft={setDraft}
              onNavigate={onNavigate}
            />
          )}
        </section>
      </nav>
    </aside>
  );
}
