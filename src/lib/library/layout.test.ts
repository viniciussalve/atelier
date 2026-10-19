import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canHalve,
  dropZoneAt,
  equalize,
  insertBeside,
  insertIndex,
  leaves,
  neighbor,
  normalize,
  paneBoxes,
  removeLeaf,
  setSizes,
  validateLayout,
  type LayoutNode,
  type PaneLeaf,
  type SplitNode,
} from "./layout.ts";

function counter() {
  let n = 0;
  return (prefix: "pane" | "split") => `${prefix}-${++n}`;
}

const leaf = (id: string): PaneLeaf => ({ type: "pane", id });
const split = (
  id: string,
  orientation: "horizontal" | "vertical",
  children: LayoutNode[],
  sizes?: number[],
): SplitNode => ({
  type: "split",
  id,
  orientation,
  children,
  sizes: Object.fromEntries(
    children.map((child, i) => [child.id, sizes?.[i] ?? 100 / children.length]),
  ),
});

/** Compact shape: H[a 50, V[b 50, c 50] 50]. */
function shape(node: LayoutNode): string {
  if (node.type === "pane") return node.id;
  const tag = node.orientation === "horizontal" ? "H" : "V";
  const parts = node.children.map((child) => `${shape(child)} ${+node.sizes[child.id].toFixed(2)}`);
  return `${tag}[${parts.join(", ")}]`;
}

function ok(node: LayoutNode | null) {
  assert.ok(node);
  assert.deepEqual(validateLayout(node), []);
  return node;
}

describe("insertBeside", () => {
  it("splits a lone pane in half", () => {
    const root = ok(insertBeside(leaf("a"), "a", leaf("b"), "right", counter()));
    assert.equal(shape(root), "H[a 50, b 50]");
  });

  it("puts the new pane first for left and top", () => {
    assert.equal(
      shape(insertBeside(leaf("a"), "a", leaf("b"), "left", counter())),
      "H[b 50, a 50]",
    );
    assert.equal(shape(insertBeside(leaf("a"), "a", leaf("b"), "top", counter())), "V[b 50, a 50]");
  });

  it("flattens into a parent with the same orientation, halving the target", () => {
    const root = ok(
      insertBeside(
        split("s", "horizontal", [leaf("a"), leaf("b")]),
        "b",
        leaf("c"),
        "right",
        counter(),
      ),
    );
    assert.equal(shape(root), "H[a 50, b 25, c 25]");
  });

  it("nests when the orientation differs", () => {
    const root = ok(
      insertBeside(
        split("s", "horizontal", [leaf("a"), leaf("b")]),
        "b",
        leaf("c"),
        "bottom",
        counter(),
      ),
    );
    assert.equal(shape(root), "H[a 50, V[b 50, c 50] 50]");
  });
});

describe("removeLeaf", () => {
  it("gives the space to the previous sibling", () => {
    const { root, heir } = removeLeaf(
      split("s", "horizontal", [leaf("a"), leaf("b"), leaf("c")], [50, 25, 25]),
      "b",
    );
    assert.equal(shape(ok(root)), "H[a 75, c 25]");
    assert.equal(heir, "a");
  });

  it("gives the space to the next sibling when removing the first", () => {
    const { root, heir } = removeLeaf(
      split("s", "horizontal", [leaf("a"), leaf("b")], [30, 70]),
      "a",
    );
    assert.equal(shape(ok(root)), "b");
    assert.equal(heir, "b");
  });

  it("collapses a split left with one child into its slot", () => {
    const tree = split("s", "horizontal", [
      leaf("a"),
      split("v", "vertical", [leaf("b"), leaf("c")]),
    ]);
    const { root, heir } = removeLeaf(tree, "c");
    assert.equal(shape(ok(root)), "H[a 50, b 50]");
    assert.equal(heir, "b");
  });

  it("flattens a grandchild that ends up under the same orientation", () => {
    const tree = split("s", "horizontal", [
      leaf("A"),
      split("v", "vertical", [leaf("B"), split("h", "horizontal", [leaf("C"), leaf("D")])]),
    ]);
    const { root, heir } = removeLeaf(tree, "B");
    assert.equal(shape(ok(root)), "H[A 50, C 25, D 25]");
    assert.equal(heir, "C");
  });

  it("returns nothing when removing the only pane", () => {
    assert.deepEqual(removeLeaf(leaf("a"), "a"), { root: null, heir: null });
  });
});

describe("normalize", () => {
  it("repairs missing and invalid sizes so they add up to 100", () => {
    const broken: SplitNode = {
      type: "split",
      id: "s",
      orientation: "horizontal",
      children: [leaf("a"), leaf("b"), leaf("c")],
      sizes: { a: 60, b: Number.NaN },
    };
    const root = ok(normalize(broken));
    assert.equal(shape(root), "H[a 60, b 20, c 20]");
  });
});

