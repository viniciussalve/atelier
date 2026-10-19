import { useMemo } from "react";
import { collectionList } from "./filters.ts";
import { canHalve, type Edge } from "./layout.ts";
import { useLibrary } from "./store.ts";
import type { Asset, Kind } from "./types.ts";
import { useWorkspace } from "./workspace.ts";
import { MAX_PANES, PANE_MIN, assetIdOf, type Pane } from "./workspace-model.ts";

export function useAsset(id: string | null): Asset | undefined {
  return useLibrary((state) => (id ? state.assets.find((item) => item.id === id) : undefined));
}

export function usePane(id: string): Pane | undefined {
  return useWorkspace((state) => state.panes[id]);
}

export function useActivePane(): Pane | undefined {
  return useWorkspace((state) => state.panes[state.activePaneId]);
}

/** The item shown in the active pane, if any. */
export function useActiveAsset(): Asset | undefined {
  const pane = useActivePane();
  return useAsset(pane ? assetIdOf(pane.active) : null);
}

/** The current view of a library after search, filters and sorting. */
export function useCollection(kind: Kind) {
  const assets = useLibrary((state) => state.assets);
  const folders = useLibrary((state) => state.folders);
  const nav = useLibrary((state) => state.nav[kind]);
  return useMemo(
    () => collectionList({ assets, folders }, kind, nav),
    [assets, folders, kind, nav],
  );
}

/**
 * Whether a pane can split toward `edge`: below the pane cap, and with room for
 * two halves of at least PANE_MIN in the measured workspace.
 */
export function useRoomToSplit(paneId: string, edge: Edge): boolean {
  return useWorkspace(
    (state) =>
      Object.keys(state.panes).length < MAX_PANES &&
      (!state.area || canHalve(state.root, paneId, edge, state.area, PANE_MIN)),
  );
}
