import { create } from "zustand";
import { persist } from "zustand/middleware";
import { equalize, setSizes, type Box, type Sizes } from "./layout.ts";
import type { Selection } from "./selection.ts";
import {
  DEFAULT_SYNC,
  alignSettings,
  applySettings,
  createWorkspace,
  reconcile,
  sanitizeWorkspace,
  type PaneSettings,
  type SyncFlags,
  type SyncKey,
  type TabKey,
  type Workspace,
} from "./workspace-model.ts";

export type DragPayload =
  { type: "asset"; assetId: string } | { type: "tab"; fromPaneId: string; key: TabKey };

export type InspectorTab = "avaliacao" | "detalhes";

type WorkspaceState = Workspace & {
  sync: SyncFlags;
  /** Inspector column on wide screens. */
  inspectorOpen: boolean;
  /** Inspector drawer on narrow screens; starts closed, not persisted. */
  inspectorDrawer: boolean;
  inspectorTab: InspectorTab;
  /** What is being dragged right now; not persisted. */
  drag: DragPayload | null;
  /** Bumped when sizes change outside a drag, so the panel groups re-apply them. */
  layoutEpoch: number;
  /** False on narrow screens, where only the active pane shows. */
  canSplit: boolean;
  /** The workspace's size in pixels, measured on screen; null until then. Not persisted. */
  area: Box | null;
  /** Each pane's comparison selection, kept while an item is open over the collection; not persisted. */
  selections: Record<string, Selection>;
  update: (op: (ws: Workspace) => Workspace) => void;
  setSizes: (splitId: string, layout: Sizes) => void;
  equalize: (splitId?: string) => void;
  updateSettings: (paneId: string, patch: Partial<PaneSettings>) => void;
  setSync: (key: SyncKey, on: boolean) => void;
  /** Opens or closes the inspector in whichever form the screen uses. */
  setInspector: (open: boolean) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setDrag: (drag: DragPayload | null) => void;
  setCanSplit: (canSplit: boolean) => void;
  setSelection: (paneId: string, selection: Selection) => void;
  setArea: (area: Box) => void;
  reconcile: (assetIds: Set<string>) => void;
};

const pickWorkspace = (state: WorkspaceState): Workspace => ({
  root: state.root,
  panes: state.panes,
  activePaneId: state.activePaneId,
});

function sanitizeSync(value: unknown): SyncFlags {
  const raw = value && typeof value === "object" ? (value as Partial<SyncFlags>) : {};
  const flags = { ...DEFAULT_SYNC };
  for (const key of Object.keys(flags) as SyncKey[]) {
    if (typeof raw[key] === "boolean") flags[key] = raw[key];
  }
  return flags;
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...createWorkspace(),
      sync: DEFAULT_SYNC,
      inspectorOpen: true,
      inspectorDrawer: false,
      inspectorTab: "avaliacao",
      drag: null,
      layoutEpoch: 0,
      canSplit: true,
      selections: {},
      area: null,
      update: (op) => {
        const current = pickWorkspace(get());
        const next = op(current);
        if (next !== current) set(next);
      },
      setSizes: (splitId, layout) => {
        const root = setSizes(get().root, splitId, layout);
        if (root !== get().root) set({ root });
      },
      equalize: (splitId) =>
        set((state) => ({
          root: equalize(state.root, splitId),
          layoutEpoch: state.layoutEpoch + 1,
        })),
      updateSettings: (paneId, patch) =>
        set((state) => applySettings(pickWorkspace(state), paneId, patch, state.sync)),
      setSync: (key, on) =>
        set((state) => {
          const sync = { ...state.sync, [key]: on };
          return on
            ? { sync, ...alignSettings(pickWorkspace(state), state.activePaneId, key) }
            : { sync };
        }),
      setInspector: (open) =>
        set((state) => (state.canSplit ? { inspectorOpen: open } : { inspectorDrawer: open })),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setDrag: (drag) => set({ drag }),
      setCanSplit: (canSplit) => set({ canSplit }),
      setArea: (area) => set({ area }),
      setSelection: (paneId, selection) =>
        set((state) => ({ selections: { ...state.selections, [paneId]: selection } })),
      reconcile: (assetIds) => set((state) => reconcile(pickWorkspace(state), assetIds)),
    }),
    {
      name: "atelier-workspace",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({
        ...pickWorkspace(state),
        sync: state.sync,
        inspectorOpen: state.inspectorOpen,
        inspectorTab: state.inspectorTab,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Record<string, unknown>;
        const ws = sanitizeWorkspace(raw);
        return {
          ...current,
          ...(ws ?? {}),
          sync: sanitizeSync(raw.sync),
          inspectorOpen:
            typeof raw.inspectorOpen === "boolean" ? raw.inspectorOpen : current.inspectorOpen,
          inspectorTab:
            raw.inspectorTab === "detalhes" || raw.inspectorTab === "avaliacao"
              ? raw.inspectorTab
              : current.inspectorTab,
        };
      },
    },
  ),
);
