import { useWorkspace } from "@/lib/library/workspace";
import { PaneView } from "./pane";

export function Workspace({ onOpenNav }: { onOpenNav: () => void }) {
  const activePaneId = useWorkspace((state) => state.activePaneId);
  return <PaneView paneId={activePaneId} onOpenNav={onOpenNav} />;
}
