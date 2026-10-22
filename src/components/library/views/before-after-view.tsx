import { FontProof } from "@/components/library/specimen/font-specimen";
import { IconSpecimen } from "@/components/library/specimen/icon-specimen";
import { useAsset, usePane } from "@/lib/library/hooks";
import { useWorkspace } from "@/lib/library/workspace";
import {
  DEFAULT_PANE_SETTINGS,
  assetIdOf,
  type PaneSettings,
  type TabKey,
} from "@/lib/library/workspace-model";

/** The settings a pane is comparing against: the shipped defaults. */
const REFERENCE = DEFAULT_PANE_SETTINGS;

/**
 * The item this pane compares: the last item tab it has. Once the view itself is
 * the active tab, `pane.active` is no longer the item, so the tab list is the
 * only place that still knows what the pane was looking at.
 */
function comparableAssetId(tabs: readonly TabKey[]): string | null {
  for (let index = tabs.length - 1; index >= 0; index -= 1) {
    const id = assetIdOf(tabs[index]);
    if (id) return id;
  }
  return null;
}

function sizeOf(settings: PaneSettings, kind: "font" | "icon"): number {
  return kind === "font" ? settings.fontSize : settings.iconSize;
}

/**
 * Antes e depois (article 2165): the same item at the pane's current settings and
 * at the shipped defaults, side by side. The reference column is not editable on
 * purpose — it exists to be compared against, and every control in it would write
 * to the pane's real settings.
 */
export function BeforeAfterView({ paneId }: { paneId: string }) {
  const pane = usePane(paneId);
  const assetId = pane ? comparableAssetId(pane.tabs) : null;
  const asset = useAsset(assetId);
  const settings = pane?.settings ?? DEFAULT_PANE_SETTINGS;
  const updateSettings = useWorkspace((state) => state.updateSettings);

  if (!pane || !asset) {
    return (
      <div className="grid h-full min-h-48 place-items-center px-6 py-10 text-center">
        <div className="max-w-sm rounded-lg border border-dashed border-border bg-surface/60 px-6 py-8">
          <p className="text-sm font-semibold tracking-tight">Nada para comparar ainda</p>
          <p className="mt-1.5 text-sm text-muted">
            Abra uma fonte ou um conjunto neste painel e volte: esta vista compara o item com os
            ajustes padrão.
          </p>
        </div>
      </div>
    );
  }

  const kind = asset.kind;
  const current = sizeOf(settings, kind);
  const reference = sizeOf(REFERENCE, kind);
  const onSettings = (patch: Partial<PaneSettings>) => updateSettings(paneId, patch);

  const specimen = (state: PaneSettings) =>
    kind === "font" ? (
      <FontProof asset={asset} paneId={paneId} settings={state} onSettings={onSettings} />
    ) : (
      <IconSpecimen asset={asset} paneId={paneId} settings={state} tab={state.iconTab} />
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-4 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">
            Antes e depois
          </p>
          <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight">{asset.name}</h2>
        </div>
        <p className="shrink-0 text-xs text-muted tabular-nums">
          {current} px contra {reference} px
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border overflow-y-auto md:grid-cols-2 md:divide-x md:divide-y-0">
        <section aria-label={`Agora, ${current} px`} className="min-w-0 px-4 py-4">
          <h3 className="mb-3 font-sans text-xs font-medium text-subtle">
            Agora · {current} px
          </h3>
          {specimen(settings)}
        </section>

        <section
          aria-label={`Padrão, ${reference} px`}
          className="min-w-0 bg-surface/40 px-4 py-4 [&_textarea]:pointer-events-none [&_button]:pointer-events-none"
        >
          <h3 className="mb-3 font-sans text-xs font-medium text-subtle">
            Padrão · {reference} px · referência, não editável
          </h3>
          {specimen(REFERENCE)}
        </section>
      </div>
    </div>
  );
}