describe("equalize and setSizes", () => {
  const tree = split(
    "s",
    "horizontal",
    [leaf("a"), split("v", "vertical", [leaf("b"), leaf("c")], [80, 20])],
    [70, 30],
  );

  it("evens every split, or just one", () => {
    assert.equal(shape(equalize(tree)), "H[a 50, V[b 50, c 50] 50]");
    assert.equal(shape(equalize(tree, "v")), "H[a 70, V[b 50, c 50] 30]");
  });

  it("applies a layout whose keys match the split", () => {
    assert.equal(shape(setSizes(tree, "s", { a: 40, v: 60 })), "H[a 40, V[b 80, c 20] 60]");
  });

  it("ignores a layout with other keys", () => {
    assert.equal(setSizes(tree, "s", { a: 40, x: 60 }), tree);
  });
});

describe("neighbor", () => {
  const tree = split("s", "horizontal", [
    leaf("a"),
    split("v", "vertical", [leaf("b"), leaf("c")]),
  ]);

  it("finds the nearest pane in each direction", () => {
    assert.equal(neighbor(tree, "a", "right"), "b");
    assert.equal(neighbor(tree, "c", "left"), "a");
    assert.equal(neighbor(tree, "b", "bottom"), "c");
    assert.equal(neighbor(tree, "c", "top"), "b");
    assert.equal(neighbor(tree, "a", "left"), null);
  });
});

describe("leaves", () => {
  it("lists panes left to right, top to bottom", () => {
    const tree = split("s", "horizontal", [
      leaf("a"),
      split("v", "vertical", [leaf("b"), leaf("c")]),
    ]);
    assert.deepEqual(leaves(tree), ["a", "b", "c"]);
  });
});

describe("validateLayout", () => {
  it("flags single-child splits and repeated panes", () => {
    const bad = split("s", "horizontal", [leaf("a")]);
    assert.ok(validateLayout(bad).length > 0);
    const twice = split("s", "horizontal", [leaf("a"), leaf("a")]);
    assert.ok(validateLayout(twice).length > 0);
  });
});

describe("dropZoneAt", () => {
  const rect = { left: 0, top: 0, width: 400, height: 200 };

  it("is the center when edges are not allowed", () => {
    assert.equal(dropZoneAt(5, 100, rect, false), "center");
  });

  it("picks the nearest edge inside the outer quarter", () => {
    assert.equal(dropZoneAt(20, 100, rect, true), "left");
    assert.equal(dropZoneAt(390, 100, rect, true), "right");
    assert.equal(dropZoneAt(200, 10, rect, true), "top");
    assert.equal(dropZoneAt(200, 190, rect, true), "bottom");
    assert.equal(dropZoneAt(200, 100, rect, true), "center");
  });
});

describe("insertIndex", () => {
  it("finds where a dropped tab goes among tab midpoints", () => {
    assert.equal(insertIndex([10, 30, 50], 5), 0);
    assert.equal(insertIndex([10, 30, 50], 35), 2);
    assert.equal(insertIndex([10, 30, 50], 60), 3);
  });
});

describe("paneBoxes", () => {
  it("gives each pane its share of the area in pixels", () => {
    const root = split(
      "s",
      "horizontal",
      [leaf("a"), split("t", "vertical", [leaf("b"), leaf("c")])],
      [25, 75],
    );
    const boxes = paneBoxes(root, { width: 800, height: 600 });
    assert.deepEqual(boxes.a, { width: 200, height: 600 });
    assert.deepEqual(boxes.b, { width: 600, height: 300 });
    assert.deepEqual(boxes.c, { width: 600, height: 300 });
  });
});

describe("canHalve", () => {
  const min = { width: 220, height: 160 };
  const area = { width: 864, height: 800 };

  it("allows a split while both halves stay at the minimum", () => {
    assert.equal(canHalve(leaf("a"), "a", "right", area, min), true);
    const two = insertBeside(leaf("a"), "a", leaf("b"), "right", counter());
    assert.equal(canHalve(two, "a", "right", area, min), false, "432 px halves to 216");
    assert.equal(canHalve(two, "a", "bottom", area, min), true, "800 px tall halves to 400");
  });

  it("measures the axis of the split", () => {
    assert.equal(canHalve(leaf("a"), "a", "bottom", { width: 900, height: 300 }, min), false);
    assert.equal(canHalve(leaf("a"), "a", "left", { width: 300, height: 900 }, min), false);
  });

  it("refuses a pane that is not in the layout", () => {
    assert.equal(canHalve(leaf("a"), "z", "right", area, min), false);
  });
});
