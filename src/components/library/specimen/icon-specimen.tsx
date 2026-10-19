import { SetGlyphs } from "@/components/library/icons";
import { groundOf } from "@/components/library/shared/grounds";
import type { Asset } from "@/lib/library/types";
import type { PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { SpecimenSection } from "./section";

const SIZES = [16, 20, 24, 32, 48];

/** The proof sheet for an icon set: samples, sizes, and the set in use. */
export function IconProof({
  asset,
  paneId,
  settings,
}: {
  asset: Asset;
  paneId: string;
  settings: PaneSettings;
}) {
  const ground = groundOf(settings.ground);
  const color = ground.ink;
  const names = asset.samples;
  const section = { asset, paneId, onPaper: !ground.dark };

  return (
    <div className="space-y-12">
      <SpecimenSection title="Amostras" section="amostras" {...section}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-x-3 gap-y-5">
          {names.map((name) => (
            <div key={name} className="grid justify-items-center gap-2">
              <SetGlyphs
                prefix={asset.iconKey}
                names={[name]}
                size={settings.iconSize}
                color={color}
              />
              <span className="max-w-full truncate text-xs opacity-70">{name}</span>
            </div>
          ))}
        </div>
      </SpecimenSection>

      <SpecimenSection title="Tamanhos" section="tamanhos" {...section}>
        <div className="space-y-3">
          {SIZES.map((size) => (
            <div key={size} className="flex items-center gap-4">
              <span className="w-6 shrink-0 text-[11px] opacity-50 tabular-nums">{size}</span>
              <div className="flex flex-wrap items-center gap-3">
                {names.slice(0, 6).map((name) => (
                  <SetGlyphs
                    key={name}
                    prefix={asset.iconKey}
                    names={[name]}
                    size={size}
                    color={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SpecimenSection>

      <SpecimenSection title="Em componentes" section="componentes" {...section}>
        <div className="max-w-md space-y-3">
          <div className="flex gap-5">
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
              <span className="block text-xs opacity-70">Item de lista a 16 px</span>
            </span>
          </div>
          <div className="flex gap-1 border-b border-current/15">
            {names.slice(0, 3).map((name, index) => (
              <span
                key={name}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 px-3 text-sm",
                  index === 0 ? "border-b-2 border-current" : "opacity-60",
                )}
              >
                <SetGlyphs prefix={asset.iconKey} names={[name]} size={16} color={color} />
                {name.split("-")[0]}
              </span>
            ))}
          </div>
        </div>
      </SpecimenSection>
    </div>
  );
}
