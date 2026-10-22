/**
 * Panes and tabs of the workspace, as pure functions over a `Workspace`.
 *
 * Each pane is an editor group: a strip of tabs, one of them active. A tab is
 * either the collection (the grid or list of the current view, at most one per
 * pane) or an item. Like VS Code, a single click opens an item as the pane's
 * preview tab, which the next single click reuses; pinning keeps it.
 */
import {
  canHalve,
  firstLeaf,
  insertBeside,
  leaves,
  neighbor,
  normalize,
  removeLeaf,
  validateLayout,
  type Box,
  type DropZone,
  type Edge,
  type IdGen,
  type LayoutNode,
  type PaneLeaf,
  type SplitNode,
} from "./layout.ts";
import type { PreviewGround } from "./types.ts";

export const MAX_PANES = 6;
/** Below this a pane stops being usable; the panels use it as their minimum too. */
export const PANE_MIN: Box = { width: 220, height: 160 };

/** Width of the inspector column on wide screens. */
export const INSPECTOR_WIDTH = 320;

/**
 * The space panes will share once the item they open is in front: an open
 * inspector that is not showing yet (the collection is in front) takes its column then.
 */
export function roomForItems(area: Box, inspectorOpen: boolean, inspectorShowing: boolean): Box {
  if (!inspectorOpen || inspectorShowing) return area;
  return { width: Math.max(0, area.width - INSPECTOR_WIDTH), height: area.height };
}

/** Whether `paneId` has room to split toward `edge`; with no `area` measured, it always does. */
function fits(ws: Workspace, paneId: string, edge: Edge, area?: Box): boolean {
  return !area || canHalve(ws.root, paneId, edge, area, PANE_MIN);
}

export type TabKey = "collection" | `asset:${string}`;
export type FontSpecimenTab = "prova" | "interface" | "glifos";
export type IconSpecimenTab = "amostras" | "tamanhos" | "componentes";

export type PaneSettings = {
  sampleText: string;
  /** Base size of the font specimen, in px; its sections scale in em. */
  fontSize: number;
  iconSize: number;
  ground: PreviewGround;
  fontTab: FontSpecimenTab;
  iconTab: IconSpecimenTab;
};

export type Pane = {
  id: string;
  /** Never empty, no repeats. */
  tabs: TabKey[];
  active: TabKey;
  /** The tab a single click replaces; never the collection. */
  preview: TabKey | null;
  settings: PaneSettings;
};

export type Workspace = { root: LayoutNode; panes: Record<string, Pane>; activePaneId: string };
export type SyncKey = "text" | "size" | "ground" | "tab" | "scroll";
export type SyncFlags = Record<SyncKey, boolean>;

export const FONT_TABS: FontSpecimenTab[] = ["prova", "interface", "glifos"];
export const ICON_TABS: IconSpecimenTab[] = ["amostras", "tamanhos", "componentes"];
const GROUND_IDS: PreviewGround[] = ["paper", "mist", "ink", "navy", "sand"];

export const FONT_SIZE_RANGE = { min: 12, max: 28 } as const;
export const ICON_SIZE_RANGE = { min: 16, max: 48 } as const;

export const DEFAULT_PANE_SETTINGS: PaneSettings = {
  sampleText:
    "Você pergunta, o agente responde. Uma boa fonte de leitura some na frente do texto: o olho corre pela linha, acha o começo da seguinte e só para quando a ideia termina.",
  fontSize: 16,
  iconSize: 24,
  ground: "paper",
  fontTab: "prova",
  iconTab: "amostras",
};

export const DEFAULT_SYNC: SyncFlags = {
  text: true,
  size: true,
  ground: true,
  tab: true,
  scroll: false,
};

/** Which sync flag governs each pane setting. */
export const SYNC_FIELDS: Record<SyncKey, (keyof PaneSettings)[]> = {
  text: ["sampleText"],
  size: ["fontSize", "iconSize"],
  ground: ["ground"],
  tab: ["fontTab", "iconTab"],
  scroll: [],
};

export const assetKey = (id: string): TabKey => `asset:${id}`;

export function assetIdOf(key: TabKey): string | null {
  return key.startsWith("asset:") ? key.slice(6) : null;
}

export function isTabKey(value: unknown): value is TabKey {
  return value === "collection" || (typeof value === "string" && /^asset:.+/.test(value));
}

