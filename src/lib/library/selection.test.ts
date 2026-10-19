import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectionIn, selectionScope, toggleSelection } from "./selection.ts";

const set = (...ids: string[]) => new Set(ids);

describe("toggleSelection", () => {
  it("adds and removes an item", () => {
    assert.deepEqual(toggleSelection(set("a"), "b", set("a", "b"), 6), set("a", "b"));
    assert.deepEqual(toggleSelection(set("a", "b"), "a", set("a", "b"), 6), set("b"));
  });

  it("stops at the cap", () => {
    assert.deepEqual(toggleSelection(set("a", "b"), "c", set("a", "b", "c"), 2), set("a", "b"));
  });

  it("drops items a search or filter hid, so they never block the cap", () => {
    const hidden = set("a", "b");
    assert.deepEqual(toggleSelection(hidden, "c", set("c", "d"), 2), set("c"));
  });
});

describe("selection scope", () => {
  it("names the library and the view a selection belongs to", () => {
    assert.equal(selectionScope("font", { type: "all" }), "font:all");
    assert.equal(selectionScope("icon", { type: "folder", id: "f-ui" }), "icon:folder:f-ui");
  });

  it("keeps a selection while its library and view stay in front", () => {
    const saved = { scope: "font:all", ids: ["inter", "roboto"] };
    assert.deepEqual(selectionIn(saved, "font:all"), set("inter", "roboto"));
  });

  it("starts empty in another library or view, or with nothing saved", () => {
    const saved = { scope: "font:all", ids: ["inter"] };
    assert.deepEqual(selectionIn(saved, "font:recent"), set());
    assert.deepEqual(selectionIn(saved, "icon:all"), set());
    assert.deepEqual(selectionIn(undefined, "font:all"), set());
  });
});
