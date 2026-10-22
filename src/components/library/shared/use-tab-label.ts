import { useLibrary } from "@/lib/library/store";
import { assetIdOf, viewKindOf, type TabKey } from "@/lib/library/workspace-model";
import { VIEW_KIND_LABEL, viewTitle } from "./labels";

/**
 * What a tab is called: the item's name, the view's own name, or the current
 * collection view. A view tab must not borrow the collection's title — that
 * would make "Antes e depois" read as "Fontes".
 */
export function useTabLabel(key: TabKey): string {
  const assetId = assetIdOf(key);
  const viewKind = viewKindOf(key);
  return useLibrary((state) => {
    if (assetId) return state.assets.find((item) => item.id === assetId)?.name ?? "Item removido";
    if (viewKind) return VIEW_KIND_LABEL[viewKind];
    return viewTitle(state.nav[state.kind].view, state.folders, state.kind);
  });
}
