import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { leaves, type LayoutNode } from "./layout.ts";
import {
  DEFAULT_PANE_SETTINGS,
  DEFAULT_SYNC,
  MAX_PANES,
  INSPECTOR_WIDTH,
  PANE_MIN,
  alignSettings,
  applySettings,
  assetKey,
  checkWorkspace,
  closePane,
  closeTab,
  compare,
  createWorkspace,
  dropAsset,
  dropTab,
  keepPanes,
  migrateWorkspace,
  moveTab,
  openCollection,
  openTab,
  openToSide,
  pinTab,
  reconcile,
  replaceTab,
  roomForItems,
  sanitizeWorkspace,
  LEGACY_SAMPLE_TEXTS,
  splitPane,
  type Workspace,
} from "./workspace-model.ts";

const a = assetKey("a");
const b = assetKey("b");
const c = assetKey("c");

function valid(ws: Workspace): Workspace {
  assert.deepEqual(checkWorkspace(ws), []);
  return ws;
}

const pane = (ws: Workspace, index = 0) => ws.panes[leaves(ws.root)[index]];

function shape(node: LayoutNode): string {
  if (node.type === "pane") return "P";
  return `${node.orientation === "horizontal" ? "H" : "V"}[${node.children.map(shape).join(",")}]`;
}

/** n panes side by side, pane i holding asset:i. */
function row(n: number): Workspace {
  let ws = createWorkspace();
  ws = openTab(ws, ws.activePaneId, assetKey("0"), { preview: false });
  for (let i = 1; i < n; i++) {
    ws = splitPane(ws, ws.activePaneId, "right", [assetKey(String(i))]);
  }
  return valid(ws);
}

describe("createWorkspace", () => {
  it("starts with one pane on the collection", () => {
    const ws = valid(createWorkspace());
    assert.deepEqual(pane(ws).tabs, ["collection"]);
    assert.equal(pane(ws).active, "collection");
  });
});

describe("openTab", () => {
  it("reuses the preview tab for consecutive single clicks", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: true });
    ws = openTab(ws, id, b, { preview: true });
    assert.deepEqual(pane(valid(ws)).tabs, ["collection", b]);
    assert.equal(pane(ws).preview, b);
  });

  it("keeps a pinned tab when the next item opens", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: true });
    ws = pinTab(ws, id, a);
    ws = openTab(ws, id, b, { preview: true });
    assert.deepEqual(pane(valid(ws)).tabs, ["collection", a, b]);
  });

  it("pins and activates a tab that is already open", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: true });
    ws = openTab(ws, id, "collection", { preview: false });
    ws = openTab(ws, id, a, { preview: false });
    assert.equal(pane(valid(ws)).active, a);
    assert.equal(pane(ws).preview, null);
  });

  it("never treats the collection as a preview", () => {
    let ws = createWorkspace();
    ws = closeTab(ws, ws.activePaneId, "collection");
    ws = openTab(ws, ws.activePaneId, a, { preview: false });
    ws = openTab(ws, ws.activePaneId, "collection", { preview: true });
    assert.equal(pane(valid(ws)).preview, null);
  });
});

describe("replaceTab", () => {
  it("swaps in place and keeps the preview flag", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: true });
    ws = replaceTab(ws, id, a, b);
    assert.deepEqual(pane(valid(ws)).tabs, ["collection", b]);
    assert.equal(pane(ws).preview, b);
    assert.equal(pane(ws).active, b);
  });

  it("activates the next item when it is already open", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: false });
    ws = openTab(ws, id, b, { preview: false });
    ws = replaceTab(ws, id, b, a);
    assert.deepEqual(pane(valid(ws)).tabs, ["collection", a, b]);
    assert.equal(pane(ws).active, a);
  });
});

