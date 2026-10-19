import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toggleSelection } from "./selection.ts";

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
