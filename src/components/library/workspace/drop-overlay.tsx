import { useState, type DragEvent } from "react";
import { dropOnPane, endDrag, roomFor } from "@/lib/library/commands";
import { canHalve, dropZoneAt, type DropZone } from "@/lib/library/layout";
import { useWorkspace } from "@/lib/library/workspace";
import { MAX_PANES, PANE_MIN } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";

const ZONE_CLASS: Record<DropZone, string> = {
  center: "inset-2",
  left: "inset-y-2 left-2 w-[calc(50%-0.5rem)]",
  right: "inset-y-2 right-2 w-[calc(50%-0.5rem)]",
  top: "inset-x-2 top-2 h-[calc(50%-0.5rem)]",
  bottom: "inset-x-2 bottom-2 h-[calc(50%-0.5rem)]",
};

const ZONE_HINT: Record<DropZone, string> = {
  center: "Abrir aqui",
  left: "Dividir à esquerda",
  right: "Dividir à direita",
  top: "Dividir acima",
  bottom: "Dividir abaixo",
};

/**
 * Covers a pane while something is dragged: the edges split the pane, the
 * center opens the item there, the way VS Code drops editors.
 */
export function DropOverlay({ paneId }: { paneId: string }) {
  const drag = useWorkspace((state) => state.drag);
  const canSplit = useWorkspace((state) => state.canSplit);
  const paneCount = useWorkspace((state) => Object.keys(state.panes).length);
  const ownTabs = useWorkspace((state) => state.panes[paneId]?.tabs.length ?? 0);
  const sourceTabs = useWorkspace((state) =>
    state.drag?.type === "tab" ? (state.panes[state.drag.fromPaneId]?.tabs.length ?? 0) : 0,
  );
  const [zone, setZone] = useState<DropZone | null>(null);
  if (!drag) return null;

  const fromHere = drag.type === "tab" && drag.fromPaneId === paneId;
  // Splitting the only tab off its own pane would leave that pane empty.
  if (fromHere && ownTabs === 1) return null;
  const freesAPane = drag.type === "tab" && !fromHere && sourceTabs === 1;
  const allowEdges = canSplit && (paneCount < MAX_PANES || freesAPane);

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    let next = dropZoneAt(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      allowEdges,
    );
    // An edge whose halves would fall under the minimum opens the item here instead.
    const room = roomFor(
      drag?.type === "asset" || (drag?.type === "tab" && drag.key !== "collection"),
    );
    const { root } = useWorkspace.getState();
    if (next !== "center" && room && !canHalve(root, paneId, next, room, PANE_MIN)) next = "center";
    event.dataTransfer.dropEffect = next === "center" && fromHere ? "none" : "move";
    setZone(next === "center" && fromHere ? null : next);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const target = zone;
    setZone(null);
    if (target) dropOnPane(paneId, target);
    else endDrag();
  }

  return (
    <div
      className="absolute inset-0 z-20"
      onDragOver={onDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setZone(null);
      }}
      onDrop={onDrop}
    >
      {zone ? (
        <div
          className={cn(
            "pointer-events-none absolute grid place-items-center rounded-lg border-2 border-proof/70 bg-proof/15 transition-all duration-100",
            ZONE_CLASS[zone],
          )}
        >
          <span className="rounded-md bg-surface px-2 py-1 text-xs text-fg">{ZONE_HINT[zone]}</span>
        </div>
      ) : null}
    </div>
  );
}