export function paneCount(ws: Workspace): number {
  return leaves(ws.root).length;
}

/** Panes in reading order. */
export function orderedPanes(ws: Workspace): Pane[] {
  return leaves(ws.root)
    .map((id) => ws.panes[id])
    .filter(Boolean);
}

export function findPaneWithTab(ws: Workspace, key: TabKey): string | null {
  return leaves(ws.root).find((id) => ws.panes[id]?.tabs.includes(key)) ?? null;
}

export function createWorkspace(settings: PaneSettings = DEFAULT_PANE_SETTINGS): Workspace {
  const id = "pane-1";
  return {
    root: { type: "pane", id },
    panes: {
      [id]: {
        id,
        tabs: ["collection"],
        active: "collection",
        preview: null,
        settings: { ...settings },
      },
    },
    activePaneId: id,
  };
}

function nodeIds(node: LayoutNode): string[] {
  return node.type === "pane" ? [node.id] : [node.id, ...node.children.flatMap(nodeIds)];
}

/** Fresh `pane-N` / `split-N` ids that do not clash with the workspace. */
function idGenFor(ws: Workspace): IdGen {
  const used = new Set([...nodeIds(ws.root), ...Object.keys(ws.panes)]);
  const last = { pane: 0, split: 0 };
  for (const id of used) {
    const match = /^(pane|split)-(\d+)$/.exec(id);
    if (match) {
      const prefix = match[1] as "pane" | "split";
      last[prefix] = Math.max(last[prefix], Number(match[2]));
    }
  }
  return (prefix) => {
    let id: string;
    do id = `${prefix}-${++last[prefix]}`;
    while (used.has(id));
    used.add(id);
    return id;
  };
}

/**
 * The entries of `byPane` whose pane is still open; the same object when none
 * is gone. Ids come back after a pane closes (`idGenFor` counts from the panes
 * left), so state kept by pane id must go with its pane.
 */
export function keepPanes<T>(
  byPane: Record<string, T>,
  panes: Record<string, unknown>,
): Record<string, T> {
  const open = Object.keys(byPane).filter((id) => Object.hasOwn(panes, id));
  if (open.length === Object.keys(byPane).length) return byPane;
  return Object.fromEntries(open.map((id) => [id, byPane[id]]));
}

function withPane(ws: Workspace, pane: Pane, focus = true): Workspace {
  return {
    ...ws,
    panes: { ...ws.panes, [pane.id]: pane },
    activePaneId: focus ? pane.id : ws.activePaneId,
  };
}

function resetPane(pane: Pane): Pane {
  return { ...pane, tabs: ["collection"], active: "collection", preview: null };
}

export function focusPane(ws: Workspace, paneId: string): Workspace {
  return ws.panes[paneId] && ws.activePaneId !== paneId ? { ...ws, activePaneId: paneId } : ws;
}

export function activateTab(ws: Workspace, paneId: string, key: TabKey): Workspace {
  const pane = ws.panes[paneId];
  if (!pane || !pane.tabs.includes(key)) return ws;
  return withPane(ws, { ...pane, active: key });
}

/**
 * Opens `key` in a pane: reuses the preview tab for previews, inserts after the
 * active tab otherwise. `at` is a slot in the tab strip (a drop there): the tab
 * goes in at it, or moves to it if already open.
 */
export function openTab(
  ws: Workspace,
  paneId: string,
  key: TabKey,
  options: { preview: boolean; at?: number },
): Workspace {
  const pane = ws.panes[paneId];
  if (!pane) return ws;
  if (options.at !== undefined && pane.tabs.includes(key)) {
    return moveTab(ws, paneId, key, paneId, options.at);
  }
  const asPreview = options.preview && key !== "collection";
  let tabs = pane.tabs;
  let preview = pane.preview;
  if (tabs.includes(key)) {
    if (!asPreview && preview === key) preview = null;
  } else if (asPreview && preview) {
    tabs = tabs.map((tab) => (tab === preview ? key : tab));
    preview = key;
  } else {
    const at = options.at ?? tabs.indexOf(pane.active) + 1;
    tabs = [...tabs.slice(0, at), key, ...tabs.slice(at)];
    if (asPreview) preview = key;
  }
  return withPane(ws, { ...pane, tabs, active: key, preview });
}

export function pinTab(ws: Workspace, paneId: string, key: TabKey): Workspace {
  const pane = ws.panes[paneId];
  if (!pane || pane.preview !== key) return ws;
  return withPane(ws, { ...pane, preview: null }, false);
}