describe("closeTab", () => {
  it("moves focus to the tab on the right", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: false });
    ws = openTab(ws, id, b, { preview: false });
    ws = openTab(ws, id, a, { preview: false });
    ws = closeTab(ws, id, a);
    assert.equal(pane(valid(ws)).active, b);
  });

  it("closes a pane whose last tab closes", () => {
    let ws = row(2);
    ws = closeTab(ws, leaves(ws.root)[1], assetKey("1"));
    assert.equal(leaves(valid(ws).root).length, 1);
  });

  it("falls back to the collection in the only pane", () => {
    let ws = createWorkspace();
    ws = openTab(ws, ws.activePaneId, a, { preview: false });
    ws = closeTab(ws, ws.activePaneId, "collection");
    ws = closeTab(ws, ws.activePaneId, a);
    assert.deepEqual(pane(valid(ws)).tabs, ["collection"]);
  });
});

describe("splitPane", () => {
  it("copies the active item as a preview and clones settings", () => {
    let ws = createWorkspace();
    const first = ws.activePaneId;
    ws = openTab(ws, first, a, { preview: false });
    ws = applySettings(ws, first, { ground: "ink" }, { ...DEFAULT_SYNC, ground: false });
    ws = splitPane(ws, first, "right");
    valid(ws);
    const second = pane(ws, 1);
    assert.equal(ws.activePaneId, second.id);
    assert.deepEqual(second.tabs, [a]);
    assert.equal(second.preview, a);
    assert.equal(second.settings.ground, "ink");
  });

  it(`stops at ${MAX_PANES} panes`, () => {
    const ws = row(MAX_PANES);
    assert.equal(splitPane(ws, ws.activePaneId, "right"), ws);
  });
});

describe("closePane", () => {
  it("hands focus to the nearest pane", () => {
    let ws = row(3);
    const [first, second] = leaves(ws.root);
    ws = closePane(ws, leaves(ws.root)[2]);
    assert.equal(valid(ws).activePaneId, second);
    ws = closePane(ws, second);
    assert.equal(valid(ws).activePaneId, first);
  });

  it("resets the only pane instead of removing it", () => {
    let ws = createWorkspace();
    ws = openTab(ws, ws.activePaneId, a, { preview: false });
    ws = closePane(ws, ws.activePaneId);
    assert.deepEqual(pane(valid(ws)).tabs, ["collection"]);
  });
});

describe("moveTab", () => {
  it("moves a tab across panes and closes the emptied source", () => {
    let ws = row(2);
    const [first, second] = leaves(ws.root);
    ws = moveTab(ws, second, assetKey("1"), first);
    valid(ws);
    assert.deepEqual(leaves(ws.root), [first]);
    assert.deepEqual(ws.panes[first].tabs, ["collection", assetKey("0"), assetKey("1")]);
  });

  it("reorders within a pane", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: false });
    ws = openTab(ws, id, b, { preview: false });
    ws = moveTab(ws, id, b, id, 0);
    assert.deepEqual(pane(valid(ws)).tabs, [b, "collection", a]);
  });

  it("pins a preview tab dragged within its pane, so the next preview opens beside it", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: true });
    ws = moveTab(ws, id, a, id, 0);
    assert.equal(pane(valid(ws)).preview, null);
    ws = openTab(ws, id, b, { preview: true });
    assert.ok(pane(valid(ws)).tabs.includes(a), "the dragged tab is not replaced");
    assert.equal(pane(ws).preview, b);
  });
});

describe("dropTab", () => {
  it("moving the only tab of a pane to another pane's edge keeps the pane count", () => {
    let ws = row(MAX_PANES);
    const ids = leaves(ws.root);
    ws = dropTab(ws, ids[5], assetKey("5"), ids[0], "bottom");
    valid(ws);
    assert.equal(leaves(ws.root).length, MAX_PANES);
    assert.ok(Object.values(ws.panes).some((p) => p.tabs.includes(assetKey("5"))));
  });

  it("ignores splitting a pane's only tab off itself", () => {
    const ws = row(2);
    const second = leaves(ws.root)[1];
    assert.equal(dropTab(ws, second, assetKey("1"), second, "right"), ws);
  });

  it("splits a tab off its own pane when there are others", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(ws, id, a, { preview: false });
    ws = dropTab(ws, id, a, id, "right");
    valid(ws);
    assert.equal(shape(ws.root), "H[P,P]");
    assert.deepEqual(pane(ws, 0).tabs, ["collection"]);
    assert.deepEqual(pane(ws, 1).tabs, [a]);
  });
});

