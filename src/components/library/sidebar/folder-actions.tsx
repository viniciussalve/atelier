import { useRef, useState } from "react";
import {
  Columns2,
  FolderMinus,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { descendantIds, folderScope } from "@/lib/library/folders";
import { useLibrary } from "@/lib/library/store";
import type { Folder } from "@/lib/library/types";

const trigger =
  "grid size-6 shrink-0 place-items-center rounded-md text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-surface hover:text-fg data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100";

export function FolderActions({
  folder,
  onNewSubfolder,
  onRename,
}: {
  folder: Folder;
  onNewSubfolder: () => void;
  onRename: () => void;
}) {
  const folders = useLibrary((state) => state.folders);
  const assets = useLibrary((state) => state.assets);
  const deleteFolder = useLibrary((state) => state.deleteFolder);
  const [confirming, setConfirming] = useState(false);
  // Naming actions open an input; the menu must not pull focus back to its trigger.
  const naming = useRef(false);
  const subfolders = descendantIds(folders, folder.id).length;
  const scope = new Set(folderScope(folders, folder.id));
  const items = assets.filter((item) => item.folderIds.some((id) => scope.has(id))).length;

  const consequence = [
    subfolders === 1
      ? "A subpasta também será excluída."
      : subfolders > 1
        ? `As ${subfolders} subpastas também serão excluídas.`
        : "",
    items === 1
      ? "O item continua na biblioteca, sem esta pasta."
      : items > 1
        ? `Os ${items} itens continuam na biblioteca, sem esta pasta.`
        : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`Ações da pasta ${folder.name}`} className={trigger}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => {
            if (naming.current) event.preventDefault();
            naming.current = false;
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              naming.current = true;
              onNewSubfolder();
            }}
          >
            <FolderPlus /> Nova subpasta
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              naming.current = true;
              onRename();
            }}
          >
            <Pencil /> Renomear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setConfirming(true)}>
            <Trash2 /> Excluir pasta…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Excluir “${folder.name}”?`}
        description={consequence || "A pasta está vazia."}
        confirmLabel="Excluir pasta"
        onConfirm={() => deleteFolder(folder.id)}
      />
    </>
  );
}

export function ItemActions({
  name,
  folderName,
  canSplit,
  onOpen,
  onOpenToSide,
  onRemoveFromFolder,
}: {
  name: string;
  folderName: string | null;
  canSplit: boolean;
  onOpen: () => void;
  onOpenToSide: () => void;
  onRemoveFromFolder: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Ações de ${name}`} className={trigger}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpen}>
          <SquareArrowOutUpRight /> Abrir
        </DropdownMenuItem>
        {canSplit ? (
          <DropdownMenuItem onSelect={onOpenToSide}>
            <Columns2 /> Abrir ao lado
          </DropdownMenuItem>
        ) : null}
        {folderName ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRemoveFromFolder}>
              <FolderMinus /> Tirar de “{folderName}”
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
