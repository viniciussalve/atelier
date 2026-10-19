import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { SetGlyphs } from "@/components/library/icons";
import {
  useLibrary,
  visibleAssets,
  type Asset,
  type Folder as FolderRecord,
  type Kind,
  type PreviewGround,
  type Verdict,
  type View,
} from "@/lib/library/store";

const GROUNDS: { id: PreviewGround; label: string; surface: string; ink: string }[] = [
  { id: "paper", label: "Papel", surface: "bg-paper text-paper-fg", ink: "text-paper-fg" },
  { id: "mist", label: "Névoa", surface: "bg-mist text-paper-fg", ink: "text-paper-fg" },
  { id: "ink", label: "Tinta", surface: "bg-ink text-fg", ink: "text-fg" },
  { id: "navy", label: "Marinho", surface: "bg-navy text-fg", ink: "text-fg" },
  { id: "sand", label: "Areia", surface: "bg-sand text-paper-fg", ink: "text-paper-fg" },
];

const VERDICTS: { id: Exclude<Verdict, "">; label: string }[] = [
  { id: "usar", label: "Usar" },
  { id: "revisar", label: "Revisar" },
  { id: "evitar", label: "Evitar" },
];

const FONT_CRITERIA = [
  { id: "leitura", label: "Leitura" },
  { id: "interface", label: "Interface" },
  { id: "distincao", label: "I l 1 / O 0" },
  { id: "tom", label: "Tom" },
];

const ICON_CRITERIA = [
  { id: "miudo", label: "A 16 px" },
  { id: "consistencia", label: "Consistência" },
  { id: "componentes", label: "Componentes" },
];

const READING =
  "A pessoa pergunta, o agente responde, e o parágrafo que fica na tela precisa aguentar a leitura. Veja o desenho do a, do g e do s, o espaço entre as linhas, e se uma resposta de três ou quatro frases continua confortável. Números como 10 e 100 não podem parecer letras, nem a palavra Ilustração.";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function viewTitle(view: View, folders: FolderRecord[]) {
  if (view.type === "all") return "Tudo";
  if (view.type === "uncategorized") return "Sem pasta";
  if (view.type === "untagged") return "Sem tag";
  if (view.type === "recent") return "Recentes";
  return folders.find((folder) => folder.id === view.id)?.name ?? "Pasta";
}