describe("dropAsset", () => {
  it("opens in the pane at the center and splits at an edge", () => {
    let ws = createWorkspace();
    ws = dropAsset(ws, "a", ws.activePaneId, "center");
    assert.equal(pane(valid(ws)).active, a);
    ws = dropAsset(ws, "b", ws.activePaneId, "bottom");
    assert.equal(shape(valid(ws).root), "V[P,P]");
    assert.deepEqual(pane(ws, 1).tabs, [b]);
  });

  it("dropped on the tab strip, lands at the slot the marker showed", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(openTab(ws, id, a, { preview: false }), id, b, { preview: false });
    assert.deepEqual(pane(ws).tabs, ["collection", a, b]);
    ws = dropAsset(ws, "c", id, "center", undefined, 0);
    assert.deepEqual(pane(valid(ws)).tabs, [c, "collection", a, b]);
    assert.equal(pane(ws).active, c);
  });

  it("dropped on the tab strip, moves an open item to the slot", () => {
    let ws = createWorkspace();
    const id = ws.activePaneId;
    ws = openTab(openTab(ws, id, a, { preview: false }), id, b, { preview: true });
    ws = dropAsset(ws, "b", id, "center", undefined, 1);
    assert.deepEqual(pane(valid(ws)).tabs, ["collection", b, a]);
    assert.equal(pane(ws).preview, null);
  });
});

describe("openToSide", () => {
  it("splits right when there is no pane on the right", () => {
    let ws = createWorkspace();
    ws = openToSide(ws, ws.activePaneId, a);
    assert.equal(shape(valid(ws).root), "H[P,P]");
    assert.equal(pane(ws, 1).active, a);
  });

  it("reuses the pane on the right", () => {
    let ws = row(2);
    ws = openToSide(ws, leaves(ws.root)[0], c);
    assert.equal(leaves(valid(ws).root).length, 2);
    assert.equal(pane(ws, 1).active, c);
  });
});

describe("openCollection", () => {
  it("focuses an existing collection tab before opening a new one", () => {
    let ws = row(2);
    ws = openCollection(ws);
    assert.equal(ws.activePaneId, leaves(ws.root)[0]);
    assert.equal(pane(valid(ws)).active, "collection");
    assert.equal(Object.values(ws.panes).filter((p) => p.tabs.includes("collection")).length, 1);
  });
});

describe("compare", () => {
  it("puts up to three items in one row", () => {
    const ws = valid(compare(createWorkspace(), [a, b, c]));
    assert.equal(shape(ws.root), "H[P,P,P]");
    assert.deepEqual(pane(ws, 0).tabs, ["collection", a]);
    assert.equal(pane(ws, 0).active, a);
    assert.deepEqual(pane(ws, 2).tabs, [c]);
  });

  it("uses two rows for four to six items", () => {
    const keys = ["1", "2", "3", "4", "5"].map(assetKey);
    assert.equal(shape(valid(compare(createWorkspace(), keys)).root), "V[H[P,P,P],H[P,P]]");
  });

  it("opens a single item in the active pane", () => {
    const ws = valid(compare(createWorkspace(), [a]));
    assert.equal(leaves(ws.root).length, 1);
    assert.equal(pane(ws).active, a);
  });
});

describe("settings sync", () => {
  it("fans a change out to every pane when its flag is on", () => {
    let ws = row(3);
    ws = applySettings(
      ws,
      ws.activePaneId,
      { ground: "navy", fontSize: 20 },
      { ...DEFAULT_SYNC, size: false },
    );
    const panes = leaves(ws.root).map((id) => ws.panes[id]);
    assert.ok(panes.every((p) => p.settings.ground === "navy"));
    assert.deepEqual(
      panes.map((p) => p.settings.fontSize),
      [16, 16, 20],
    );
  });

  it("aligns every pane to one pane when a flag turns on", () => {
    let ws = row(2);
    const [first] = leaves(ws.root);
    ws = applySettings(ws, first, { sampleText: "abc" }, { ...DEFAULT_SYNC, text: false });
    ws = alignSettings(ws, first, "text");
    assert.ok(Object.values(ws.panes).every((p) => p.settings.sampleText === "abc"));
  });
});

