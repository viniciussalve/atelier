import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Kind = "font" | "icon";
export type View =
  | { type: "all" }
  | { type: "uncategorized" }
  | { type: "untagged" }
  | { type: "recent" }
  | { type: "folder"; id: string };

export type Folder = {
  id: string;
  name: string;
  kind: Kind;
  parentId: string | null;
};

export type Verdict = "" | "usar" | "revisar" | "evitar";

export type Asset = {
  id: string;
  kind: Kind;
  name: string;
  folderIds: string[];
  tags: string[];
  notes: string;
  url: string;
  rating: number;
  verdict: Verdict;
  criteria: Record<string, number>;
  family: string;
  style: string;
  weights: string;
  format: string;
  sizeLabel: string;
  license: string;
  iconKey: string;
  samples: string[];
  createdAt: string;
  modifiedAt: string;
  importedAt: string;
  lastUsedAt: string | null;
};

export type PreviewMode = "preview" | "waterfall" | "glyphs" | "info";
export type PreviewGround = "paper" | "mist" | "ink" | "navy" | "sand";

type LibraryState = {
  kind: Kind;
  view: View;
  selectedId: string | null;
  query: string;
  sampleText: string;
  previewMode: PreviewMode;
  ground: PreviewGround;
  zoom: number;
  folders: Folder[];
  assets: Asset[];
  setKind: (kind: Kind) => void;
  focus: (kind: Kind, view: View) => void;
  setView: (view: View) => void;
  setQuery: (query: string) => void;
  selectAsset: (id: string | null) => void;
  openAsset: (id: string, folderId?: string) => void;
  setSampleText: (sampleText: string) => void;
  setPreviewMode: (previewMode: PreviewMode) => void;
  setGround: (ground: PreviewGround) => void;
  setZoom: (zoom: number) => void;
  createFolder: (name: string, kind?: Kind) => string | null;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  assignFolder: (assetId: string, folderId: string) => void;
  unassignFolder: (assetId: string, folderId: string) => void;
  updateAsset: (id: string, patch: Partial<Pick<Asset, "name" | "notes" | "url" | "rating" | "verdict" | "criteria">>) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
};

const now = "2026-10-19T12:00:00.000Z";

function asset(partial: Omit<Asset, "createdAt" | "modifiedAt" | "importedAt" | "lastUsedAt" | "notes" | "url" | "rating" | "verdict" | "criteria" | "license" | "weights" | "style" | "iconKey" | "samples" | "family" | "format" | "sizeLabel"> & Partial<Asset>): Asset {
  return {
    notes: "",
    url: "",
    rating: 0,
    verdict: "",
    criteria: {},
    license: "",
    weights: "",
    style: "",
    iconKey: "",
    samples: [],
    family: "",
    format: "",
    sizeLabel: "",
    createdAt: now,
    modifiedAt: now,
    importedAt: now,
    lastUsedAt: null,
    ...partial,
  };
}

const seedFolders: Folder[] = [
  { id: "f-sans", name: "Sans serif", kind: "font", parentId: null },
  { id: "f-mono", name: "Monoespaçadas", kind: "font", parentId: null },
  { id: "f-display", name: "Títulos", kind: "font", parentId: null },
  { id: "f-ui", name: "Interface", kind: "font", parentId: "f-sans" },
  { id: "i-ui", name: "Interface", kind: "icon", parentId: null },
  { id: "i-brand", name: "Marcas", kind: "icon", parentId: null },
];

