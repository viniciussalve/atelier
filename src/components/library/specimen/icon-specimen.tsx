import { useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { Glyph } from "@/components/library/icons";
import { groundOf } from "@/components/library/shared/grounds";
import { externalLink } from "@/lib/library/format";
import { isIconName, useLibrary } from "@/lib/library/store";
import type { Asset } from "@/lib/library/types";
import type { IconSpecimenTab, PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { SpecimenSection } from "./section";

const SIZES = [16, 20, 24, 32, 48];

/** An icon set's proof, one tab at a time: samples, sizes, or the set in use. */
export function IconSpecimen({
  asset,
  paneId,
  settings,
  tab,
}: {
  asset: Asset;
  paneId: string;
  settings: PaneSettings;
  tab: IconSpecimenTab;
}) {
  const ground = groundOf(settings.ground);
  const section = { asset, paneId, onPaper: !ground.dark };
  const props = { asset, color: ground.ink };

  if (tab === "amostras") {
    return (
      <SpecimenSection title="Amostras" section="amostras" {...section}>
        {/* Keyed by set: a name typed for one must not be added to the next. */}
        <Samples key={asset.id} {...props} size={settings.iconSize} />
      </SpecimenSection>
    );
  }
  if (tab === "tamanhos") {
    return (
      <SpecimenSection title="Tamanhos" section="tamanhos" {...section}>
        <Sizes {...props} />
      </SpecimenSection>
    );
  }
  return (
    <SpecimenSection title="Em componentes" section="componentes" {...section}>
      <InUse {...props} dark={ground.dark} inverse={ground.inverseInk} />
    </SpecimenSection>
  );
}

function Samples({ asset, color, size }: { asset: Asset; color: string; size: number }) {
  const addSample = useLibrary((state) => state.addSample);
  const removeSample = useLibrary((state) => state.removeSample);
  const [draft, setDraft] = useState("");
  const valid = isIconName(draft);
  const link = externalLink(asset.url);

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-x-3 gap-y-5">
        {asset.samples.map((name) => (
          <li key={name} className="group relative grid justify-items-center gap-2">
            <Glyph prefix={asset.iconKey} name={name} size={size} color={color} />
            <span className="max-w-full truncate text-xs opacity-70">{name}</span>
            <button
              type="button"
              aria-label={`Tirar ${name} das amostras`}
              onClick={() => removeSample(asset.id, name)}
              className="absolute -top-1 right-1 grid size-5 place-items-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60"
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3 font-sans">
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            addSample(asset.id, draft);
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="nome-do-icone"
            aria-label="Nome de um ícone para adicionar às amostras"
            className="h-8 w-44 rounded-md border border-current/20 bg-transparent px-2 text-sm outline-none placeholder:opacity-50 focus:border-current/50"
          />
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-current/20 px-2 text-sm disabled:opacity-40"
          >
            <Plus className="size-3.5" /> Adicionar
          </button>
        </form>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100"
          >
            Ver o conjunto no Iconify <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Sizes({ asset, color }: { asset: Asset; color: string }) {
  const names = asset.samples.slice(0, 8);
  return (
    <div className="space-y-4">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-6 shrink-0 text-[11px] opacity-50 tabular-nums">{size}</span>
          <div className="flex flex-wrap items-center gap-3">
            {names.map((name) => (
              <Glyph key={name} prefix={asset.iconKey} name={name} size={size} color={color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** An icon name as a label: "arrow-right" reads "Arrow right". */
function labelOf(name: string): string {
  const words = name.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One small screen where every icon sits next to its own name: tabs, a list and two buttons. */
function InUse({
  asset,
  color,
  dark,
  inverse,
}: {
  asset: Asset;
  color: string;
  dark: boolean;
  inverse: string;
}) {
  const names = asset.samples;
  const tabs = names.slice(0, 3);
  const items = names.slice(3, 6);
  const [secondary, primary] = names.slice(6, 8);
  const glyph = (name: string, tint = color) => (
    <Glyph prefix={asset.iconKey} name={name} size={16} color={tint} />
  );
  // A set with few samples shows fewer parts: nothing is drawn empty.
  return (
    <div className="max-w-sm overflow-hidden rounded-lg border border-current/15 text-sm">
      <div className="flex gap-1 border-b border-current/15 px-2">
        {tabs.map((name, index) => (
          <span
            key={name}
            className={cn(
              "-mb-px inline-flex h-9 min-w-0 items-center gap-1.5 px-2",
              index === 0 ? "border-b-2 border-current" : "opacity-60",
            )}
          >
            {glyph(name)}
            <span className="truncate">{labelOf(name)}</span>
          </span>
        ))}
      </div>
      {items.length ? (
        <ul className="p-1">
          {items.map((name, index) => (
            <li
              key={name}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2",
                index === 0 && "bg-current/[0.06]",
              )}
            >
              {glyph(name)}
              <span className="truncate">{labelOf(name)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {secondary ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-current/15 p-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-md border border-current/20 px-3">
            {glyph(secondary)}
            {labelOf(secondary)}
          </span>
          {primary ? (
            <span
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-md px-3 font-medium",
                dark ? "bg-paper text-paper-fg" : "bg-ink text-fg",
              )}
            >
              {glyph(primary, inverse)}
              {labelOf(primary)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