describe("reconcile", () => {
  it("drops tabs of deleted items and closes emptied panes", () => {
    let ws = row(3);
    ws = reconcile(ws, new Set(["0", "2"]));
    valid(ws);
    assert.equal(leaves(ws.root).length, 2);
    assert.ok(!Object.values(ws.panes).some((p) => p.tabs.includes(assetKey("1"))));
  });
});

describe("migrateWorkspace", () => {
  it("closes the inspector saved open before it started closed", () => {
    const saved = { root: { type: "pane", id: "pane-1" }, inspectorOpen: true };
    assert.deepEqual(migrateWorkspace(saved, 1), { ...saved, inspectorOpen: false });
  });

  it("keeps a current choice and tolerates garbage", () => {
    assert.deepEqual(migrateWorkspace({ inspectorOpen: true }, 2), { inspectorOpen: true });
    assert.equal(migrateWorkspace(null, 1), null);
  });
});

describe("sanitizeWorkspace", () => {
  it("rejects garbage", () => {
    assert.equal(sanitizeWorkspace(null), null);
    assert.equal(sanitizeWorkspace({ root: { type: "split", id: "s", children: [] } }), null);
  });

  it("repairs a split saved without sizes", () => {
    const ws = sanitizeWorkspace({
      root: {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        children: [
          { type: "pane", id: "pane-1" },
          { type: "pane", id: "pane-2" },
        ],
      },
      panes: {},
      activePaneId: "pane-2",
    });
    assert.ok(ws);
    valid(ws);
    assert.equal(shape(ws.root), "H[P,P]");
  });

  it("swaps the old default reading text for the new one and keeps a text the person wrote", () => {
    const pane = (id: string, sampleText: string) => ({
      id,
      tabs: ["collection"],
      active: "collection",
      preview: null,
      settings: { ...DEFAULT_PANE_SETTINGS, sampleText },
    });
    const ws = sanitizeWorkspace({
      root: {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        children: [
          { type: "pane", id: "pane-1" },
          { type: "pane", id: "pane-2" },
        ],
        sizes: {},
      },
      panes: {
        "pane-1": pane("pane-1", LEGACY_SAMPLE_TEXTS[0]),
        "pane-2": pane("pane-2", "Meu texto"),
      },
      activePaneId: "pane-1",
    });
    assert.ok(ws);
    assert.equal(ws.panes["pane-1"].settings.sampleText, DEFAULT_PANE_SETTINGS.sampleText);
    assert.equal(ws.panes["pane-2"].settings.sampleText, "Meu texto");
  });

  it("sends a pane saved on the removed Info tab back to the first specimen tab", () => {
    const ws = sanitizeWorkspace({
      root: { type: "pane", id: "pane-1" },
      panes: {
        "pane-1": {
          id: "pane-1",
          tabs: ["collection"],
          active: "collection",
          preview: null,
          settings: { ...DEFAULT_PANE_SETTINGS, fontTab: "info", iconTab: "info" },
        },
      },
      activePaneId: "pane-1",
    });
    assert.ok(ws);
    assert.equal(ws.panes["pane-1"].settings.fontTab, "prova");
    assert.equal(ws.panes["pane-1"].settings.iconTab, "amostras");
  });

  it("fills missing settings and repairs a stray active tab", () => {
    const ws = sanitizeWorkspace({
      root: { type: "pane", id: "pane-1" },
      panes: {
        "pane-1": {
          id: "pane-1",
          tabs: ["collection", "asset:x"],
          active: "asset:y",
          preview: "asset:z",
        },
      },
      activePaneId: "nope",
    });
    assert.ok(ws);
    valid(ws);
    assert.equal(ws.activePaneId, "pane-1");
    assert.equal(ws.panes["pane-1"].active, "collection");
    assert.equal(ws.panes["pane-1"].preview, null);
    assert.equal(ws.panes["pane-1"].settings.ground, "paper");
  });
});

