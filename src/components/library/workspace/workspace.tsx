import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import { Group, Panel, Separator, useGroupRef } from "react-resizable-panels";
import type { LayoutNode, SplitNode } from "@/lib/library/layout";
import { useWorkspace } from "@/lib/library/workspace";
import { PANE_MIN } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { PaneView } from "./pane";

/** The panes, laid out by the split tree. On narrow screens only the active pane shows. */
export function Workspace({ onOpenNav }: { onOpenNav: () => void }) {
  const root = useWorkspace((state) => state.root);
  const canSplit = useWorkspace((state) => state.canSplit);
  const activePaneId = useWorkspace((state) => state.activePaneId);
  const setArea = useWorkspace((state) => state.setArea);
  const frame = useRef<HTMLDivElement>(null);

  // New panes must keep PANE_MIN, so the commands need the space the panes share.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setArea({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [setArea]);

  return (
    <div ref={frame} className="h-full w-full">
      {canSplit ? (
        <NodeView node={root} onOpenNav={onOpenNav} />
      ) : (
        <PaneView paneId={activePaneId} onOpenNav={onOpenNav} />
      )}
    </div>
  );
}

function NodeView({ node, onOpenNav }: { node: LayoutNode; onOpenNav: () => void }) {
  if (node.type === "pane") return <PaneView paneId={node.id} onOpenNav={onOpenNav} />;
  return <SplitView node={node} onOpenNav={onOpenNav} />;
}

function SplitView({ node, onOpenNav }: { node: SplitNode; onOpenNav: () => void }) {
  const groupRef = useGroupRef();
  const epoch = useWorkspace((state) => state.layoutEpoch);
  const setSizes = useWorkspace((state) => state.setSizes);
  const equalize = useWorkspace((state) => state.equalize);
  const horizontal = node.orientation === "horizontal";
  const sizes = useRef(node.sizes);

  useLayoutEffect(() => {
    sizes.current = node.sizes;
  });

  // Sizes changed outside a drag (equalize): push them into the group.
  useEffect(() => {
    if (epoch) groupRef.current?.setLayout(sizes.current);
  }, [epoch, groupRef]);

  return (
    <Group
      // A different set of children needs a fresh group.
      key={node.children.map((child) => child.id).join(",")}
      id={node.id}
      orientation={node.orientation}
      defaultLayout={node.sizes}
      groupRef={groupRef}
      onLayoutChanged={(layout, meta) => {
        if (meta.isUserInteraction) setSizes(node.id, layout);
      }}
      className="h-full w-full"
    >
      {node.children.map((child, index) => (
        <Fragment key={child.id}>
          {index > 0 ? (
            <Separator
              id={`sep-${node.id}-${index}`}
              disableDoubleClick
              className={cn(
                "relative z-10 bg-border transition-colors data-[separator=active]:bg-proof data-[separator=focus]:bg-proof data-[separator=hover]:bg-proof/70",
                horizontal ? "w-px" : "h-px",
              )}
            >
              <div
                title="Arraste para redimensionar. Clique duas vezes para igualar."
                className={cn(
                  "absolute",
                  horizontal ? "inset-y-0 -inset-x-1" : "inset-x-0 -inset-y-1",
                )}
                onDoubleClick={() => equalize(node.id)}
              />
            </Separator>
          ) : null}
          <Panel
            id={child.id}
            minSize={horizontal ? PANE_MIN.width : PANE_MIN.height}
            className="min-h-0 min-w-0"
          >
            <NodeView node={child} onOpenNav={onOpenNav} />
          </Panel>
        </Fragment>
      ))}
    </Group>
  );
}
