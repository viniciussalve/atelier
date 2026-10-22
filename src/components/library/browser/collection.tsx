import { useMemo, type DragEvent, type MouseEvent, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Grid2x2,
  List,
  Search,
  Type,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip } from "@/components/ui/tooltip";
import { KIND_LABEL, itemCount, viewTitle } from "@/components/library/shared/labels";
import { SizeSlider } from "@/components/library/specimen/controls";
import { beginDrag, compareItems, endDrag, openItem } from "@/lib/library/commands";
import { activeFilterCount } from "@/lib/library/filters";
import { useCollection } from "@/lib/library/hooks";
import { PREVIEW_RANGE, PREVIEW_SAMPLE } from "@/lib/library/preview";
import { selectionIn, selectionScope, toggleSelection } from "@/lib/library/selection";
import { useLibrary } from "@/lib/library/store";
import type { Asset, CollectionPreview, Display, Kind, SortKey, View } from "@/lib/library/types";
import { useWorkspace } from "@/lib/library/workspace";
import { MAX_PANES } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { AssetCard, AssetRow, type CardHandlers } from "./asset-card";
import { ActiveFilters, FilterButton } from "./filter-bar";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "score", label: "Nota" },
  { key: "verdict", label: "Veredito" },
  { key: "modified", label: "Modificado" },
  { key: "recent", label: "Uso recente" },
];

const EMPTY_VIEW: Record<View["type"], string> = {
  all: "",
  recent: "Os itens que você abrir aparecem aqui.",
  pending: "Tudo nesta biblioteca já tem veredito.",
  uncategorized: "Todos os itens estão em alguma pasta.",
  untagged: "Todos os itens têm pelo menos uma tag.",
  folder: "Pasta vazia. Arraste itens da coleção ou da barra para a pasta.",
};