/** Swaps one tab for another in place (previous/next item), keeping its preview state. */
export function replaceTab(ws: Workspace, paneId: string, from: TabKey, to: TabKey): Workspace {
  const pane = ws.panes[paneId];
  if (!pane) return ws;
  if (!pane.tabs.includes(from)) return openTab(ws, paneId, to, { preview: true });
  if (pane.tabs.includes(to)) return activateTab(ws, paneId, to);
  return withPane(ws, {
    ...pane,
    tabs: pane.tabs.map((tab) => (tab === from ? to : tab)),
    active: to,
    preview: pane.preview === from ? to : pane.preview,
  });
}

/** Closes a tab; an emptied pane closes too, except the last one, which falls back to the collection. */
export function closeTab(ws: Workspace, paneId: string, key: TabKey): Workspace {
  const pane = ws.panes[paneId];
  if (!pane || !pane.tabs.includes(key)) return ws;
  const index = pane.tabs.indexOf(key);
  const tabs = pane.tabs.filter((tab) => tab !== key);
  if (tabs.length === 0) {
    return paneCount(ws) > 1 ? closePane(ws, paneId) : withPane(ws, resetPane(pane), false);
  }
  return withPane(
    ws,
    {
      ...pane,
      tabs,
      active: pane.active === key ? tabs[Math.min(index, tabs.length - 1)] : pane.active,
      preview: pane.preview === key ? null : pane.preview,
    },
    false,
  );
}

export function closePane(ws: Workspace, paneId: string): Workspace {
  const pane = ws.panes[paneId];
  if (!pane) return ws;
  if (paneCount(ws) <= 1) return withPane(ws, resetPane(pane));
  const { root, heir } = removeLeaf(ws.root, paneId);
  if (!root) return createWorkspace(pane.settings);
  const panes = { ...ws.panes };
  delete panes[paneId];
  const activePaneId = ws.activePaneId === paneId ? (heir ?? firstLeaf(root)) : ws.activePaneId;
  return { root, panes, activePaneId };
}

/**
 * Splits a pane. Without `tabs`, the new pane shows the source's active tab as
 * a preview, so the next click there picks what to compare against.
 */
export function splitPane(
  ws: Workspace,
  paneId: string,
  edge: Edge,
  tabs?: TabKey[],
  area?: Box,
): Workspace {
  const source = ws.panes[paneId];
  if (!source || paneCount(ws) >= MAX_PANES || !fits(ws, paneId, edge, area)) return ws;
  const gen = idGenFor(ws);
  const id = gen("pane");
  const newTabs = tabs?.length ? [...new Set(tabs)] : [source.active];
  const first = newTabs[0];
  const pane: Pane = {
    id,
    tabs: newTabs,
    active: first,
    preview: !tabs && first !== "collection" ? first : null,
    settings: { ...source.settings },
  };
  const leaf: PaneLeaf = { type: "pane", id };
  return {
    root: insertBeside(ws.root, paneId, leaf, edge, gen),
    panes: { ...ws.panes, [id]: pane },
    activePaneId: id,
  };
}

/** Moves a tab to another pane (or to `index` within its own), pinned. */
export function moveTab(
  ws: Workspace,
  from: string,
  key: TabKey,
  to: string,
  index?: number,
): Workspace {
  const source = ws.panes[from];
  const target = ws.panes[to];
  if (!source || !target || !source.tabs.includes(key)) return ws;
  if (from === to) {
    const rest = source.tabs.filter((tab) => tab !== key);
    let at = index ?? rest.length;
    if (index !== undefined && source.tabs.indexOf(key) < index) at -= 1;
    at = Math.max(0, Math.min(at, rest.length));
    return withPane(ws, {
      ...source,
      tabs: [...rest.slice(0, at), key, ...rest.slice(at)],
      active: key,
      preview: source.preview === key ? null : source.preview,
    });
  }
  let tabs = target.tabs;
  if (!tabs.includes(key)) {
    const at = Math.max(0, Math.min(index ?? tabs.indexOf(target.active) + 1, tabs.length));
    tabs = [...tabs.slice(0, at), key, ...tabs.slice(at)];
  }
  const moved = withPane(ws, {
    ...target,
    tabs,
    active: key,
    preview: target.preview === key ? null : target.preview,
  });
  const next = closeTab(moved, from, key);
  return next.panes[to] ? { ...next, activePaneId: to } : next;
}

