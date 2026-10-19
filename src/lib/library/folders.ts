import type { Asset, Folder, Kind } from "./types.ts";

export type ExplorerNode =
  | { type: "folder"; folder: Folder; count: number; children: ExplorerNode[] }
  | { type: "asset"; asset: Asset; folderId: string | null };

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "pt-BR");

export function descendantIds(folders: Folder[], id: string): string[] {
  const kids = folders.filter((folder) => folder.parentId === id);
  return kids.flatMap((kid) => [kid.id, ...descendantIds(folders, kid.id)]);
}

export function folderScope(folders: Folder[], id: string): string[] {
  return [id, ...descendantIds(folders, id)];
}

/** Folder names from the root down to `id`. */
export function folderPath(folders: Folder[], id: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  let current = folders.find((folder) => folder.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    const parentId = current.parentId;
    current = parentId ? folders.find((folder) => folder.id === parentId) : undefined;
  }
  return names;
}

/** Lowercase without diacritics, for accent-insensitive search. */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** How well `search` matches `value` and its `keywords`; 0 hides it (the shape of cmdk's filter). */
export type SearchScore = (value: string, search: string, keywords?: string[]) => number;

/** A scorer that ignores accents and case on both sides, like the sidebar and collection searches. */
export function ignoringAccents(score: SearchScore): SearchScore {
  return (value, search, keywords) =>
    score(normalizeText(value), normalizeText(search), keywords?.map(normalizeText));
}

/**
 * The sidebar tree for one library. An item sits under a folder only when no
 * subfolder of that folder also holds it, so a branch never repeats an item;
 * items in unrelated folders show in each. Items without a folder come last.
 */
export function explorerTree(folders: Folder[], assets: Asset[], kind: Kind): ExplorerNode[] {
  const mine = folders.filter((folder) => folder.kind === kind);
  const known = new Set(mine.map((folder) => folder.id));
  const items = assets.filter((item) => item.kind === kind);

  function branch(parentId: string | null): ExplorerNode[] {
    const subfolders = mine
      .filter((folder) => folder.parentId === parentId)
      .sort(byName)
      .map((folder): ExplorerNode => {
        const scope = new Set(folderScope(mine, folder.id));
        const below = new Set(descendantIds(mine, folder.id));
        const members = items
          .filter(
            (item) =>
              item.folderIds.includes(folder.id) && !item.folderIds.some((id) => below.has(id)),
          )
          .sort(byName)
          .map((item): ExplorerNode => ({ type: "asset", asset: item, folderId: folder.id }));
        return {
          type: "folder",
          folder,
          count: items.filter((item) => item.folderIds.some((id) => scope.has(id))).length,
          children: [...branch(folder.id), ...members],
        };
      });
    if (parentId !== null) return subfolders;
    const loose = items
      .filter((item) => !item.folderIds.some((id) => known.has(id)))
      .sort(byName)
      .map((item): ExplorerNode => ({ type: "asset", asset: item, folderId: null }));
    return [...subfolders, ...loose];
  }

  return branch(null);
}

/** Keeps matching items with their folder chain, and whole folders whose name matches. */
export function filterExplorer(nodes: ExplorerNode[], query: string): ExplorerNode[] {
  const needle = normalizeText(query.trim());
  if (!needle) return nodes;

  function keep(node: ExplorerNode): ExplorerNode | null {
    if (node.type === "asset") return normalizeText(node.asset.name).includes(needle) ? node : null;
    if (normalizeText(node.folder.name).includes(needle)) return node;
    const children = node.children
      .map(keep)
      .filter((child): child is ExplorerNode => child !== null);
    return children.length ? { ...node, children } : null;
  }

  return nodes.map(keep).filter((node): node is ExplorerNode => node !== null);
}