export function Atelier() {
  const kind = useLibrary((state) => state.kind);
  const view = useLibrary((state) => state.view);
  const selectedId = useLibrary((state) => state.selectedId);
  const folders = useLibrary((state) => state.folders);
  const assets = useLibrary((state) => state.assets);
  const query = useLibrary((state) => state.query);
  const [navOpen, setNavOpen] = useState(false);

  const selected = assets.find((item) => item.id === selectedId) ?? null;
  const list = useMemo(
    () => visibleAssets({ assets, folders, kind, view, query }),
    [assets, folders, kind, view, query],
  );

  useEffect(() => {
    void useLibrary.persist.rehydrate();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") useLibrary.getState().selectAsset(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen ? (
        <button
          type="button"
          aria-label="Fechar pastas"
          className="fixed inset-0 z-20 bg-ink/70 min-[860px]:hidden"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          {selected ? (
            <Detail asset={selected} list={list} onOpenNav={() => setNavOpen(true)} />
          ) : (
            <Grid list={list} onOpenNav={() => setNavOpen(true)} />
          )}
        </section>
        <Inspector asset={selected} />
      </div>
    </div>
  );
}

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const kind = useLibrary((state) => state.kind);
  const view = useLibrary((state) => state.view);
  const folders = useLibrary((state) => state.folders);
  const assets = useLibrary((state) => state.assets);
  const focus = useLibrary((state) => state.focus);
  const openAsset = useLibrary((state) => state.openAsset);
  const selectedId = useLibrary((state) => state.selectedId);
  const createFolder = useLibrary((state) => state.createFolder);
  const renameFolder = useLibrary((state) => state.renameFolder);
  const deleteFolder = useLibrary((state) => state.deleteFolder);
  const assignFolder = useLibrary((state) => state.assignFolder);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState<Kind | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  function count(nextKind: Kind, next: View) {
    return visibleAssets({ assets, folders, kind: nextKind, view: next, query: "" }).length;
  }

  function commitFolder(target: Kind) {
    const id = createFolder(draft, target);
    setDraft("");
    setCreating(null);
    if (id) focus(target, { type: "folder", id });
  }

  function choose(target: Kind, next: View) {
    focus(target, next);
    onNavigate();
  }

  return (
    <aside
      className={
        "fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 min-[860px]:static min-[860px]:translate-x-0 " +
        (open ? "translate-x-0" : "-translate-x-full")
      }
    >
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm font-medium tracking-tight">Atelier</p>
        <p className="mt-1 text-xs text-subtle">Quadro compartilhado de fontes e ícones</p>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <LibrarySection
          label="Fontes"
          target="font"
          activeKind={kind}
          view={view}
          folders={folders}
          creating={creating}
          draft={draft}
          renaming={renaming}
          menuId={menuId}
          dropId={dropId}
          selectedId={selectedId}
          count={count("font", { type: "all" })}
          onChoose={(next) => choose("font", next)}
          onOpenAsset={(id, folderId) => {
            openAsset(id, folderId);
            onNavigate();
          }}
          onCreate={() => {
            setCreating("font");
            setDraft("");
          }}
          onDraft={setDraft}
          onCommit={() => commitFolder("font")}
          onCancelCreate={() => setCreating(null)}
          onMenu={setMenuId}
          onRenameStart={setRenaming}
          onRename={(id, name) => {
            renameFolder(id, name);
            setRenaming(null);
          }}
          onDelete={(id) => {
            deleteFolder(id);
            setMenuId(null);
          }}
          onDragOver={setDropId}
          onDrop={(folderId, assetId) => {
            assignFolder(assetId, folderId);
            setDropId(null);
          }}
        />
        <LibrarySection
          label="Ícones"
          target="icon"
          activeKind={kind}
          view={view}
          folders={folders}
          creating={creating}
          draft={draft}
          renaming={renaming}
          menuId={menuId}
          dropId={dropId}
          selectedId={selectedId}
          count={count("icon", { type: "all" })}
          onChoose={(next) => choose("icon", next)}
          onOpenAsset={(id, folderId) => {
            openAsset(id, folderId);
            onNavigate();
          }}
          onCreate={() => {
            setCreating("icon");
            setDraft("");
          }}
          onDraft={setDraft}
          onCommit={() => commitFolder("icon")}
          onCancelCreate={() => setCreating(null)}
          onMenu={setMenuId}
          onRenameStart={setRenaming}
          onRename={(id, name) => {
            renameFolder(id, name);
            setRenaming(null);
          }}
          onDelete={(id) => {
            deleteFolder(id);
            setMenuId(null);
          }}
          onDragOver={setDropId}
          onDrop={(folderId, assetId) => {
            assignFolder(assetId, folderId);
            setDropId(null);
          }}
        />
      </div>
    </aside>
  );
}

