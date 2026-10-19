import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, PanelRightOpen } from "lucide-react";
import { ScoreBadge, VerdictBadge } from "@/components/library/evaluation/badges";
import { groundOf } from "@/components/library/shared/grounds";
import {
  claimScroll,
  handleScroll,
  registerScroller,
} from "@/components/library/workspace/scroll-sync";
import { IconButton } from "@/components/ui/icon-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { navigate } from "@/lib/library/commands";
import { useAsset, useCollection, usePane } from "@/lib/library/hooks";
import { useWorkspace } from "@/lib/library/workspace";
import {
  FONT_SIZE_RANGE,
  ICON_SIZE_RANGE,
  type FontSpecimenTab,
  type IconSpecimenTab,
  type PaneSettings,
} from "@/lib/library/workspace-model";
import type { Asset } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { GroundPicker, SizeSlider } from "./controls";
import { FontGlyphs, FontProof, FontWeights } from "./font-specimen";
import { IconSpecimen } from "./icon-specimen";
import { SpecimenInfo } from "./info";

const FONT_TABS: { id: FontSpecimenTab; label: string }[] = [
  { id: "prova", label: "Prova" },
  { id: "pesos", label: "Pesos" },
  { id: "glifos", label: "Glifos" },
  { id: "info", label: "Info" },
];

const ICON_TABS: { id: IconSpecimenTab; label: string }[] = [
  { id: "amostras", label: "Amostras" },
  { id: "tamanhos", label: "Tamanhos" },
  { id: "componentes", label: "Componentes" },
  { id: "info", label: "Info" },
];

export function AssetTab({ paneId, assetId }: { paneId: string; assetId: string }) {
  const asset = useAsset(assetId);
  const pane = usePane(paneId);
  const updateSettings = useWorkspace((state) => state.updateSettings);
  const inspectorShown = useWorkspace((state) =>
    state.canSplit ? state.inspectorOpen : state.inspectorDrawer,
  );
  const setInspector = useWorkspace((state) => state.setInspector);
  const { list } = useCollection(asset?.kind ?? "font");

  if (!asset || !pane) {
    return (
      <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
        Este item não está mais na biblioteca.
      </div>
    );
  }

  const { settings } = pane;
  const index = list.findIndex((item) => item.id === asset.id);
  const onSettings = (patch: Partial<PaneSettings>) => updateSettings(paneId, patch);
  const tab = asset.kind === "font" ? settings.fontTab : settings.iconTab;
  const tabs = asset.kind === "font" ? FONT_TABS : ICON_TABS;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium @sm:flex-none">{asset.name}</h2>
        <VerdictBadge verdict={asset.verdict} className="hidden @xs:inline-flex" />
        <ScoreBadge asset={asset} compact className="hidden @md:inline-flex" />
        <span className="ml-auto hidden text-xs whitespace-nowrap text-muted tabular-nums @sm:inline">
          {index >= 0 ? `${index + 1} de ${list.length}` : "Fora da lista atual"}
        </span>
        <IconButton
          label="Item anterior"
          shortcut="←"
          size="sm"
          disabled={index <= 0}
          onClick={() => navigate(paneId, asset.id, -1)}
        >
          <ArrowLeft className="size-4" />
        </IconButton>
        <IconButton
          label="Próximo item"
          shortcut="→"
          size="sm"
          disabled={index < 0 || index >= list.length - 1}
          onClick={() => navigate(paneId, asset.id, 1)}
        >
          <ArrowRight className="size-4" />
        </IconButton>
        <button
          type="button"
          aria-pressed={inspectorShown}
          aria-label="Avaliar"
          title="Mostrar ou ocultar a avaliação"
          onClick={() => setInspector(!inspectorShown)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm transition-colors",
            inspectorShown ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
          )}
        >
          <PanelRightOpen className="size-4" />
          <span className="hidden @lg:inline">Avaliar</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-surface px-3">
        <Tabs
          value={tab}
          onValueChange={(next) =>
            onSettings(
              asset.kind === "font"
                ? { fontTab: next as FontSpecimenTab }
                : { iconTab: next as IconSpecimenTab },
            )
          }
        >
          <TabsList aria-label="Partes da prova">
            {tabs.map((entry) => (
              <TabsTrigger key={entry.id} value={entry.id}>
                {entry.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 py-1">
          {tab === "info" ? null : asset.kind === "font" ? (
            <SizeSlider
              label="Corpo"
              value={settings.fontSize}
              min={FONT_SIZE_RANGE.min}
              max={FONT_SIZE_RANGE.max}
              onChange={(fontSize) => onSettings({ fontSize })}
            />
          ) : tab === "amostras" ? (
            <SizeSlider
              label="Tamanho"
              value={settings.iconSize}
              min={ICON_SIZE_RANGE.min}
              max={ICON_SIZE_RANGE.max}
              step={4}
              onChange={(iconSize) => onSettings({ iconSize })}
            />
          ) : null}
          <GroundPicker value={settings.ground} onChange={(next) => onSettings({ ground: next })} />
        </div>
      </div>

      <SpecimenScroller paneId={paneId} scrollKey={`${asset.id}:${tab}`} settings={settings}>
        <Body asset={asset} paneId={paneId} settings={settings} tab={tab} onSettings={onSettings} />
      </SpecimenScroller>
    </div>
  );
}

function Body({
  asset,
  paneId,
  settings,
  tab,
  onSettings,
}: {
  asset: Asset;
  paneId: string;
  settings: PaneSettings;
  tab: FontSpecimenTab | IconSpecimenTab;
  onSettings: (patch: Partial<PaneSettings>) => void;
}) {
  if (tab === "info") return <SpecimenInfo asset={asset} />;
  if (asset.kind === "icon") {
    return (
      <IconSpecimen
        asset={asset}
        paneId={paneId}
        settings={settings}
        tab={tab as Exclude<IconSpecimenTab, "info">}
      />
    );
  }
  if (tab === "pesos") return <FontWeights asset={asset} settings={settings} />;
  if (tab === "glifos") return <FontGlyphs asset={asset} settings={settings} />;
  return <FontProof asset={asset} paneId={paneId} settings={settings} onSettings={onSettings} />;
}

/** The specimen's scroll area, painted in the pane's ground and wired to scroll sync. */
function SpecimenScroller({
  paneId,
  scrollKey,
  settings,
  children,
}: {
  paneId: string;
  scrollKey: string;
  settings: PaneSettings;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ground = groundOf(settings.ground);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return registerScroller(paneId, scrollKey, el);
  }, [paneId, scrollKey]);

  return (
    <div
      ref={ref}
      className={cn("min-h-0 flex-1 overflow-y-auto", ground.surface)}
      onScroll={() => handleScroll(paneId)}
      onPointerEnter={() => claimScroll(paneId)}
      onPointerDown={() => claimScroll(paneId)}
      onWheel={() => claimScroll(paneId)}
      onTouchStart={() => claimScroll(paneId)}
      onKeyDown={() => claimScroll(paneId)}
    >
      <div className="px-5 py-8 @lg:px-10">{children}</div>
    </div>
  );
}
