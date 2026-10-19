import { useLibrary } from "@/lib/library/store";
import { assetIdOf, type TabKey } from "@/lib/library/workspace-model";
import { viewTitle } from "./labels";

/** What a tab is called: the item's name, or the current view for the collection. */
export function useTabLabel(key: TabKey): string {
  const assetId = assetIdOf(key);
  return useLibrary((state) => {
    if (assetId) return state.assets.find((item) => item.id === assetId)?.name ?? "Item removido";
    return viewTitle(state.nav[state.kind].view, state.folders, state.kind);
  });
}