/** Drops a dragged tab on a pane: the center moves it there, an edge splits. */
export function dropTab(
  ws: Workspace,
  from: string,
  key: TabKey,
  to: string,
  zone: DropZone,
  area?: Box,
): Workspace {
  const source = ws.panes[from];
  if (!source || !source.tabs.includes(key) || !ws.panes[to]) return ws;
  if (zone === "center") return from === to ? ws : moveTab(ws, from, key, to);
  if (from === to && source.tabs.length === 1) return ws;
  // Take the tab out first, so emptying its pane frees a slot for the split.
  const removed = closeTab(ws, from, key);
  if (!removed.panes[to] || paneCount(removed) >= MAX_PANES || !fits(removed, to, zone, area))
    return moveTab(ws, from, key, to);
  return splitPane(removed, to, zone, [key]);
}

/** Drops an item dragged from the sidebar or the collection; `at` is a slot in the tab strip. */
export function dropAsset(
  ws: Workspace,
  assetId: string,
  to: string,
  zone: DropZone,
  area?: Box,
  at?: number,
): Workspace {
  const key = assetKey(assetId);
  if (zone === "center" || paneCount(ws) >= MAX_PANES || !fits(ws, to, zone, area))
    return openTab(ws, to, key, { preview: false, at });
  return splitPane(ws, to, zone, [key]);
}

/**
 * "Abrir ao lado": the pane on the right, a new split, or, when full or out of
 * room, the next pane (the same one when it is alone).
 */
export function openToSide(ws: Workspace, from: string, key: TabKey, area?: Box): Workspace {
  const right = neighbor(ws.root, from, "right");
  if (right) return openTab(ws, right, key, { preview: false });
  if (paneCount(ws) < MAX_PANES && fits(ws, from, "right", area))
    return splitPane(ws, from, "right", [key]);
  const ids = leaves(ws.root);
  const next = ids[(ids.indexOf(from) + 1) % ids.length];
  return openTab(ws, next, key, { preview: false });
}

/** Shows the collection: the active pane's, else the first pane that has one, else a new tab. */
export function openCollection(ws: Workspace): Workspace {
  const active = ws.panes[ws.activePaneId];
  if (active?.tabs.includes("collection")) return activateTab(ws, active.id, "collection");
  const holder = findPaneWithTab(ws, "collection");
  if (holder) return activateTab(ws, holder, "collection");
  return openTab(ws, ws.activePaneId, "collection", { preview: false });
}

/**
 * How many of `n` compared items get a pane of their own in `area`, keeping
 * every pane at PANE_MIN: a row of up to three, two rows for four to six.
 */
function comparePanes(n: number, area?: Box): number {
  if (!area) return n;
  const columns = Math.floor(area.width / PANE_MIN.width);
  const twoRows = Math.floor(area.height / PANE_MIN.height) >= 2;
  for (let count = n; count > 1; count--) {
    if (count <= 3 ? count <= columns : twoRows && Math.ceil(count / 2) <= columns) return count;
  }
  return 1;
}

/**
 * One pane per item: a row for up to three, two rows for four to six. When
 * `area` holds fewer panes, the items left over become tabs of the last pane.
 */
export function compare(ws: Workspace, keys: TabKey[], area?: Box): Workspace {
  const list = [...new Set(keys)].filter((key) => key !== "collection").slice(0, MAX_PANES);
  if (list.length === 0) return ws;
  const count = comparePanes(list.length, area);
  if (count === 1) {
    const opened = list.reduceRight(
      (next, key) => openTab(next, next.activePaneId, key, { preview: false }),
      ws,
    );
    return activateTab(opened, opened.activePaneId, list[0]);
  }
  const rest = list.slice(count);
  const settings = ws.panes[ws.activePaneId]?.settings ?? DEFAULT_PANE_SETTINGS;
  const panes: Record<string, Pane> = {};
  const ids = list.slice(0, count).map((key, index) => {
    const id = `pane-${index + 1}`;
    const extra = index === count - 1 ? rest : [];
    panes[id] = {
      id,
      tabs: index === 0 ? ["collection", key, ...extra] : [key, ...extra],
      active: key,
      preview: null,
      settings: { ...settings },
    };
    return id;
  });
  const even = (children: LayoutNode[]) =>
    Object.fromEntries(children.map((child) => [child.id, 100 / children.length]));
  const row = (rowIds: string[], id: string): LayoutNode => {
    const children = rowIds.map((paneId): LayoutNode => ({ type: "pane", id: paneId }));
    return children.length === 1
      ? children[0]
      : { type: "split", id, orientation: "horizontal", children, sizes: even(children) };
  };
  let root: LayoutNode;
  if (count <= 3) {
    root = row(ids, "split-1");
  } else {
    const cut = Math.ceil(ids.length / 2);
    const children = [row(ids.slice(0, cut), "split-2"), row(ids.slice(cut), "split-3")];
    root = {
      type: "split",
      id: "split-1",
      orientation: "vertical",
      children,
      sizes: even(children),
    };
  }
  return { root: normalize(root), panes, activePaneId: ids[0] };
}

