import { useRef, useState, type DragEvent, type MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import { VerdictDot } from "@/components/library/evaluation/badges";
import { withVerdict } from "@/components/library/evaluation/tones";
import { openItem, showView } from "@/lib/library/commands";
import { type ExplorerNode } from "@/lib/library/folders";
import { useActiveAsset } from "@/lib/library/hooks";
import { useLibrary } from "@/lib/library/store";
import type { Kind } from "@/lib/library/types";
import { useWorkspace } from "@/lib/library/workspace";
import { cn } from "@/lib/utils";
import { FolderActions, ItemActions } from "./folder-actions";

const INDENT = 12;
export const ASSET_MIME = "text/asset-id";

export type Draft =
  { mode: "create"; parentId: string | null } | { mode: "rename"; folderId: string };

export function Explorer({
  nodes,
  kind,
  forceOpen,
  draft,
  onDraft,
  onNavigate,
}: {
  nodes: ExplorerNode[];
  kind: Kind;
  /** Show every branch open, e.g. while searching. */
  forceOpen: boolean;
  draft: Draft | null;
  onDraft: (draft: Draft | null) => void;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-px">
      {draft?.mode === "create" && draft.parentId === null ? (
        <NameInput
          depth={0}
          placeholder="Nome da pasta"
          kind={kind}
          draft={draft}
          onDone={() => onDraft(null)}
        />
      ) : null}
      {nodes.map((node) => (
        <Branch
          key={nodeKey(node)}
          node={node}
          depth={0}
          kind={kind}
          forceOpen={forceOpen}
          draft={draft}
          onDraft={onDraft}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function nodeKey(node: ExplorerNode) {
  return node.type === "folder"
    ? `f:${node.folder.id}`
    : `a:${node.folderId ?? "root"}:${node.asset.id}`;
}

function Branch({
  node,
  depth,
  kind,
  forceOpen,
  draft,
  onDraft,
  onNavigate,
}: {
  node: ExplorerNode;
  depth: number;
  kind: Kind;
  forceOpen: boolean;
  draft: Draft | null;
  onDraft: (draft: Draft | null) => void;
  onNavigate: () => void;
}) {
  if (node.type === "asset") return <Leaf node={node} depth={depth} onNavigate={onNavigate} />;
  return (
    <FolderRow
      node={node}
      depth={depth}
      kind={kind}
      forceOpen={forceOpen}
      draft={draft}
      onDraft={onDraft}
      onNavigate={onNavigate}
    />
  );
}

function FolderRow({
  node,
  depth,
  kind,
  forceOpen,
  draft,
  onDraft,
  onNavigate,
}: {
  node: Extract<ExplorerNode, { type: "folder" }>;
  depth: number;
  kind: Kind;
  forceOpen: boolean;
  draft: Draft | null;
  onDraft: (draft: Draft | null) => void;
  onNavigate: () => void;
}) {
  const { folder } = node;
  const expanded = useLibrary((state) => state.expanded.includes(folder.id));
  const view = useLibrary((state) => state.nav[kind].view);
  const setExpanded = useLibrary((state) => state.setExpanded);
  const assignFolder = useLibrary((state) => state.assignFolder);
  const [dropping, setDropping] = useState(false);
  const open = forceOpen || expanded;
  const active = view.type === "folder" && view.id === folder.id;
  const renaming = draft?.mode === "rename" && draft.folderId === folder.id;
  const creatingHere = draft?.mode === "create" && draft.parentId === folder.id;

  function onDragOver(event: DragEvent) {
    if (!event.dataTransfer.types.includes(ASSET_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropping(true);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDropping(false);
    const assetId = event.dataTransfer.getData(ASSET_MIME);
    if (assetId) assignFolder(assetId, folder.id);
    useWorkspace.getState().setDrag(null);
  }

  return (
    <div>
      {renaming ? (
        <NameInput
          depth={depth}
          placeholder="Nome da pasta"
          kind={kind}
          draft={draft}
          initial={folder.name}
          onDone={() => onDraft(null)}
        />
      ) : (
        <div
          className={cn(
            "group flex h-8 items-center gap-0.5 rounded-md pr-1 transition-colors",
            active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
            dropping && "bg-proof/15 text-fg ring-1 ring-proof ring-inset",
          )}
          style={{ paddingLeft: 4 + depth * INDENT }}
          onDragOver={onDragOver}
          onDragLeave={() => setDropping(false)}
          onDrop={onDrop}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? `Recolher ${folder.name}` : `Expandir ${folder.name}`}
            className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-surface"
            onClick={() => setExpanded(folder.id, !expanded)}
            disabled={forceOpen}
          >
            <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
          </button>
          <button
            type="button"
            aria-current={active ? "page" : undefined}
            className="min-w-0 flex-1 truncate text-left text-sm"
            onClick={() => {
              showView(kind, { type: "folder", id: folder.id });
              if (!expanded) setExpanded(folder.id, true);
              onNavigate();
            }}
          >
            {folder.name}
          </button>
          <span className="px-1 text-xs text-subtle tabular-nums group-focus-within:hidden group-hover:hidden [@media(hover:none)]:hidden">
            {node.count}
          </span>
          <FolderActions
            folder={folder}
            onNewSubfolder={() => onDraft({ mode: "create", parentId: folder.id })}
            onRename={() => onDraft({ mode: "rename", folderId: folder.id })}
          />
        </div>
      )}
      {open ? (
        <div>
          {creatingHere ? (
            <NameInput
              depth={depth + 1}
              placeholder="Nome da subpasta"
              kind={kind}
              draft={draft}
              onDone={() => onDraft(null)}
            />
          ) : null}
          {node.children.map((child) => (
            <Branch
              key={nodeKey(child)}
              node={child}
              depth={depth + 1}
              kind={kind}
              forceOpen={forceOpen}
              draft={draft}
              onDraft={onDraft}
              onNavigate={onNavigate}
            />
          ))}
          {node.children.length === 0 && !creatingHere ? (
            <p
              className="py-1 text-xs text-subtle"
              style={{ paddingLeft: 30 + (depth + 1) * INDENT }}
            >
              Arraste itens para cá
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Leaf({
  node,
  depth,
  onNavigate,
}: {
  node: Extract<ExplorerNode, { type: "asset" }>;
  depth: number;
  onNavigate: () => void;
}) {
  const { asset, folderId } = node;
  const active = useActiveAsset()?.id === asset.id;
  const folderName = useLibrary((state) =>
    folderId ? (state.folders.find((folder) => folder.id === folderId)?.name ?? null) : null,
  );
  const unassignFolder = useLibrary((state) => state.unassignFolder);
  const canSplit = useWorkspace((state) => state.canSplit);
  const setDrag = useWorkspace((state) => state.setDrag);

  function onClick(event: MouseEvent) {
    openItem(asset.id, event.metaKey || event.ctrlKey ? "side" : "preview");
    onNavigate();
  }

  return (
    <div
      className={cn(
        "group flex h-8 items-center gap-2 rounded-md pr-1 transition-colors",
        active ? "bg-elevated/70 text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
      )}
      style={{ paddingLeft: 14 + depth * INDENT }}
    >
      <button
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(ASSET_MIME, asset.id);
          event.dataTransfer.effectAllowed = "copyMove";
          setDrag({ type: "asset", assetId: asset.id });
        }}
        onDragEnd={() => setDrag(null)}
        onClick={onClick}
        onDoubleClick={() => openItem(asset.id, "pin")}
        aria-current={active ? "true" : undefined}
        aria-label={withVerdict(asset.name, asset.verdict)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
      >
        <VerdictDot verdict={asset.verdict} />
        <span className="truncate">{asset.name}</span>
      </button>
      <ItemActions
        name={asset.name}
        folderName={folderName}
        canSplit={canSplit}
        onOpen={() => {
          openItem(asset.id, "pin");
          onNavigate();
        }}
        onOpenToSide={() => {
          openItem(asset.id, "side");
          onNavigate();
        }}
        onRemoveFromFolder={() => folderId && unassignFolder(asset.id, folderId)}
      />
    </div>
  );
}

function NameInput({
  depth,
  placeholder,
  kind,
  draft,
  initial = "",
  onDone,
}: {
  depth: number;
  placeholder: string;
  kind: Kind;
  draft: Draft;
  initial?: string;
  onDone: () => void;
}) {
  const createFolder = useLibrary((state) => state.createFolder);
  const renameFolder = useLibrary((state) => state.renameFolder);
  const [value, setValue] = useState(initial);
  // Enter submits and then the input blurs as it unmounts; act only once.
  const settled = useRef(false);

  function finish(save: boolean) {
    if (settled.current) return;
    settled.current = true;
    if (save && value.trim() && value.trim() !== initial) {
      if (draft.mode === "create") createFolder(value, kind, draft.parentId);
      else renameFolder(draft.folderId, value);
    }
    onDone();
  }

  return (
    <form
      className="py-0.5 pr-1"
      style={{ paddingLeft: 4 + depth * INDENT }}
      onSubmit={(event) => {
        event.preventDefault();
        finish(true);
      }}
    >
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") finish(false);
        }}
        onBlur={() => finish(true)}
        className="h-8 w-full rounded-md border border-proof/60 bg-bg px-2 text-sm outline-none placeholder:text-subtle"
      />
    </form>
  );
}