const seedAssets: Asset[] = [
  asset({
    id: "inter",
    kind: "font",
    name: "Inter",
    folderIds: ["f-sans", "f-ui"],
    tags: ["legível", "ui"],
    rating: 5,
    family: "Inter, sans-serif",
    style: "Sans serif",
    weights: "400–600",
    format: "WOFF2",
    sizeLabel: "312 KB",
    license: "OFL",
    notes: "Corpo de chat e labels. Distingue bem I, l e 1.",
  }),
  asset({
    id: "ibm-plex",
    kind: "font",
    name: "IBM Plex Sans",
    folderIds: ["f-sans", "f-ui"],
    tags: ["técnica"],
    rating: 4,
    family: '"IBM Plex Sans", sans-serif',
    style: "Sans serif",
    weights: "400–600",
    format: "WOFF2",
    sizeLabel: "248 KB",
    license: "OFL",
  }),
  asset({
    id: "source-sans",
    kind: "font",
    name: "Source Sans 3",
    folderIds: ["f-sans"],
    tags: ["leitura"],
    rating: 4,
    family: '"Source Sans 3", sans-serif',
    style: "Sans serif",
    weights: "400–600",
    format: "WOFF2",
    sizeLabel: "220 KB",
    license: "OFL",
  }),
  asset({
    id: "roboto",
    kind: "font",
    name: "Roboto",
    folderIds: ["f-sans"],
    tags: ["sistema"],
    rating: 3,
    family: "Roboto, sans-serif",
    style: "Sans serif",
    weights: "400–700",
    format: "WOFF2",
    sizeLabel: "190 KB",
    license: "Apache 2.0",
  }),
  asset({
    id: "noto",
    kind: "font",
    name: "Noto Sans",
    folderIds: [],
    tags: ["multilíngue"],
    rating: 4,
    family: '"Noto Sans", sans-serif',
    style: "Sans serif",
    weights: "400–600",
    format: "TTF",
    sizeLabel: "582 KB",
    license: "OFL",
    notes: "Ainda sem pasta. Cobertura ampla de glifos.",
  }),
  asset({
    id: "jetbrains",
    kind: "font",
    name: "JetBrains Mono",
    folderIds: ["f-mono"],
    tags: ["código"],
    rating: 5,
    family: '"JetBrains Mono", monospace',
    style: "Monoespaçada",
    weights: "400–500",
    format: "WOFF2",
    sizeLabel: "276 KB",
    license: "OFL",
    notes: "Logs e blocos de código nas respostas.",
  }),
  asset({
    id: "ibm-mono",
    kind: "font",
    name: "IBM Plex Mono",
    folderIds: ["f-mono"],
    tags: ["código"],
    rating: 4,
    family: '"IBM Plex Mono", monospace',
    style: "Monoespaçada",
    weights: "400–500",
    format: "WOFF2",
    sizeLabel: "198 KB",
    license: "OFL",
  }),
  asset({
    id: "space",
    kind: "font",
    name: "Space Grotesk",
    folderIds: ["f-display"],
    tags: ["título"],
    rating: 3,
    family: '"Space Grotesk", sans-serif',
    style: "Display",
    weights: "500–600",
    format: "WOFF2",
    sizeLabel: "84 KB",
    license: "OFL",
    notes: "Só títulos. Evitar em parágrafos longos.",
  }),
  asset({
    id: "playfair",
    kind: "font",
    name: "Playfair Display",
    folderIds: ["f-display"],
    tags: ["serif"],
    rating: 2,
    family: '"Playfair Display", serif',
    style: "Serif",
    weights: "500–600",
    format: "WOFF2",
    sizeLabel: "140 KB",
    license: "OFL",
    notes: "Editorial. Pouco confortável em UI densa.",
  }),
  asset({
    id: "lucide",
    kind: "icon",
    name: "Lucide",
    folderIds: ["i-ui"],
    tags: ["contorno", "ui"],
    rating: 5,
    iconKey: "lucide",
    samples: ["house", "search", "settings", "bell", "user", "check", "link", "sparkles"],
    format: "lucide",
    style: "Contorno",
    sizeLabel: "1.891 ícones",
    license: "ISC",
    url: "https://icon-sets.iconify.design/lucide/",
    notes: "Traço consistente. Bom para estados de agente e ações de interface.",
  }),
  asset({
    id: "tabler",
    kind: "icon",
    name: "Tabler Icons",
    folderIds: ["i-ui"],
    tags: ["contorno", "ui"],
    rating: 4,
    iconKey: "tabler",
    samples: ["home", "search", "settings", "bell", "user", "check"],
    format: "tabler",
    style: "Contorno",
    sizeLabel: "6.238 ícones",
    license: "MIT",
    url: "https://icon-sets.iconify.design/tabler/",
  }),
  asset({
    id: "heroicons",
    kind: "icon",
    name: "Heroicons",
    folderIds: ["i-ui"],
    tags: ["contorno"],
    rating: 4,
    iconKey: "heroicons",
    samples: ["home", "magnifying-glass", "cog-6-tooth", "bell", "user", "check"],
    format: "heroicons",
    style: "Contorno",
    sizeLabel: "Conjunto",
    license: "MIT",
    url: "https://icon-sets.iconify.design/heroicons/",
  }),
  asset({
    id: "phosphor",
    kind: "icon",
    name: "Phosphor",
    folderIds: ["i-ui"],
    tags: ["pesos"],
    rating: 4,
    iconKey: "ph",
    samples: ["house", "magnifying-glass", "gear", "bell", "user", "check"],
    format: "ph",
    style: "Vários pesos",
    sizeLabel: "Conjunto",
    license: "MIT",
    url: "https://icon-sets.iconify.design/ph/",
  }),
  asset({
    id: "mdi",
    kind: "icon",
    name: "Material Design Icons",
    folderIds: ["i-ui"],
    tags: ["preenchido"],
    rating: 3,
    iconKey: "mdi",
    samples: ["home-outline", "magnify", "cog-outline", "bell-outline"],
    format: "mdi",
    style: "Material",
    sizeLabel: "7.447 ícones",
    license: "Apache 2.0",
    url: "https://icon-sets.iconify.design/mdi/",
    notes: "Muito amplo. Prefira um subconjunto pequeno na interface do agente.",
  }),
  asset({
    id: "remix",
    kind: "icon",
    name: "Remix Icon",
    folderIds: ["i-ui"],
    tags: ["linha"],
    rating: 3,
    iconKey: "ri",
    samples: ["home-line", "search-line", "settings-3-line", "notification-3-line"],
    format: "ri",
    style: "Linha e preenchido",
    sizeLabel: "3.188 ícones",
    license: "Apache 2.0",
    url: "https://icon-sets.iconify.design/ri/",
  }),
  asset({
    id: "simple-icons",
    kind: "icon",
    name: "Simple Icons",
    folderIds: ["i-brand"],
    tags: ["marcas"],
    rating: 4,
    iconKey: "simple-icons",
    samples: ["github", "figma", "notion", "slack"],
    format: "simple-icons",
    style: "Marcas",
    sizeLabel: "Conjunto",
    license: "CC0",
    url: "https://icon-sets.iconify.design/simple-icons/",
    notes: "Logotipos. Não usar como ícone de ação.",
  }),
  asset({
    id: "carbon",
    kind: "icon",
    name: "Carbon",
    folderIds: [],
    tags: [],
    rating: 3,
    iconKey: "carbon",
    samples: ["home", "search", "settings", "notification", "user", "checkmark"],
    format: "carbon",
    style: "IBM",
    sizeLabel: "Conjunto",
    license: "Apache 2.0",
    url: "https://icon-sets.iconify.design/carbon/",
    notes: "Ainda sem pasta. Comparar com Lucide antes de adotar.",
  }),
];