function LibrarySection({
  label,
  target,
  activeKind,
  view,
  folders,
  creating,
  draft,
  renaming,
  menuId,
  dropId,
  selectedId,
  count,
  onChoose,
  onOpenAsset,
  onCreate,
  onDraft,
  onCommit,
  onCancelCreate,
  onMenu,
  onRenameStart,
  onRename,
  onDelete,
  onDragOver,
  onDrop,
}: {
  label: string;
  target: Kind;
  activeKind: Kind;
  view: View;
  folders: FolderRecord[];
  creating: Kind | null;
  draft: string;
  renaming: string | null;
  menuId: string | null;
  dropId: string | null;
  selectedId: string | null;
  count: number;
  onChoose: (view: View) => void;
  onOpenAsset: (id: string, folderId?: string) => void;
  onCreate: () => void;
  onDraft: (value: string) => void;
  onCommit: () => void;
  onCancelCreate: () => void;
  onMenu: (id: string | null) => void;
  onRenameStart: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDragOver: (id: string | null) => void;
  onDrop: (folderId: string, assetId: string) => void;
}) {
  const mine = folders.filter((folder) => folder.kind === target);
  const roots = mine.filter((folder) => !folder.parentId);
  const here = activeKind === target;
  const parentSelected = here && view.type === "folder";
  const assets = useLibrary((state) => state.assets);
  const loose = assets
    .filter((item) => item.kind === target && item.folderIds.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => onChoose({ type: "all" })}
          className={"text-xs font-medium tracking-wide uppercase " + (here && view.type === "all" ? "text-fg" : "text-subtle hover:text-fg")}
        >
          {label}
        </button>
        <span className="mr-1 ml-auto text-xs text-subtle tabular-nums">{count}</span>
        <button
          type="button"
          aria-label={`Nova pasta em ${label}`}
          className="grid size-8 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
          onClick={onCreate}
        >
          <FolderPlus className="size-4" />
        </button>
      </div>
      <div className="mt-1 flex flex-col gap-0.5 px-2">
        {creating === target ? (
          <form
            className="px-2 py-1"
            onSubmit={(event) => {
              event.preventDefault();
              onCommit();
            }}
          >
            <input
              autoFocus
              value={draft}
              placeholder={parentSelected ? "Subpasta" : "Nome da pasta"}
              onChange={(event) => onDraft(event.target.value)}
              onBlur={() => {
                if (!draft.trim()) onCancelCreate();
              }}
              className="w-full rounded-md border border-border bg-bg px-2 py-2 text-sm outline-none focus:border-muted"
            />
          </form>
        ) : null}
        {roots.map((folder) => (
          <FolderBranch
            key={folder.id}
            folder={folder}
            all={mine}
            depth={0}
            activeId={here && view.type === "folder" ? view.id : null}
            menuId={menuId}
            dropId={dropId}
            renaming={renaming}
            onOpen={(id) => onChoose({ type: "folder", id })}
            onMenu={onMenu}
            onRenameStart={onRenameStart}
            onRename={onRename}
            onDelete={onDelete}
            onDragOver={onDragOver}
            onDrop={onDrop}
            selectedId={selectedId}
            onOpenAsset={onOpenAsset}
          />
        ))}
        {loose.map((item) => (
          <AssetLeaf key={item.id} asset={item} depth={0} selected={selectedId === item.id} onOpen={() => onOpenAsset(item.id)} />
        ))}
      </div>
    </section>
  );
}