describe("room for panes", () => {
  const roomy = { width: 1600, height: 900 };
  const tight = { width: 864, height: 820 };
  const short = { width: 500, height: 300 };

  it("keeps the pane minimum in one place for the panels too", () => {
    assert.deepEqual(PANE_MIN, { width: 220, height: 160 });
  });

  it("splits only while both halves keep the minimum", () => {
    let ws = row(2); // 864 px wide: 432 each, halving gives 216
    const first = leaves(ws.root)[0];
    assert.equal(splitPane(ws, first, "right", undefined, tight), ws);
    ws = splitPane(ws, first, "bottom", undefined, tight);
    assert.equal(leaves(valid(ws).root).length, 3, "820 px tall still halves to 410");
    assert.equal(leaves(splitPane(row(2), first, "right", undefined, roomy).root).length, 3);
  });

  it("drops on an edge without room into the pane itself", () => {
    const ws = row(2);
    const first = leaves(ws.root)[0];
    const next = valid(dropAsset(ws, "z", first, "right", tight));
    assert.equal(leaves(next.root).length, 2);
    assert.ok(next.panes[first].tabs.includes(assetKey("z")));
  });

  it("moves a dropped tab to the pane when its edge has no room", () => {
    let ws = row(2);
    const [first, second] = leaves(ws.root);
    ws = openTab(ws, second, b, { preview: false });
    const next = valid(dropTab(ws, second, b, first, "right", tight));
    assert.equal(leaves(next.root).length, 2);
    assert.ok(next.panes[first].tabs.includes(b));
  });

  it("opens beside in the same pane when there is no room for a new one", () => {
    let ws = createWorkspace();
    ws = openToSide(ws, ws.activePaneId, a, { width: 400, height: 900 });
    assert.equal(leaves(valid(ws).root).length, 1);
    assert.ok(pane(ws).tabs.includes(a));
  });

  it("compares in as many panes as fit and puts the rest as tabs in the last one", () => {
    const keys = ["1", "2", "3", "4", "5", "6"].map(assetKey);
    assert.equal(
      leaves(valid(compare(createWorkspace(), keys, tight)).root).length,
      6,
      "two rows of three, 288 px each",
    );

    const narrow = valid(compare(createWorkspace(), keys, { width: 500, height: 900 }));
    const ids = leaves(narrow.root);
    assert.equal(ids.length, 4, "two rows of two");
    const last = narrow.panes[ids[3]];
    assert.deepEqual(last.tabs, [assetKey("4"), assetKey("5"), assetKey("6")]);
    assert.equal(last.active, assetKey("4"));

    const flat = valid(compare(createWorkspace(), keys, short));
    assert.equal(leaves(flat.root).length, 2, "one row of two when two rows do not fit");
    assert.equal(flat.panes[leaves(flat.root)[1]].tabs.length, 5);
  });
});

describe("roomForItems", () => {
  const area = { width: 1000, height: 800 };

  it("sets aside the inspector column that shows once an item is in front", () => {
    assert.deepEqual(roomForItems(area, true, false), {
      width: 1000 - INSPECTOR_WIDTH,
      height: 800,
    });
  });

  it("keeps the area when the inspector is closed or already showing", () => {
    assert.deepEqual(roomForItems(area, false, false), area);
    assert.deepEqual(roomForItems(area, true, true), area);
  });
});

describe("keepPanes", () => {
  it("drops the entries of closed panes, so a reused pane id starts clean", () => {
    let ws = closePane(splitPane(createWorkspace(), "pane-1", "right"), "pane-2");
    const selections = keepPanes({ "pane-1": "kept", "pane-2": "stale" }, ws.panes);
    assert.deepEqual(selections, { "pane-1": "kept" });
    ws = splitPane(ws, "pane-1", "right");
    assert.ok(ws.panes["pane-2"], "the id comes back");
    assert.equal(Object.hasOwn(selections, "pane-2"), false);
  });

  it("returns the same object when every pane is still open", () => {
    const ws = splitPane(createWorkspace(), "pane-1", "right");
    const state = { "pane-1": 1, "pane-2": 2 };
    assert.equal(keepPanes(state, ws.panes), state);
  });
});
