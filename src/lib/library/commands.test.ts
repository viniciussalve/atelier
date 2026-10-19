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
