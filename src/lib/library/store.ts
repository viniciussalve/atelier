import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mergeNewAssets } from "../ai/additions.ts";
import { EMPTY_FILTERS, defaultSortDir } from "./filters.ts";
import { descendantIds } from "./folders.ts";
import { migrateLibrary } from "./migrate.ts";
import { sanitizePreview } from "./preview.ts";
import { defaultLibrary } from "./seed.ts";
import type {
  Asset,
  CollectionPreview,
  CriterionId,
  Display,
  Kind,
  KindNav,
  LibraryData,
  ListFacet,
  Score,
  SortKey,
  View,
} from "./types.ts";

export type * from "./types.ts";
export { folderScope } from "./folders.ts";

type LibraryActions = {
  setKind: (kind: Kind) => void;
  setView: (kind: Kind, view: View) => void;
  setQuery: (kind: Kind, query: string) => void;
  toggleFilter: (kind: Kind, facet: ListFacet, value: string) => void;
  setMinScore: (kind: Kind, value: Score | null) => void;
  clearFilters: (kind: Kind) => void;
  setSort: (kind: Kind, key: SortKey) => void;
  setDisplay: (kind: Kind, display: Display) => void;
  setPreview: (kind: Kind, patch: Partial<CollectionPreview>) => void;
  setExpanded: (folderId: string, open: boolean) => void;
  collapseAll: () => void;
  createFolder: (name: string, kind: Kind, parentId: string | null) => string | null;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  assignFolder: (assetId: string, folderId: string) => void;
  unassignFolder: (assetId: string, folderId: string) => void;
  updateAsset: (
    id: string,
    patch: Partial<Pick<Asset, "name" | "notes" | "url" | "verdict">>,
  ) => void;
  setScore: (id: string, criterion: CriterionId, value: Score | null) => void;
  setCriterionNote: (id: string, criterion: CriterionId, note: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  addSample: (id: string, name: string) => void;
  removeSample: (id: string, name: string) => void;
  markUsed: (id: string) => void;
  /** Adds the items the library does not have yet; returns the ids added. */
  addAssets: (incoming: Asset[], origin?: { tags?: string[]; notes?: string }) => string[];
};

export type LibraryState = LibraryData & LibraryActions;

const ICON_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isIconName(value: string): boolean {
  return ICON_NAME.test(value.trim().toLowerCase());
}

function touch(item: Asset, patch: Partial<Asset>): Asset {
  return { ...item, ...patch, modifiedAt: new Date().toISOString() };
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => {
      const patchNav = (kind: Kind, patch: (nav: KindNav) => Partial<KindNav>) =>
        set((state) => ({
          nav: { ...state.nav, [kind]: { ...state.nav[kind], ...patch(state.nav[kind]) } },
        }));
      /** `patch` returns null to leave the item untouched. */
      const patchAsset = (id: string, patch: (item: Asset) => Asset | null) =>
        set((state) => ({
          assets: state.assets.map((item) => (item.id === id ? (patch(item) ?? item) : item)),
        }));
      const scoreEntry = (
        item: Asset,
        criterion: CriterionId,
        value: Score | null,
        note: string,
      ) => {
        const criteria = { ...item.criteria };
        if (value === null && !note) delete criteria[criterion];
        else criteria[criterion] = { value, note };
        return touch(item, { criteria });
      };

      return {
        ...defaultLibrary(),
        setKind: (kind) => set({ kind }),
        setView: (kind, view) =>
          set((state) => ({ kind, nav: { ...state.nav, [kind]: { ...state.nav[kind], view } } })),
        setQuery: (kind, query) => patchNav(kind, () => ({ query })),
        toggleFilter: (kind, facet, value) =>
          patchNav(kind, (nav) => {
            const current: string[] = nav.filters[facet];
            const next = current.includes(value)
              ? current.filter((entry) => entry !== value)
              : [...current, value];
            return { filters: { ...nav.filters, [facet]: next } };
          }),
        setMinScore: (kind, value) =>
          patchNav(kind, (nav) => ({ filters: { ...nav.filters, minScore: value } })),
        clearFilters: (kind) => patchNav(kind, () => ({ filters: EMPTY_FILTERS })),
        setSort: (kind, key) =>
          patchNav(kind, (nav) => ({
            sort:
              nav.sort.key === key
                ? { key, dir: nav.sort.dir === "asc" ? "desc" : "asc" }
                : { key, dir: defaultSortDir(key) },
          })),
        setDisplay: (kind, display) => patchNav(kind, () => ({ display })),
        setPreview: (kind, patch) =>
          patchNav(kind, (nav) => ({
            preview: sanitizePreview(kind, { ...nav.preview, ...patch }),
          })),
        setExpanded: (folderId, open) =>
          set((state) => {
            if (state.expanded.includes(folderId) === open) return state;
            return {
              expanded: open
                ? [...state.expanded, folderId]
                : state.expanded.filter((id) => id !== folderId),
            };
          }),
        collapseAll: () => set({ expanded: [] }),
        createFolder: (name, kind, parentId) => {
          const trimmed = name.trim();
          if (!trimmed) return null;
          const parent = parentId ? get().folders.find((folder) => folder.id === parentId) : null;
          const validParent = parent && parent.kind === kind ? parent.id : null;
          const id = `folder-${Date.now().toString(36)}`;
          set((state) => ({
            folders: [...state.folders, { id, name: trimmed, kind, parentId: validParent }],
            expanded:
              validParent && !state.expanded.includes(validParent)
                ? [...state.expanded, validParent]
                : state.expanded,
          }));
          return id;
        },
        renameFolder: (id, name) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          set((state) => ({
            folders: state.folders.map((folder) =>
              folder.id === id ? { ...folder, name: trimmed } : folder,
            ),
          }));
        },
        deleteFolder: (id) => {
          const drop = new Set([id, ...descendantIds(get().folders, id)]);
          set((state) => {
            const nav = { ...state.nav };
            for (const kind of ["font", "icon"] as Kind[]) {
              const view = nav[kind].view;
              if (view.type === "folder" && drop.has(view.id)) {
                nav[kind] = { ...nav[kind], view: { type: "all" } };
              }
            }
            return {
              nav,
              expanded: state.expanded.filter((folderId) => !drop.has(folderId)),
              folders: state.folders.filter((folder) => !drop.has(folder.id)),
              assets: state.assets.map((item) =>
                item.folderIds.some((folderId) => drop.has(folderId))
                  ? touch(item, {
                      folderIds: item.folderIds.filter((folderId) => !drop.has(folderId)),
                    })
                  : item,
              ),
            };
          });
        },
        assignFolder: (assetId, folderId) => {
          const folder = get().folders.find((item) => item.id === folderId);
          if (!folder) return;
          patchAsset(assetId, (item) =>
            item.kind !== folder.kind || item.folderIds.includes(folderId)
              ? null
              : touch(item, { folderIds: [...item.folderIds, folderId] }),
          );
        },
        unassignFolder: (assetId, folderId) =>
          patchAsset(assetId, (item) =>
            item.folderIds.includes(folderId)
              ? touch(item, { folderIds: item.folderIds.filter((id) => id !== folderId) })
              : null,
          ),
        updateAsset: (id, patch) => patchAsset(id, (item) => touch(item, patch)),
        setScore: (id, criterion, value) =>
          patchAsset(id, (item) =>
            scoreEntry(item, criterion, value, item.criteria[criterion]?.note ?? ""),
          ),
        setCriterionNote: (id, criterion, note) =>
          patchAsset(id, (item) =>
            scoreEntry(item, criterion, item.criteria[criterion]?.value ?? null, note),
          ),
        addTag: (id, tag) => {
          const trimmed = tag.trim();
          if (!trimmed) return;
          patchAsset(id, (item) =>
            item.tags.includes(trimmed) ? null : touch(item, { tags: [...item.tags, trimmed] }),
          );
        },
        removeTag: (id, tag) =>
          patchAsset(id, (item) =>
            touch(item, { tags: item.tags.filter((value) => value !== tag) }),
          ),
        addSample: (id, name) => {
          const trimmed = name.trim().toLowerCase();
          if (!ICON_NAME.test(trimmed)) return;
          patchAsset(id, (item) =>
            item.samples.includes(trimmed)
              ? null
              : touch(item, { samples: [...item.samples, trimmed] }),
          );
        },
        removeSample: (id, name) =>
          patchAsset(id, (item) =>
            touch(item, { samples: item.samples.filter((value) => value !== name) }),
          ),
        markUsed: (id) =>
          patchAsset(id, (item) => ({ ...item, lastUsedAt: new Date().toISOString() })),
        addAssets: (incoming, origin = {}) => {
          const { assets, added } = mergeNewAssets(get().assets, incoming, {
            now: new Date().toISOString(),
            ...origin,
          });
          if (added.length) set({ assets });
          return added;
        },
      };
    },
    {
      name: "atelier-library",
      version: 5,
      skipHydration: true,
      migrate: (persisted, version) => migrateLibrary(persisted, version) as LibraryState,
      partialize: (state): LibraryData => ({
        kind: state.kind,
        nav: {
          font: { ...state.nav.font, query: "" },
          icon: { ...state.nav.icon, query: "" },
        },
        expanded: state.expanded,
        folders: state.folders,
        assets: state.assets,
      }),
    },
  ),
);