function touch(assetItem: Asset, patch: Partial<Asset>): Asset {
  return { ...assetItem, ...patch, modifiedAt: new Date().toISOString() };
}

function descendantIds(folders: Folder[], id: string): string[] {
  const kids = folders.filter((folder) => folder.parentId === id);
  return kids.flatMap((kid) => [kid.id, ...descendantIds(folders, kid.id)]);
}

export function folderScope(folders: Folder[], id: string): string[] {
  return [id, ...descendantIds(folders, id)];
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      kind: "font",
      view: { type: "all" },
      selectedId: null,
      query: "",
      sampleText:
        "A pessoa pergunta e o agente responde. O que fica na tela precisa ser lido sem esforço, inclusive quando a resposta passa de um parágrafo. I, l e 1, e também O e 0, têm de continuar distintos em 10, 100 e na palavra Ilustração.",
      previewMode: "preview",
      ground: "paper",
      zoom: 16,
      folders: seedFolders,
      assets: seedAssets,
      setKind: (kind) => set({ kind, view: { type: "all" }, selectedId: null, query: "" }),
      focus: (kind, view) => set({ kind, view, selectedId: null }),
      setView: (view) => set({ view, selectedId: null }),
      setQuery: (query) => set({ query }),
      selectAsset: (id) =>
        set((state) => ({
          selectedId: id,
          assets: id
            ? state.assets.map((item) =>
                item.id === id ? { ...item, lastUsedAt: new Date().toISOString() } : item,
              )
            : state.assets,
        })),
      openAsset: (id, folderId) => {
        const state = get();
        const item = state.assets.find((asset) => asset.id === id);
        if (!item) return;
        const view: View = folderId
          ? { type: "folder", id: folderId }
          : item.folderIds[0]
            ? { type: "folder", id: item.folderIds[0] }
            : { type: "all" };
        set({
          kind: item.kind,
          view,
          selectedId: id,
          assets: state.assets.map((asset) =>
            asset.id === id ? { ...asset, lastUsedAt: new Date().toISOString() } : asset,
          ),
        });
      },
      setSampleText: (sampleText) => set({ sampleText }),
      setPreviewMode: (previewMode) => set({ previewMode }),
      setGround: (ground) => set({ ground }),
      setZoom: (zoom) => set({ zoom }),
      createFolder: (name, kind) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const state = get();
        const target = kind ?? state.kind;
        const view = state.view;
        const parent = view.type === "folder" ? state.folders.find((folder) => folder.id === view.id) : null;
        const parentId = parent && parent.kind === target ? parent.id : null;
        const id = `folder-${Date.now()}`;
        set({
          kind: target,
          view: { type: "folder", id },
          folders: [...state.folders, { id, name: trimmed, kind: target, parentId }],
        });
        return id;
      },
      renameFolder: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          folders: state.folders.map((folder) => (folder.id === id ? { ...folder, name: trimmed } : folder)),
        }));
      },
      deleteFolder: (id) => {
        const { folders } = get();
        const drop = new Set([id, ...descendantIds(folders, id)]);
        set((state) => ({
          folders: state.folders.filter((folder) => !drop.has(folder.id)),
          assets: state.assets.map((item) =>
            item.folderIds.some((folderId) => drop.has(folderId))
              ? touch(item, { folderIds: item.folderIds.filter((folderId) => !drop.has(folderId)) })
              : item,
          ),
          view: state.view.type === "folder" && drop.has(state.view.id) ? { type: "all" } : state.view,
        }));
      },
      assignFolder: (assetId, folderId) => {
        const folder = get().folders.find((item) => item.id === folderId);
        if (!folder) return;
        set((state) => ({
          assets: state.assets.map((item) => {
            if (item.id !== assetId || item.kind !== folder.kind) return item;
            if (item.folderIds.includes(folderId)) return item;
            return touch(item, { folderIds: [...item.folderIds, folderId] });
          }),
        }));
      },
      unassignFolder: (assetId, folderId) =>
        set((state) => ({
          assets: state.assets.map((item) =>
            item.id === assetId
              ? touch(item, { folderIds: item.folderIds.filter((id) => id !== folderId) })
              : item,
          ),
        })),
      updateAsset: (id, patch) =>
        set((state) => ({
          assets: state.assets.map((item) => (item.id === id ? touch(item, patch) : item)),
        })),
      addTag: (id, tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return;
        set((state) => ({
          assets: state.assets.map((item) => {
            if (item.id !== id || item.tags.includes(trimmed)) return item;
            return touch(item, { tags: [...item.tags, trimmed] });
          }),
        }));
      },
      removeTag: (id, tag) =>
        set((state) => ({
          assets: state.assets.map((item) =>
            item.id === id ? touch(item, { tags: item.tags.filter((value) => value !== tag) }) : item,
          ),
        })),
    }),
    { name: "atelier-library", version: 3, skipHydration: true, migrate: migrateLibrary },
  ),
);

