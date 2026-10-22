import type { Folder, Kind, View } from "@/lib/library/types";
import { assetIdOf, type TabKey } from "@/lib/library/workspace-model";

export const KIND_LABEL: Record<Kind, string> = { font: "Fontes", icon: "Ícones" };

export function viewTitle(view: View, folders: Folder[], kind: Kind): string {
  switch (view.type) {
    case "all":
      return KIND_LABEL[kind];
    case "recent":
      return "Recentes";
    case "pending":
      return "Para avaliar";
    case "uncategorized":
      return "Sem pasta";
    case "untagged":
      return "Sem tag";
    case "folder":
      return folders.find((folder) => folder.id === view.id)?.name ?? "Pasta";
  }
}

export function itemCount(count: number, kind: Kind): string {
  if (kind === "font") return count === 1 ? "1 fonte" : `${count} fontes`;
  return count === 1 ? "1 conjunto" : `${count} conjuntos`;
}

/**
 * What kind of view a tab is (article 2165): the collection is a view of the
 * library, an item tab is a view of one asset. The shell says "view" out loud
 * instead of leaving the two kinds unnamed.
 */
export function viewKindLabel(key: TabKey): string {
  return assetIdOf(key) ? "Item" : "Coleção";
}
