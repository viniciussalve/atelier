import { SetGlyphs } from "@/components/library/icons";
import { groundOf } from "@/components/library/shared/grounds";
import type { Asset } from "@/lib/library/types";
import type { PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { GroundPicker, SpecimenLabel } from "./font-specimen";

export function IconSpecimen({
  asset,
  settings,
  onSettings,
}: {
  asset: Asset;
  settings: PaneSettings;
  onSettings: (patch: Partial<PaneSettings>) => void;
}) {
  const ground = groundOf(settings.ground);
  const color = ground.ink;
  const names = asset.samples;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <p className="text-xs text-muted">
          {asset.format}, {asset.sizeLabel}
        </p>
        <GroundPicker value={settings.ground} onChange={(next) => onSettings({ ground: next })} />
      </div>
      <div className={cn("flex-1 space-y-10 px-6 py-8", ground.surface)}>
        <section>
          <SpecimenLabel>Amostras</SpecimenLabel>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3">
            {names.map((name) => (
              <div key={name} className="grid justify-items-center gap-2">
                <SetGlyphs prefix={asset.iconKey} names={[name]} size={24} color={color} />
                <span className="max-w-full truncate text-xs opacity-70">{name}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <SpecimenLabel>Tamanhos</SpecimenLabel>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            {names[0]
              ? [16, 20, 24, 32].map((size) => (
                  <div key={size} className="grid justify-items-center gap-2">
                    <SetGlyphs
                      prefix={asset.iconKey}
                      names={[names[0]]}
                      size={size}
                      color={color}
                    />
                    <span className="text-xs opacity-70">{size}</span>
                  </div>
                ))
              : null}
          </div>
        </section>
        <section>
          <SpecimenLabel>Em componentes</SpecimenLabel>
          <div className="mt-3 max-w-md space-y-3">
            <div className="flex gap-4">
              {names.slice(0, 4).map((name) => (
                <span key={name} className="grid justify-items-center gap-1 text-[11px] opacity-80">
                  <SetGlyphs prefix={asset.iconKey} names={[name]} size={20} color={color} />
                  {name.split("-")[0]}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm",
                  ground.dark ? "bg-paper text-paper-fg" : "bg-ink text-fg",
                )}
              >
                {names[0] ? (
                  <SetGlyphs
                    prefix={asset.iconKey}
                    names={[names[0]]}
                    size={16}
                    color={ground.inverseInk}
                  />
                ) : null}
                Ação
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-md border border-current/20 px-3 text-sm">
                {names[1] ? (
                  <SetGlyphs prefix={asset.iconKey} names={[names[1]]} size={16} color={color} />
                ) : null}
                Secundária
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-current/15 px-3 py-2">
              {names[2] ? (
                <SetGlyphs prefix={asset.iconKey} names={[names[2]]} size={16} color={color} />
              ) : null}
              <span>
                <span className="block text-sm">{asset.name}</span>
                <span className="block text-xs opacity-70">
                  {asset.notes || "Item de lista a 16 px"}
                </span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
