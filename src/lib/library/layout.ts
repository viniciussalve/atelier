/**
 * The split tree behind the workspace, in the spirit of VS Code editor groups.
 * Leaves are panes; splits lay children out in a row ("horizontal") or a
 * column ("vertical"). `sizes` maps each child id to its share in percent and
 * doubles as the react-resizable-panels `Layout` of that split's Group.
 *
 * Every operation returns a normalized tree: no split has fewer than two
 * children, no split directly holds a split of the same orientation, and each
 * split's sizes cover exactly its children and add up to 100.
 */

export type Orientation = "horizontal" | "vertical";
export type Edge = "left" | "right" | "top" | "bottom";
export type DropZone = Edge | "center";
export type Sizes = Record<string, number>;
export type PaneLeaf = { type: "pane"; id: string };
export type SplitNode = {
  type: "split";
  id: string;
  orientation: Orientation;
  children: LayoutNode[];
  sizes: Sizes;
};
export type LayoutNode = PaneLeaf | SplitNode;
export type IdGen = (prefix: "pane" | "split") => string;

const isSize = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

function rescale(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => (value * 100) / total);
}

/** Keeps valid shares, spreads what is left over the missing ones, then rescales to 100. */
function repairSizes(ids: string[], sizes: Sizes): number[] {
  const values = ids.map((id) => sizes[id]);
  const good = values.filter(isSize);
  if (good.length === 0) return ids.map(() => 100 / ids.length);
  const sum = good.reduce((total, value) => total + value, 0);
  const missing = values.length - good.length;
  const fill = sum < 100 ? (100 - sum) / Math.max(missing, 1) : sum / good.length;
  return rescale(values.map((value) => (isSize(value) ? value : fill)));
}

export function leaves(node: LayoutNode): string[] {
  return node.type === "pane" ? [node.id] : node.children.flatMap(leaves);
}

export function firstLeaf(node: LayoutNode): string {
  return node.type === "pane" ? node.id : firstLeaf(node.children[0]);
}

export function lastLeaf(node: LayoutNode): string {
  return node.type === "pane" ? node.id : lastLeaf(node.children[node.children.length - 1]);
}

export function normalize(node: LayoutNode): LayoutNode {
  if (node.type === "pane" || node.children.length === 0) return node;
  const slots = repairSizes(
    node.children.map((child) => child.id),
    node.sizes,
  );
  const children: LayoutNode[] = [];
  const shares: number[] = [];
  node.children.forEach((child, index) => {
    const next = normalize(child);
    const slot = slots[index];
    if (next.type === "split" && next.orientation === node.orientation) {
      for (const grandchild of next.children) {
        children.push(grandchild);
        shares.push((slot * next.sizes[grandchild.id]) / 100);
      }
    } else {
      children.push(next);
      shares.push(slot);
    }
  });
  if (children.length === 1) return children[0];
  const scaled = rescale(shares);
  return {
    ...node,
    children,
    sizes: Object.fromEntries(children.map((child, index) => [child.id, scaled[index]])),
  };
}

/** Puts `leaf` beside `targetId`, halving the target's space. */
export function insertBeside(
  root: LayoutNode,
  targetId: string,
  leaf: PaneLeaf,
  edge: Edge,
  idGen: IdGen,
): LayoutNode {
  const orientation: Orientation = edge === "left" || edge === "right" ? "horizontal" : "vertical";
  const before = edge === "left" || edge === "top";

  function visit(node: LayoutNode): LayoutNode {
    if (node.type === "pane") {
      if (node.id !== targetId) return node;
      const children = before ? [leaf, node] : [node, leaf];
      return {
        type: "split",
        id: idGen("split"),
        orientation,
        children,
        sizes: { [children[0].id]: 50, [children[1].id]: 50 },
      };
    }
    const children = node.children.map(visit);
    const sizes: Sizes = {};
    children.forEach((child, index) => {
      sizes[child.id] = node.sizes[node.children[index].id];
    });
    return { ...node, children, sizes };
  }

  return normalize(visit(root));
}

/**
 * Removes a pane. Its adjacent sibling (the previous one, or the next for a
 * first child) absorbs the space, and `heir` is the pane nearest to it.
 */
export function removeLeaf(
  root: LayoutNode,
  id: string,
): { root: LayoutNode | null; heir: string | null } {
  if (root.type === "pane")
    return root.id === id ? { root: null, heir: null } : { root, heir: null };
  let heir: string | null = null;

  function visit(node: SplitNode): SplitNode {
    const index = node.children.findIndex((child) => child.type === "pane" && child.id === id);
    if (index >= 0) {
      const siblingIndex = index > 0 ? index - 1 : index + 1;
      const sibling = node.children[siblingIndex];
      heir = siblingIndex < index ? lastLeaf(sibling) : firstLeaf(sibling);
      const sizes = { ...node.sizes };
      sizes[sibling.id] =
        (isSize(sizes[sibling.id]) ? sizes[sibling.id] : 0) + (isSize(sizes[id]) ? sizes[id] : 0);
      delete sizes[id];
      return { ...node, children: node.children.filter((_, k) => k !== index), sizes };
    }
    return {
      ...node,
      children: node.children.map((child) => (child.type === "split" ? visit(child) : child)),
    };
  }

  return { root: normalize(visit(root)), heir };
}