function FolderBranch({
  folder,
  all,
  depth,
  activeId,
  menuId,
  dropId,
  renaming,
  onOpen,
  onMenu,
  onRenameStart,
  onRename,
  onDelete,
  onDragOver,
  onDrop,
  selectedId,
  onOpenAsset,
}: {
  folder: FolderRecord;
  all: FolderRecord[];
  depth: number;
  activeId: string | null;
  menuId: string | null;
  dropId: string | null;
  renaming: string | null;
  onOpen: (id: string) => void;
  onMenu: (id: string | null) => void;
  onRenameStart: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDragOver: (id: string | null) => void;
  onDrop: (folderId: string, assetId: string) => void;
  selectedId: string | null;
  onOpenAsset: (id: string, folderId?: string) => void;
}) {
  const assets = useLibrary((state) => state.assets);
  const children = all.filter((item) => item.parentId === folder.id);
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(folder.name);
  const count = assets.filter((item) => item.folderIds.includes(folder.id)).length;
  const members = assets
    .filter((item) => item.folderIds.includes(folder.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const active = activeId === folder.id;

  return (
    <div>
      <div
        className={
          "group relative flex h-9 items-center rounded-md pr-1 " +
          (active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg") +
          (dropId === folder.id ? " ring-1 ring-fg" : "")
        }
        style={{ paddingLeft: 8 + depth * 14 }}
        onDragOver={(event) => {
          event.preventDefault();
          onDragOver(folder.id);
        }}
        onDragLeave={() => onDragOver(null)}
        onDrop={(event) => {
          event.preventDefault();
          const assetId = event.dataTransfer.getData("text/asset-id");
          if (assetId) onDrop(folder.id, assetId);
        }}
      >
        <button
          type="button"
          aria-label={open ? "Recolher" : "Expandir"}
          className="grid size-6 shrink-0 place-items-center"
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronRight className={"size-3.5 transition-transform " + (open ? "rotate-90" : "")} />
        </button>
        {renaming === folder.id ? (
          <form
            className="min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              onRename(folder.id, name);
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => onRename(folder.id, name)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
        ) : (
          <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => onOpen(folder.id)}>
            {folder.name}
          </button>
        )}
        <span className="mr-1 tabular-nums text-xs text-subtle group-hover:hidden">{count}</span>
        <button
          type="button"
          aria-label="Opções da pasta"
          className="hidden size-7 place-items-center rounded-md group-hover:grid"
          onClick={() => onMenu(menuId === folder.id ? null : folder.id)}
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menuId === folder.id ? (
          <div className="absolute top-8 right-1 z-10 w-36 rounded-md border border-border bg-elevated p-1 shadow-none">
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-surface"
              onClick={() => {
                setName(folder.name);
                onRenameStart(folder.id);
                onMenu(null);
              }}
            >
              <Pencil className="size-3.5" /> Renomear
            </button>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-surface"
              onClick={() => onDelete(folder.id)}
            >
              <Trash2 className="size-3.5" /> Excluir
            </button>
          </div>
        ) : null}
      </div>
      {open
        ? children.map((child) => (
            <FolderBranch
              key={child.id}
              folder={child}
              all={all}
              depth={depth + 1}
              activeId={activeId}
              menuId={menuId}
              dropId={dropId}
              renaming={renaming}
              onOpen={onOpen}
              onMenu={onMenu}
              onRenameStart={onRenameStart}
              onRename={onRename}
              onDelete={onDelete}
              onDragOver={onDragOver}
              onDrop={onDrop}
              selectedId={selectedId}
              onOpenAsset={onOpenAsset}
            />
          ))
        : null}
      {open
        ? members.map((item) => (
            <AssetLeaf
              key={item.id}
              asset={item}
              depth={depth + 1}
              selected={selectedId === item.id}
              onOpen={() => onOpenAsset(item.id, folder.id)}
            />
          ))
        : null}
    </div>
  );
}

function AssetLeaf({
  asset,
  depth,
  selected,
  onOpen,
}: {
  asset: Asset;
  depth: number;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ paddingLeft: 28 + depth * 14 }}
      className={
        "flex h-8 w-full items-center truncate rounded-md pr-2 text-left text-sm " +
        (selected ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg")
      }
    >
      {asset.name}
    </button>
  );
}

