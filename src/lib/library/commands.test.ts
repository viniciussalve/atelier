import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type * as Commands from "./commands.ts";
import type * as Store from "./store.ts";
import type * as WorkspaceStore from "./workspace.ts";
import type * as Model from "./workspace-model.ts";

// The stores persist to localStorage; give Node an in-memory one before loading them.
const memory = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, value),
    removeItem: (key: string) => void memory.delete(key),
  },
});

// Loaded after the localStorage stand-in above, hence dynamic imports.
type Modules = {
  commands: typeof Commands;
  store: typeof Store;
  workspace: typeof WorkspaceStore;
  model: typeof Model;
};
let m: Modules;

before(async () => {
  m = {
    commands: await import("./commands.ts"),
    store: await import("./store.ts"),
    workspace: await import("./workspace.ts"),
    model: await import("./workspace-model.ts"),
  };
});

beforeEach(() => {
  m.workspace.useWorkspace.setState(m.model.createWorkspace());
});

function activeItem() {
  const state = m.workspace.useWorkspace.getState();
  return m.model.assetIdOf(state.panes[state.activePaneId].active);
}

describe("navigate", () => {
  it("walks forward through the Recentes view instead of bouncing", () => {
    const { useLibrary } = m.store;
    const stamp = (minute: number) => `2026-10-19T10:${String(minute).padStart(2, "0")}:00.000Z`;
    useLibrary.setState({
      assets: useLibrary.getState().assets.map((item) => {
        const order = ["jetbrains", "inter", "noto", "roboto"].indexOf(item.id);
        return { ...item, lastUsedAt: order < 0 ? null : stamp(50 - order) };
      }),
    });
    useLibrary.getState().setView("font", { type: "recent" });
    m.commands.openItem("jetbrains", "pin");

    const seen: (string | null)[] = [activeItem()];
    for (let step = 0; step < 3; step++) {
      const paneId = m.workspace.useWorkspace.getState().activePaneId;
      m.commands.navigate(paneId, activeItem()!, 1);
      seen.push(activeItem());
    }
    assert.deepEqual(seen, ["jetbrains", "inter", "noto", "roboto"]);
  });
});

describe("scoreInActivePane", () => {
  it("pins the preview tab of the item scored from the inspector", () => {
    m.commands.openItem("roboto", "preview");
    const pane = () => {
      const state = m.workspace.useWorkspace.getState();
      return state.panes[state.activePaneId];
    };
    assert.equal(pane().preview, m.model.assetKey("roboto"));

    m.commands.scoreInActivePane("roboto", "leitura", 4);

    assert.equal(pane().preview, null);
    const roboto = m.store.useLibrary.getState().assets.find((item) => item.id === "roboto");
    assert.equal(roboto?.criteria.leitura?.value, 4);
  });
});

describe("split", () => {
  it("does not split a pane that has no room for two halves", () => {
    const { useWorkspace } = m.workspace;
    useWorkspace.setState({ canSplit: true, area: { width: 400, height: 900 } });
    m.commands.split(useWorkspace.getState().activePaneId, "right");
    assert.equal(Object.keys(useWorkspace.getState().panes).length, 1);

    useWorkspace.setState({ area: { width: 1200, height: 900 } });
    m.commands.split(useWorkspace.getState().activePaneId, "right");
    assert.equal(Object.keys(useWorkspace.getState().panes).length, 2);
  });
});

describe("compareItems", () => {
  it("leaves room for the inspector that shows once the compared items are in front", () => {
    const { useWorkspace } = m.workspace;
    // 900 px window: 644 px beside the sidebar, 324 px once the 320 px inspector shows.
    useWorkspace.setState({
      canSplit: true,
      inspectorOpen: true,
      area: { width: 644, height: 800 },
    });
    m.commands.compareItems(["inter", "roboto", "noto", "jetbrains"]);
    const state = useWorkspace.getState();
    assert.equal(Object.keys(state.panes).length, 1, "one 324 px pane, the rest as tabs");
    const tabs = state.panes[state.activePaneId].tabs;
    for (const id of ["inter", "roboto", "noto", "jetbrains"]) {
      assert.ok(tabs.includes(m.model.assetKey(id)), id);
    }
  });
});

describe("inspector drawer", () => {
  it("closes when the active pane stops showing an item", () => {
    const { useWorkspace } = m.workspace;
    useWorkspace.setState({ canSplit: false, inspectorDrawer: false });
    m.commands.openItem("inter", "pin");
    useWorkspace.getState().setInspector(true);
    assert.equal(useWorkspace.getState().inspectorDrawer, true);

    // Alt+W in the drawer closes the item and brings the collection to front.
    const state = useWorkspace.getState();
    m.commands.close(state.activePaneId, state.panes[state.activePaneId].active);
    assert.equal(activeItem(), null);
    assert.equal(useWorkspace.getState().inspectorDrawer, false);
  });
});