/** Evens out every split, or only `splitId`. */
export function equalize(root: LayoutNode, splitId?: string): LayoutNode {
  if (root.type === "pane") return root;
  const children = root.children.map((child) => equalize(child, splitId));
  const sizes =
    !splitId || root.id === splitId
      ? Object.fromEntries(children.map((child) => [child.id, 100 / children.length]))
      : root.sizes;
  return { ...root, children, sizes };
}

/** Applies a Group layout to one split. A layout for other children is ignored. */
export function setSizes(root: LayoutNode, splitId: string, layout: Sizes): LayoutNode {
  let changed = false;

  function visit(node: LayoutNode): LayoutNode {
    if (node.type === "pane") return node;
    if (node.id === splitId) {
      const ids = node.children.map((child) => child.id);
      const keys = Object.keys(layout);
      const matches = keys.length === ids.length && ids.every((childId) => isSize(layout[childId]));
      if (!matches) return node;
      changed = true;
      const scaled = rescale(ids.map((childId) => layout[childId]));
      return {
        ...node,
        sizes: Object.fromEntries(ids.map((childId, index) => [childId, scaled[index]])),
      };
    }
    const children = node.children.map(visit);
    return children.some((child, index) => child !== node.children[index])
      ? { ...node, children }
      : node;
  }

  const next = visit(root);
  return changed ? next : root;
}

/** The pane next to `paneId` in a direction, or null at the workspace edge. */
export function neighbor(root: LayoutNode, paneId: string, edge: Edge): string | null {
  const path: { node: SplitNode; index: number }[] = [];

  function find(node: LayoutNode): boolean {
    if (node.type === "pane") return node.id === paneId;
    for (let index = 0; index < node.children.length; index++) {
      path.push({ node, index });
      if (find(node.children[index])) return true;
      path.pop();
    }
    return false;
  }

  if (!find(root)) return null;
  const axis: Orientation = edge === "left" || edge === "right" ? "horizontal" : "vertical";
  const forward = edge === "right" || edge === "bottom";
  for (let step = path.length - 1; step >= 0; step--) {
    const { node, index } = path[step];
    if (node.orientation !== axis) continue;
    if (forward && index < node.children.length - 1) return firstLeaf(node.children[index + 1]);
    if (!forward && index > 0) return lastLeaf(node.children[index - 1]);
  }
  return null;
}

/** Invariant violations, empty for a well-formed tree. */
export function validateLayout(root: LayoutNode): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  function visit(node: LayoutNode, parent: SplitNode | null) {
    if (!node || typeof node !== "object" || typeof node.id !== "string" || !node.id) {
      errors.push("node without id");
      return;
    }
    if (ids.has(node.id)) errors.push(`repeated id ${node.id}`);
    ids.add(node.id);
    if (node.type === "pane") return;
    if (node.type !== "split" || !Array.isArray(node.children)) {
      errors.push(`unknown node ${node.id}`);
      return;
    }
    if (node.orientation !== "horizontal" && node.orientation !== "vertical") {
      errors.push(`split ${node.id} without orientation`);
    }
    if (parent && parent.orientation === node.orientation)
      errors.push(`split ${node.id} repeats its parent's orientation`);
    if (node.children.length < 2)
      errors.push(`split ${node.id} has ${node.children.length} children`);
    const sizes = node.sizes ?? {};
    const childIds = node.children.map((child) => child?.id);
    if (
      Object.keys(sizes).length !== childIds.length ||
      !childIds.every((id) => isSize(sizes[id]))
    ) {
      errors.push(`split ${node.id} sizes do not match its children`);
    } else {
      const sum = childIds.reduce((total, id) => total + sizes[id], 0);
      if (Math.abs(sum - 100) > 1e-3) errors.push(`split ${node.id} sizes add up to ${sum}`);
    }
    node.children.forEach((child) => visit(child, node));
  }

  visit(root, null);
  return errors;
}

/** Which part of a pane a drag is over: an edge splits, the center opens. */
export function dropZoneAt(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number; height: number },
  allowEdges: boolean,
  ratio = 0.25,
): DropZone {
  if (!allowEdges || rect.width <= 0 || rect.height <= 0) return "center";
  const fx = (x - rect.left) / rect.width;
  const fy = (y - rect.top) / rect.height;
  const distances: [Edge, number][] = [
    ["left", fx],
    ["right", 1 - fx],
    ["top", fy],
    ["bottom", 1 - fy],
  ];
  const [edge, distance] = distances.reduce((best, entry) => (entry[1] < best[1] ? entry : best));
  return distance < ratio ? edge : "center";
}

/** Insertion index for a tab dropped at `x`, given the tabs' horizontal midpoints. */
export function insertIndex(midpoints: number[], x: number): number {
  return midpoints.filter((mid) => mid < x).length;
}