function pickSynced(patch: Partial<PaneSettings>, sync: SyncFlags): Partial<PaneSettings> {
  const picked: Partial<PaneSettings> = {};
  for (const [key, fields] of Object.entries(SYNC_FIELDS) as [SyncKey, (keyof PaneSettings)[]][]) {
    if (!sync[key]) continue;
    for (const field of fields) {
      if (field in patch) Object.assign(picked, { [field]: patch[field] });
    }
  }
  return picked;
}

/** Changes one pane's settings and repeats the synced fields on every other pane. */
export function applySettings(
  ws: Workspace,
  paneId: string,
  patch: Partial<PaneSettings>,
  sync: SyncFlags,
): Workspace {
  if (!ws.panes[paneId]) return ws;
  const shared = pickSynced(patch, sync);
  const panes: Record<string, Pane> = {};
  for (const [id, pane] of Object.entries(ws.panes)) {
    const change = id === paneId ? patch : shared;
    panes[id] = Object.keys(change).length
      ? { ...pane, settings: { ...pane.settings, ...change } }
      : pane;
  }
  return { ...ws, panes };
}

/** Copies one synced group of settings from a pane to all panes (when a sync flag turns on). */
export function alignSettings(ws: Workspace, paneId: string, key: SyncKey): Workspace {
  const source = ws.panes[paneId];
  if (!source) return ws;
  const patch: Partial<PaneSettings> = {};
  for (const field of SYNC_FIELDS[key]) Object.assign(patch, { [field]: source.settings[field] });
  return applySettings(ws, paneId, patch, {
    text: true,
    size: true,
    ground: true,
    tab: true,
    scroll: true,
  });
}

/** Drops tabs whose item no longer exists; falls back to a fresh workspace if anything is off. */
export function reconcile(ws: Workspace, assetIds: Set<string>): Workspace {
  let next = ws;
  for (const id of leaves(ws.root)) {
    for (const key of ws.panes[id]?.tabs ?? []) {
      const assetId = assetIdOf(key);
      if (assetId && !assetIds.has(assetId)) next = closeTab(next, id, key);
    }
  }
  return checkWorkspace(next).length ? createWorkspace() : next;
}

function isSettings(value: PaneSettings | undefined): boolean {
  return (
    !!value &&
    typeof value.sampleText === "string" &&
    Number.isFinite(value.fontSize) &&
    Number.isFinite(value.iconSize) &&
    GROUND_IDS.includes(value.ground) &&
    FONT_TABS.includes(value.fontTab) &&
    ICON_TABS.includes(value.iconTab)
  );
}