function Grid({ list, onOpenNav }: { list: Asset[]; onOpenNav: () => void }) {
  const kind = useLibrary((state) => state.kind);
  const view = useLibrary((state) => state.view);
  const folders = useLibrary((state) => state.folders);
  const query = useLibrary((state) => state.query);
  const setQuery = useLibrary((state) => state.setQuery);
  const selectAsset = useLibrary((state) => state.selectAsset);

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b border-border px-4">
        <button type="button" className="grid size-9 place-items-center rounded-md hover:bg-elevated min-[860px]:hidden" onClick={onOpenNav} aria-label="Abrir pastas">
          <Folder className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium">
            {kind === "font" ? "Fontes" : "Ícones"}
            {view.type === "all" ? "" : ` · ${viewTitle(view, folders)}`}
          </h1>
          <p className="text-xs text-subtle">{list.length} {list.length === 1 ? "item" : "itens"}</p>
        </div>
        <label className="ml-auto flex h-9 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-surface px-2">
          <Search className="size-4 text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, tag, nota ou pasta"
            className="w-full bg-transparent text-sm outline-none placeholder:text-subtle"
          />
        </label>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {list.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-sm font-medium">Nada nesta vista</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {kind === "font"
                  ? "Pastas de fontes só recebem fontes. Arraste um card para uma pasta ou atribua pelo painel."
                  : "Cada item é um conjunto de ícones, como no Iconify. As pastas desta seção só recebem conjuntos."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
            {list.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/asset-id", item.id)}
                onClick={() => selectAsset(item.id)}
                className="overflow-hidden rounded-lg border border-border bg-surface text-left hover:border-muted"
              >
                <div className={"grid h-28 place-items-center " + (item.kind === "font" ? "bg-elevated" : "bg-paper")}>
                  {item.kind === "font" ? (
                    <span className="text-3xl font-medium" style={{ fontFamily: item.family }}>
                      Aa
                    </span>
                  ) : (
                    <SetGlyphs prefix={item.iconKey} names={(item.samples ?? []).slice(0, 4)} size={22} color="#1c1e24" />
                  )}
                </div>
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-subtle">
                    {item.verdict ? VERDICTS.find((entry) => entry.id === item.verdict)?.label + " · " : ""}
                    {item.kind === "icon" ? item.sizeLabel : item.tags.slice(0, 2).join(" · ") || item.style || item.format}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Detail({ asset, list, onOpenNav }: { asset: Asset; list: Asset[]; onOpenNav: () => void }) {
  const selectAsset = useLibrary((state) => state.selectAsset);
  const index = list.findIndex((item) => item.id === asset.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 items-center gap-2 border-b border-border px-3">
        <button type="button" className="grid size-9 place-items-center rounded-md hover:bg-elevated min-[860px]:hidden" onClick={onOpenNav} aria-label="Abrir pastas">
          <Folder className="size-4" />
        </button>
        <button type="button" className="grid size-9 place-items-center rounded-md hover:bg-elevated" onClick={() => selectAsset(null)} aria-label="Voltar à grade">
          <ChevronLeft className="size-4" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{asset.name}</p>
        <p className="hidden text-xs text-subtle tabular-nums sm:block">
          {index >= 0 ? `${index + 1} / ${list.length}` : ""}
        </p>
        <button
          type="button"
          aria-label="Anterior"
          disabled={index <= 0}
          className="grid size-9 place-items-center rounded-md hover:bg-elevated disabled:opacity-30"
          onClick={() => index > 0 && selectAsset(list[index - 1].id)}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Próximo"
          disabled={index < 0 || index >= list.length - 1}
          className="grid size-9 place-items-center rounded-md hover:bg-elevated disabled:opacity-30"
          onClick={() => index >= 0 && index < list.length - 1 && selectAsset(list[index + 1].id)}
        >
          <ChevronRight className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-border min-[860px]:hidden">
          <InspectorBody asset={asset} />
        </div>
        {asset.kind === "font" ? <FontPreview asset={asset} /> : <IconPreview asset={asset} />}
      </div>
    </div>
  );
}

function FontPreview({ asset }: { asset: Asset }) {
  const ground = useLibrary((state) => state.ground);
  const zoom = useLibrary((state) => state.zoom);
  const sampleText = useLibrary((state) => state.sampleText);
  const setGround = useLibrary((state) => state.setGround);
  const setZoom = useLibrary((state) => state.setZoom);
  const setSampleText = useLibrary((state) => state.setSampleText);
  const palette = GROUNDS.find((item) => item.id === ground) ?? GROUNDS[0];

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <label className="flex items-center gap-2 text-xs text-muted">
          Corpo
          <input
            type="range"
            min={13}
            max={22}
            value={zoom}
            aria-label="Tamanho do texto"
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-24 accent-fg"
          />
          <span className="tabular-nums">{zoom}</span>
        </label>
        <div className="ml-auto flex gap-1">
          {GROUNDS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => setGround(item.id)}
              className={
                "grid size-7 place-items-center rounded-md border text-xs font-medium " +
                item.surface +
                (ground === item.id ? " border-fg" : " border-transparent")
              }
            >
              A
            </button>
          ))}
        </div>
      </div>
      <div className={"flex-1 space-y-10 px-6 py-8 sm:px-10 " + palette.surface}>
        <section>
          <SpecimenLabel>Título</SpecimenLabel>
          <h2 className="mt-2 max-w-xl text-4xl leading-tight font-medium tracking-tight" style={{ fontFamily: asset.family }}>
            Clareza na conversa com o agente
          </h2>
        </section>
        <section>
          <SpecimenLabel>Leitura</SpecimenLabel>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed" style={{ fontFamily: asset.family }}>
            {READING}
          </p>
          <textarea
            value={sampleText}
            onChange={(event) => setSampleText(event.target.value)}
            aria-label="Texto de prova"
            className="mt-4 w-full max-w-xl resize-y bg-transparent leading-relaxed outline-none"
            style={{ fontFamily: asset.family, fontSize: zoom }}
            rows={5}
          />
        </section>
        <section>
          <SpecimenLabel>Interface</SpecimenLabel>
          <div className="mt-3 max-w-md space-y-3" style={{ fontFamily: asset.family }}>
            <p className="text-[11px] tracking-wide uppercase opacity-70">Agente · agora</p>
            <div className="rounded-lg border border-current/15 px-3 py-2 text-sm leading-snug">
              Posso resumir a conversa em três pontos, sem perder o que você marcou como decisão.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={"inline-flex h-8 items-center rounded-md px-3 text-sm " + (ground === "ink" || ground === "navy" ? "bg-paper text-paper-fg" : "bg-ink text-fg")}>Enviar</span>
              <span className="inline-flex h-8 items-center rounded-md border border-current/20 px-3 text-sm">Revisar</span>
              <span className="text-xs opacity-70">12 px · rótulo de campo</span>
            </div>
          </div>
        </section>
        <section>
          <SpecimenLabel>Caracteres críticos</SpecimenLabel>
          <div className="mt-3 space-y-1 text-2xl leading-relaxed" style={{ fontFamily: asset.family }}>
            <p>Il1 O0 rn m</p>
            <p>áéíóú âêô ãõ ç</p>
            <p>0O 1lI 5S 8B</p>
          </div>
        </section>
        <section>
          <SpecimenLabel>Tamanhos</SpecimenLabel>
          <div className="mt-3" style={{ fontFamily: asset.family }}>
            {[13, 16, 20, 28, 40].map((size) => (
              <p key={size} className="py-1" style={{ fontSize: size }}>
                <span className="mr-3 text-[11px] opacity-50 tabular-nums" style={{ fontFamily: "inherit" }}>
                  {size}
                </span>
                Clareza na conversa
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function IconPreview({ asset }: { asset: Asset }) {
  const ground = useLibrary((state) => state.ground);
  const setGround = useLibrary((state) => state.setGround);
  const palette = GROUNDS.find((item) => item.id === ground) ?? GROUNDS[0];
  const color = ground === "ink" || ground === "navy" ? "#eceef2" : "#1c1e24";
  const names = asset.samples ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <p className="text-sm text-muted">
          {asset.format} · {asset.sizeLabel}
        </p>
        <div className="ml-auto flex gap-1">
          {GROUNDS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => setGround(item.id)}
              className={
                "grid size-7 place-items-center rounded-md border text-xs font-medium " +
                item.surface +
                (ground === item.id ? " border-fg" : " border-transparent")
              }
            >
              A
            </button>
          ))}
        </div>
      </div>
      <div className={"flex-1 space-y-10 px-6 py-8 " + palette.surface}>
        <section>
          <SpecimenLabel>Amostras</SpecimenLabel>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3">
            {names.map((name) => (
              <div key={name} className="grid justify-items-center gap-2">
                <SetGlyphs prefix={asset.iconKey} names={[name]} size={24} color={color} />
                <span className="max-w-full truncate text-xs opacity-70">{name}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <SpecimenLabel>Tamanhos</SpecimenLabel>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            {names[0]
              ? [16, 20, 24, 32].map((size) => (
                  <div key={size} className="grid justify-items-center gap-2">
                    <SetGlyphs prefix={asset.iconKey} names={[names[0]]} size={size} color={color} />
                    <span className="text-xs opacity-70">{size}</span>
                  </div>
                ))
              : null}
          </div>
        </section>
        <section>
          <SpecimenLabel>Em componentes</SpecimenLabel>
          <div className="mt-3 max-w-md space-y-3">
            <div className="flex gap-4">
              {names.slice(0, 4).map((name) => (
                <span key={name} className="grid justify-items-center gap-1 text-[11px] opacity-80">
                  <SetGlyphs prefix={asset.iconKey} names={[name]} size={20} color={color} />
                  {name.split("-")[0]}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={"inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm " + (ground === "ink" || ground === "navy" ? "bg-paper text-paper-fg" : "bg-ink text-fg")}>
                {names[0] ? (
                  <SetGlyphs prefix={asset.iconKey} names={[names[0]]} size={16} color={ground === "ink" || ground === "navy" ? "#1c1e24" : "#eceef2"} />
                ) : null}
                Ação
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-md border border-current/20 px-3 text-sm">
                {names[1] ? <SetGlyphs prefix={asset.iconKey} names={[names[1]]} size={16} color={color} /> : null}
                Secundária
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-current/15 px-3 py-2">
              {names[2] ? <SetGlyphs prefix={asset.iconKey} names={[names[2]]} size={16} color={color} /> : null}
              <span>
                <span className="block text-sm">{asset.name}</span>
                <span className="block text-xs opacity-70">{asset.notes || "Item de lista a 16 px"}</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SpecimenLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-wide uppercase opacity-60">{children}</p>;
}

function Inspector({ asset }: { asset: Asset | null }) {
  return (
    <aside className="hidden min-h-0 w-64 shrink-0 flex-col border-l border-border bg-surface min-[860px]:flex">
      <InspectorBody asset={asset} />
    </aside>
  );
}

function InspectorBody({ asset }: { asset: Asset | null }) {
  const folders = useLibrary((state) => state.folders);
  const updateAsset = useLibrary((state) => state.updateAsset);
  const addTag = useLibrary((state) => state.addTag);
  const removeTag = useLibrary((state) => state.removeTag);
  const assignFolder = useLibrary((state) => state.assignFolder);
  const unassignFolder = useLibrary((state) => state.unassignFolder);
  const [tagDraft, setTagDraft] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);

  if (!asset) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center">
        <p className="text-sm text-muted">Escolha uma fonte ou um conjunto na barra para avaliar.</p>
      </div>
    );
  }

  const kindFolders = folders.filter((folder) => folder.kind === asset.kind);
  const assigned = kindFolders.filter((folder) => asset.folderIds.includes(folder.id));
  const available = kindFolders.filter((folder) => !asset.folderIds.includes(folder.id));
  const criteria = asset.kind === "font" ? FONT_CRITERIA : ICON_CRITERIA;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Avaliação</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {VERDICTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => updateAsset(asset.id, { verdict: asset.verdict === entry.id ? "" : entry.id })}
              className={
                "h-8 rounded-md text-sm " +
                (asset.verdict === entry.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg")
              }
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {criteria.map((criterion) => (
            <div key={criterion.id} className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">{criterion.label}</span>
              <span className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => {
                  const current = asset.criteria?.[criterion.id] ?? 0;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${criterion.label}: ${value} de 5`}
                      onClick={() =>
                        updateAsset(asset.id, {
                          criteria: { ...asset.criteria, [criterion.id]: current === value ? 0 : value },
                        })
                      }
                      className={
                        "grid size-6 place-items-center rounded-md text-xs tabular-nums " +
                        (value <= current ? "bg-accent text-accent-fg" : "bg-elevated text-subtle")
                      }
                    >
                      {value}
                    </button>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted">Nota</span>
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} de 5`}
                onClick={() => updateAsset(asset.id, { rating: asset.rating === value ? 0 : value })}
              >
                <Star className={"size-4 " + (value <= asset.rating ? "fill-current text-fg" : "text-subtle")} />
              </button>
            ))}
          </span>
        </div>
      </div>
      <div className="rounded-lg bg-paper px-4 py-5 text-center text-paper-fg">
        <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">{asset.format || asset.kind}</p>
        {asset.kind === "font" ? (
          <p className="text-xl leading-tight font-medium" style={{ fontFamily: asset.family }}>
            ABCDEFG
            <br />
            abcdefg
            <br />
            0123456
          </p>
        ) : (
          <div className="grid place-items-center py-3">
            <SetGlyphs prefix={asset.iconKey} names={(asset.samples ?? []).slice(0, 4)} size={28} color="#1c1e24" />
          </div>
        )}
      </div>
      <Field label="Nome">
        <input
          value={asset.name}
          onChange={(event) => updateAsset(asset.id, { name: event.target.value })}
          className="field"
        />
      </Field>
      <Field label="Notas">
        <textarea
          value={asset.notes}
          placeholder="O que a outra parte precisa saber sobre este item"
          onChange={(event) => updateAsset(asset.id, { notes: event.target.value })}
          className="field min-h-20 resize-y"
        />
      </Field>
      <Field label="Link">
        <input
          value={asset.url}
          placeholder="https://"
          onChange={(event) => updateAsset(asset.id, { url: event.target.value })}
          className="field"
        />
      </Field>
      <div>
        <p className="mb-2 text-xs font-medium text-subtle">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {asset.tags.map((tag) => (
            <span key={tag} className="inline-flex h-7 items-center gap-1 rounded-full bg-elevated px-2 text-xs">
              {tag}
              <button type="button" aria-label={`Remover ${tag}`} onClick={() => removeTag(asset.id, tag)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addTag(asset.id, tagDraft);
              setTagDraft("");
            }}
          >
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              placeholder="+"
              aria-label="Nova tag"
              className="h-7 w-16 rounded-full bg-elevated px-2 text-xs outline-none"
            />
          </form>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-subtle">Pastas</p>
          <button type="button" aria-label="Atribuir pasta" className="grid size-6 place-items-center rounded-full bg-elevated" onClick={() => setAddingFolder((value) => !value)}>
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assigned.length === 0 ? <span className="text-xs text-subtle">Sem pasta</span> : null}
          {assigned.map((folder) => (
            <span key={folder.id} className="inline-flex h-7 items-center gap-1 rounded-full bg-elevated px-2 text-xs">
              {folder.name}
              <button type="button" aria-label={`Tirar de ${folder.name}`} onClick={() => unassignFolder(asset.id, folder.id)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        {addingFolder ? (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
            {available.length === 0 ? (
              <p className="px-3 py-2 text-xs text-subtle">Todas as pastas desta biblioteca já estão atribuídas.</p>
            ) : (
              available.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className="block h-8 w-full truncate px-3 text-left text-sm hover:bg-elevated"
                  onClick={() => {
                    assignFolder(asset.id, folder.id);
                    setAddingFolder(false);
                  }}
                >
                  {folder.name}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-subtle">Propriedades</p>
        <Property label="Tipo">{asset.kind === "font" ? "Fonte" : "Conjunto"}</Property>
        <Property label="Estilo">{asset.style || "—"}</Property>
        <Property label="Tamanho">{asset.sizeLabel || "—"}</Property>
        <Property label="Formato">{asset.format || "—"}</Property>
        <Property label="Importado">{formatDate(asset.importedAt)}</Property>
        <Property label="Modificado">{formatDate(asset.modifiedAt)}</Property>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-subtle">{label}</span>
      {children}
    </label>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 text-xs">
      <span className="text-subtle">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
