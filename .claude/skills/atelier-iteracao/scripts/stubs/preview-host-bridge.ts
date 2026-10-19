/**
 * Stand-in for the platform's preview bridge (`src/lib/preview-host-bridge.ts`),
 * which is not part of this repository. `components/preview-host-bridge.tsx`
 * imports it on every route, so without it SSR fails outside the platform.
 * `setup.sh` copies this file there when it is missing, outside git. It
 * installs nothing.
 */

export type PreviewHostBridgeOptions = {
  navigate: (path: string) => void;
  getRoutePaths: () => string[];
};

export function installPreviewHostBridge(_options: PreviewHostBridgeOptions): () => void {
  return () => {};
}

type RouteNode = { fullPath?: unknown; children?: unknown };

/** Every `fullPath` in a TanStack route tree, depth first. */
export function collectRoutePathsFromTree(tree: unknown): string[] {
  const paths: string[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const route = node as RouteNode;
    if (typeof route.fullPath === "string") paths.push(route.fullPath);
    const children = route.children;
    if (Array.isArray(children)) children.forEach(visit);
    else if (children && typeof children === "object") Object.values(children).forEach(visit);
  };
  visit(tree);
  return [...new Set(paths)];
}
