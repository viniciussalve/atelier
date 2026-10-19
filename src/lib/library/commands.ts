/**
 * Actions that touch both stores: the library (data, views, filters) and the
 * workspace (panes and tabs). Components call these instead of reaching into
 * either store for multi-step flows.
 */
import { collectionList } from "./filters.ts";
import type { DropZone, Edge } from "./layout.ts";
import { useLibrary } from "./store.ts";
import type { CriterionId, Kind, Score, View } from "./types.ts";
import { useWorkspace, type DragPayload } from "./workspace.ts";
import {
  activateTab,
  assetIdOf,
  assetKey,
  closePane,
  closeTab,
  compare,
  dropAsset,
  dropTab,
  focusPane,
  moveTab,
  openCollection,
  openTab,
  openToSide,
  orderedPanes,
  pinTab,
  replaceTab,
  roomForItems,
  splitPane,
  type TabKey,
} from "./workspace-model.ts";

export type OpenMode = "preview" | "pin" | "side";

const lib = () => useLibrary.getState();
const ws = () => useWorkspace.getState();

/** Opens an item in a pane (the active one by default). */
/**
 * The space new panes can count on, so they keep PANE_MIN; unknown before the
 * first measure. Opening an item brings the inspector column out if it is open.
 */
export function roomFor(opensItem: boolean) {
  const { area, inspectorOpen } = ws();
  if (!area) return undefined;
  return opensItem ? roomForItems(area, inspectorOpen, activeAssetId() !== null) : area;
}

export function openItem(assetId: string, mode: OpenMode, paneId?: string) {
  lib().markUsed(assetId);
  const key = assetKey(assetId);
  ws().update((state) => {
    const target = paneId && state.panes[paneId] ? paneId : state.activePaneId;
    if (mode === "side" && ws().canSplit) return openToSide(state, target, key, roomFor(true));
    return openTab(state, target, key, { preview: mode === "preview" });
  });
}

/** Switches the sidebar view and brings the collection to front. */
export function showView(kind: Kind, view: View) {
  lib().setView(kind, view);
  ws().update(openCollection);
}

export function showLibrary(kind: Kind) {
  lib().setKind(kind);
  ws().update(openCollection);
}

export function compareItems(assetIds: string[]) {
  assetIds.forEach((id) => lib().markUsed(id));
  ws().update((state) => compare(state, assetIds.map(assetKey), roomFor(true)));
}

export function activate(paneId: string, key: TabKey) {
  ws().update((state) => activateTab(state, paneId, key));
}

export function pin(paneId: string, key: TabKey) {
  ws().update((state) => pinTab(state, paneId, key));
}

export function focus(paneId: string) {
  ws().update((state) => focusPane(state, paneId));
}

export function close(paneId: string, key: TabKey) {
  ws().update((state) => closeTab(state, paneId, key));
}

export function closeWholePane(paneId: string) {
  ws().update((state) => closePane(state, paneId));
}

export function split(paneId: string, edge: Edge) {
  if (!ws().canSplit) return;
  ws().update((state) => splitPane(state, paneId, edge, undefined, roomFor(false)));
}

/** The item before or after, in the collection order of its library. */
export function neighborItem(assetId: string, step: -1 | 1): string | null {
  const { assets, folders, nav } = lib();
  const item = assets.find((entry) => entry.id === assetId);
  if (!item) return null;
  const { list } = collectionList({ assets, folders }, item.kind, nav[item.kind]);
  const index = list.findIndex((entry) => entry.id === assetId);
  if (index < 0) return null;
  return list[index + step]?.id ?? null;
}

/**
 * Steps to the previous or next item. Browsing does not count as use: marking
 * each step would reorder Recentes under the arrows and bounce between two items.
 */
export function navigate(paneId: string, assetId: string, step: -1 | 1) {
  const next = neighborItem(assetId, step);
  if (!next) return;
  ws().update((state) => replaceTab(state, paneId, assetKey(assetId), assetKey(next)));
}

let dragTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Marks a drag as started. Deferred a tick: changing the page under the
 * pointer inside `dragstart` (the drop overlays appear) can cancel the drag.
 */
export function beginDrag(payload: DragPayload) {
  clearTimeout(dragTimer);
  dragTimer = setTimeout(() => ws().setDrag(payload), 0);
}

export function endDrag() {
  clearTimeout(dragTimer);
  ws().setDrag(null);
}

export function moveTabTo(from: string, key: TabKey, to: string, index: number) {
  ws().update((state) => moveTab(state, from, key, to, index));
}

export function equalizeAll() {
  ws().equalize();
}

/** Drops whatever is being dragged onto a pane; `at` is a slot in its tab strip, for items. */
export function dropOnPane(paneId: string, zone: DropZone, at?: number) {
  const drag = ws().drag;
  endDrag();
  if (!drag) return;
  if (drag.type === "asset") {
    lib().markUsed(drag.assetId);
    ws().update((state) => dropAsset(state, drag.assetId, paneId, zone, roomFor(true), at));
  } else {
    ws().update((state) =>
      dropTab(state, drag.fromPaneId, drag.key, paneId, zone, roomFor(drag.key !== "collection")),
    );
  }
}

/** Scoring from a specimen also pins that item's tab. */
export function score(
  paneId: string,
  assetId: string,
  criterion: CriterionId,
  value: Score | null,
) {
  lib().setScore(assetId, criterion, value);
  pin(paneId, assetKey(assetId));
}

/** Scoring from the inspector, which shows the active pane's item, pins it the same way. */
export function scoreInActivePane(assetId: string, criterion: CriterionId, value: Score | null) {
  score(ws().activePaneId, assetId, criterion, value);
}

/** The item in the active pane, if its active tab is one. */
export function activeAssetId(): string | null {
  const state = ws();
  const pane = state.panes[state.activePaneId];
  return pane ? assetIdOf(pane.active) : null;
}

export function focusPaneAt(index: number) {
  const pane = orderedPanes(ws())[index];
  if (pane) focus(pane.id);
}