function migrateLibrary(persisted: unknown, version: number) {
  if (!persisted || typeof persisted !== "object") return persisted as LibraryState;
  const state = persisted as Partial<LibraryState>;
  let folders = state.folders ?? [];
  let assets = state.assets ?? [];
  if (version < 2) {
    const keptFonts = assets.filter((item) => item.kind === "font").map((item) => ({ ...item, samples: item.samples ?? [] }));
    folders = [...folders.filter((folder) => folder.kind === "font"), ...seedFolders.filter((folder) => folder.kind === "icon")];
    assets = [...keptFonts, ...seedAssets.filter((item) => item.kind === "icon")];
  }
  return {
    ...state,
    folders,
    assets: assets.map((item) => ({
      ...item,
      samples: item.samples ?? [],
      verdict: item.verdict ?? "",
      criteria: item.criteria ?? {},
    })),
  };
}

export function visibleAssets(state: Pick<LibraryState, "assets" | "folders" | "kind" | "view" | "query">): Asset[] {
  const scoped = state.assets.filter((item) => item.kind === state.kind);
  let list = scoped;
  if (state.view.type === "uncategorized") list = scoped.filter((item) => item.folderIds.length === 0);
  else if (state.view.type === "untagged") list = scoped.filter((item) => item.tags.length === 0);
  else if (state.view.type === "recent") {
    list = scoped.filter((item) => item.lastUsedAt).sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""));
  } else if (state.view.type === "folder") {
    const ids = new Set(folderScope(state.folders, state.view.id));
    list = scoped.filter((item) => item.folderIds.some((id) => ids.has(id)));
  }
  const query = state.query.trim().toLowerCase();
  if (!query) return list;
  return list.filter((item) => {
    const folderNames = state.folders
      .filter((folder) => item.folderIds.includes(folder.id))
      .map((folder) => folder.name)
      .join(" ");
    return [item.name, item.notes, item.tags.join(" "), item.style, item.iconKey, (item.samples ?? []).join(" "), folderNames]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}