export function Collection({ paneId }: { paneId: string }) {
  const kind = useLibrary((state) => state.kind);
  const nav = useLibrary((state) => state.nav[state.kind]);
  const folders = useLibrary((state) => state.folders);
  const setQuery = useLibrary((state) => state.setQuery);
  const setSort = useLibrary((state) => state.setSort);
  const setDisplay = useLibrary((state) => state.setDisplay);
  const setPreview = useLibrary((state) => state.setPreview);
  const clearFilters = useLibrary((state) => state.clearFilters);
  const canSplit = useWorkspace((state) => state.canSplit);
  const { list, total } = useCollection(kind);
  // Kept per pane in the workspace, so opening an item over the collection keeps it.
  const scope = selectionScope(kind, nav.view);
  const saved = useWorkspace((state) => state.selections[paneId]);
  const setSelection = useWorkspace((state) => state.setSelection);
  const selected = useMemo(() => selectionIn(saved, scope), [saved, scope]);
  const setSelected = (next: Set<string>) => setSelection(paneId, { scope, ids: [...next] });
  const sortLocked = nav.view.type === "recent";
  const filtered = activeFilterCount(nav.filters) > 0 || nav.query.trim().length > 0;

  function toggle(id: string) {
    const visible = new Set(list.map((item) => item.id));
    setSelected(toggleSelection(selected, id, visible, MAX_PANES));
  }

  const handlersFor = (item: Asset): CardHandlers => ({
    onOpen: (event: MouseEvent) => {
      if (event.shiftKey) return toggle(item.id);
      openItem(item.id, event.metaKey || event.ctrlKey ? "side" : "preview", paneId);
    },
    onPin: () => openItem(item.id, "pin", paneId),
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.setData("text/asset-id", item.id);
      event.dataTransfer.effectAllowed = "copyMove";
      beginDrag({ type: "asset", assetId: item.id });
    },
    onDragEnd: endDrag,
  });

  const visibleSelection = list.filter((item) => selected.has(item.id)).map((item) => item.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-4 pb-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">
              Vista de {KIND_LABEL[kind]}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight">
              {viewTitle(nav.view, folders, kind)}
            </h1>
          </div>
          <p className="shrink-0 text-xs text-muted tabular-nums">
            {list.length === total
              ? itemCount(total, kind)
              : `${list.length} de ${itemCount(total, kind)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3">
          <PreviewControls
            kind={kind}
            preview={nav.preview}
            onChange={(patch) => setPreview(kind, patch)}
          />
          <label className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-surface px-2 focus-within:border-proof/60 @lg:w-56">
          <Search className="size-3.5 shrink-0 text-subtle" />
          <input
            value={nav.query}
            onChange={(event) => setQuery(kind, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery(kind, "");
            }}
            placeholder="Nome, tag, nota ou pasta"
            aria-label="Buscar na coleção"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          {nav.query ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setQuery(kind, "")}
              className="text-subtle hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </label>
        <FilterButton kind={kind} />
        <SortMenu
          kind={kind}
          sortKey={nav.sort.key}
          dir={nav.sort.dir}
          locked={sortLocked}
          onSort={(key) => setSort(kind, key)}
        />
          <Segmented<Display>
            label="Exibição"
            value={nav.display}
            onChange={(display) => setDisplay(kind, display)}
            className="w-20"
            options={[
              { value: "grid", label: <Grid2x2 className="size-4" />, title: "Grade" },
              { value: "list", label: <List className="size-4" />, title: "Lista" },
            ]}
          />
        </div>
      </div>
      <ActiveFilters kind={kind} />

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <EmptyState
            title={total === 0 ? "Nada nesta vista" : "Nenhum item com estes filtros"}
            hint={
              total === 0
                ? EMPTY_VIEW[nav.view.type] || "Esta biblioteca está vazia."
                : "Afrouxe um filtro ou limpe a busca."
            }
            action={
              total > 0 && filtered ? (
                <button
                  type="button"
                  onClick={() => {
                    clearFilters(kind);
                    setQuery(kind, "");
                  }}
                  className="mt-4 h-8 rounded-md border border-border bg-elevated px-3 text-sm font-medium hover:border-proof hover:text-proof"
                >
                  Limpar filtros e busca
                </button>
              ) : null
            }
          />
        ) : nav.display === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4 p-4">
            {list.map((item) => (
              <AssetCard
                key={item.id}
                asset={item}
                preview={nav.preview}
                selected={selected.has(item.id)}
                selecting={selected.size > 0}
                onSelect={() => toggle(item.id)}
                handlers={handlersFor(item)}
              />
            ))}
          </div>
        ) : (
          <div className="border-t border-border">
            {list.map((item) => (
              <AssetRow
                key={item.id}
                asset={item}
                preview={nav.preview}
                selected={selected.has(item.id)}
                selecting={selected.size > 0}
                onSelect={() => toggle(item.id)}
                handlers={handlersFor(item)}
              />
            ))}
          </div>
        )}
      </div>

      {visibleSelection.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-proof/40 bg-surface px-4 py-2">
          <p className="text-sm tabular-nums">
            {visibleSelection.length === 1
              ? "1 selecionado"
              : `${visibleSelection.length} selecionados`}
            {visibleSelection.length >= MAX_PANES ? (
              <span className="ml-2 text-xs text-muted">Máximo de {MAX_PANES}</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto h-8 rounded-md px-3 text-sm text-muted hover:text-fg"
          >
            Limpar seleção
          </button>
          <button
            type="button"
            disabled={visibleSelection.length < 2 || !canSplit}
            title={visibleSelection.length < 2 ? "Escolha pelo menos 2" : undefined}
            onClick={() => {
              compareItems(visibleSelection);
              setSelected(new Set());
            }}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-proof px-3 text-sm font-medium text-proof-fg disabled:opacity-40"
          >
            <Columns3 className="size-4" />
            Comparar lado a lado
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The text and size every card and row draws with, like the type tester of a font catalog. */
function PreviewControls({
  kind,
  preview,
  onChange,
}: {
  kind: Kind;
  preview: CollectionPreview;
  onChange: (patch: Partial<CollectionPreview>) => void;
}) {
  const range = PREVIEW_RANGE[kind];
  return (
    <div className="flex w-full items-center gap-3 @3xl:w-auto">
      {kind === "font" ? (
        <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2 focus-within:border-proof/60 @3xl:w-60 @3xl:flex-none">
          <Type className="size-3.5 shrink-0 text-subtle" />
          <input
            value={preview.text}
            onChange={(event) => onChange({ text: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Escape") onChange({ text: "" });
            }}
            placeholder="Escreva para testar"
            title={`Sem texto, as fontes mostram: ${PREVIEW_SAMPLE}`}
            aria-label="Texto da prévia"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
        </label>
      ) : null}
      <SizeSlider
        label={kind === "font" ? "Corpo" : "Tamanho"}
        value={preview.size}
        min={range.min}
        max={range.max}
        step={range.step}
        onChange={(size) => onChange({ size })}
      />
    </div>
  );
}

function SortMenu({
  kind,
  sortKey,
  dir,
  locked,
  onSort,
}: {
  kind: Kind;
  sortKey: SortKey;
  dir: "asc" | "desc";
  locked: boolean;
  onSort: (key: SortKey) => void;
}) {
  const label = SORTS.find((entry) => entry.key === (locked ? "recent" : sortKey))?.label;
  const Arrow = dir === "asc" ? ArrowUp : ArrowDown;
  if (locked) {
    return (
      <Tooltip content="Recentes sempre mostra o último aberto primeiro">
        <span className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-sm text-subtle">
          <ArrowUpDown className="size-3.5" />
          {label}
        </span>
      </Tooltip>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Ordenar ${kind === "font" ? "fontes" : "conjuntos"}: ${label}, ${dir === "asc" ? "crescente" : "decrescente"}`}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-sm text-muted hover:text-fg data-[state=open]:border-proof/60 data-[state=open]:text-fg"
      >
        <ArrowUpDown className="size-3.5" />
        {label}
        <Arrow className="size-3.5 text-proof" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        {SORTS.map((entry) => (
          <DropdownMenuItem key={entry.key} onSelect={() => onSort(entry.key)}>
            <span className="flex-1">{entry.label}</span>
            {entry.key === sortKey ? <Arrow className={cn("!text-proof")} /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="grid h-full min-h-48 place-items-center px-6 py-10 text-center">
      <div className="max-w-sm rounded-lg border border-dashed border-border bg-surface/60 px-6 py-8">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        <p className="mt-1.5 text-sm text-muted">{hint}</p>
        {action}
      </div>
    </div>
  );
}
