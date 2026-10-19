import { useWorkspace } from "@/lib/library/workspace";

/**
 * The tab in front in the active pane: the one in the Tab order there. Where focus
 * goes when an overlay closes and what opened it is gone.
 */
export function activeTab(): HTMLElement | null {
  const id = CSS.escape(useWorkspace.getState().activePaneId);
  return document.querySelector<HTMLElement>(
    `[data-pane-id="${id}"] [role=tab][aria-selected=true]`,
  );
}