/** Invariant violations, empty for a well-formed workspace. */
export function checkWorkspace(ws: Workspace): string[] {
  const errors = validateLayout(ws.root);
  const ids = leaves(ws.root);
  const paneIds = Object.keys(ws.panes);
  if (paneIds.length !== ids.length || !ids.every((id) => ws.panes[id]))
    errors.push("panes do not match the layout");
  if (!ids.includes(ws.activePaneId)) errors.push("active pane is not in the layout");
  for (const id of ids) {
    const pane = ws.panes[id];
    if (!pane) continue;
    if (pane.id !== id) errors.push(`pane ${id} has id ${pane.id}`);
    if (!pane.tabs.length || !pane.tabs.every(isTabKey)) errors.push(`pane ${id} has bad tabs`);
    if (new Set(pane.tabs).size !== pane.tabs.length) errors.push(`pane ${id} repeats a tab`);
    if (!pane.tabs.includes(pane.active)) errors.push(`pane ${id} active tab is not open`);
    if (
      pane.preview !== null &&
      (pane.preview === "collection" || !pane.tabs.includes(pane.preview))
    ) {
      errors.push(`pane ${id} has a bad preview tab`);
    }
    if (!isSettings(pane.settings)) errors.push(`pane ${id} has bad settings`);
  }
  return errors;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isLayoutShape(value: unknown): value is LayoutNode {
  if (!isObject(value) || typeof value.id !== "string" || !value.id) return false;
  if (value.type === "pane") return true;
  if (value.type !== "split") return false;
  if (value.orientation !== "horizontal" && value.orientation !== "vertical") return false;
  if (!Array.isArray(value.children) || value.children.length === 0) return false;
  if (!isObject(value.sizes)) (value as Partial<SplitNode>).sizes = {};
  return value.children.every(isLayoutShape);
}

function clamp(value: unknown, range: { min: number; max: number }, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : fallback;
}

/** Default reading texts of earlier versions: a pane still showing one gets the current default. */
export const LEGACY_SAMPLE_TEXTS = [
  "A pessoa pergunta e o agente responde. O que fica na tela precisa ser lido sem esforço, inclusive quando a resposta passa de um parágrafo. I, l e 1, e também O e 0, têm de continuar distintos em 10, 100 e na palavra Ilustração.",
];

function sanitizeSettings(raw: unknown): PaneSettings {
  const value = isObject(raw) ? raw : {};
  const defaults = DEFAULT_PANE_SETTINGS;
  return {
    sampleText:
      typeof value.sampleText === "string" && !LEGACY_SAMPLE_TEXTS.includes(value.sampleText)
        ? value.sampleText
        : defaults.sampleText,
    fontSize: clamp(value.fontSize, FONT_SIZE_RANGE, defaults.fontSize),
    iconSize: clamp(value.iconSize, ICON_SIZE_RANGE, defaults.iconSize),
    ground: GROUND_IDS.includes(value.ground as PreviewGround)
      ? (value.ground as PreviewGround)
      : defaults.ground,
    // The Pesos tab became Interface, which now shows the weights at work.
    fontTab:
      value.fontTab === "pesos"
        ? "interface"
        : FONT_TABS.includes(value.fontTab as FontSpecimenTab)
          ? (value.fontTab as FontSpecimenTab)
          : defaults.fontTab,
    iconTab: ICON_TABS.includes(value.iconTab as IconSpecimenTab)
      ? (value.iconTab as IconSpecimenTab)
      : defaults.iconTab,
  };
}

/**
 * zustand `persist` migration for the workspace store. v2 starts with the inspector
 * closed; v1 saved it open for everyone, since that was the default, so close it once.
 */
export function migrateWorkspace(persisted: unknown, version: number): unknown {
  if (!isObject(persisted)) return persisted;
  return version < 2 ? { ...persisted, inspectorOpen: false } : persisted;
}

/** Rebuilds a workspace from persisted data, or null when it cannot be trusted. */
export function sanitizeWorkspace(raw: unknown): Workspace | null {
  if (!isObject(raw)) return null;
  // isLayoutShape fills in missing `sizes`, so it runs on the copy normalize gets.
  const shape = structuredClone(raw.root);
  if (!isLayoutShape(shape)) return null;
  const root = normalize(shape);
  if (validateLayout(root).length) return null;
  const rawPanes = isObject(raw.panes) ? raw.panes : {};
  const panes: Record<string, Pane> = {};
  for (const id of leaves(root)) {
    const value = isObject(rawPanes[id]) ? rawPanes[id] : {};
    const listed = Array.isArray(value.tabs) ? value.tabs.filter(isTabKey) : [];
    const tabs: TabKey[] = listed.length ? [...new Set(listed)] : ["collection"];
    const active = tabs.includes(value.active as TabKey) ? (value.active as TabKey) : tabs[0];
    const preview =
      value.preview !== "collection" && tabs.includes(value.preview as TabKey)
        ? (value.preview as TabKey)
        : null;
    panes[id] = { id, tabs, active, preview, settings: sanitizeSettings(value.settings) };
  }
  const ids = leaves(root);
  const activePaneId = ids.includes(raw.activePaneId as string)
    ? (raw.activePaneId as string)
    : ids[0];
  const ws: Workspace = { root, panes, activePaneId };
  return checkWorkspace(ws).length ? null : ws;
}
