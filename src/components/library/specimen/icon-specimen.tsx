import { useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { Glyph } from "@/components/library/icons";
import { groundOf } from "@/components/library/shared/grounds";
import { externalLink } from "@/lib/library/format";
import { isIconName, useLibrary } from "@/lib/library/store";
import type { Asset } from "@/lib/library/types";
import type { IconSpecimenTab, PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { SpecimenScreen, SpecimenSection } from "./section";

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

/** The set at work: five small screens, every icon at 16 or 20 px except the empty state. */
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
  if (!names.length) {
    return <p className="text-sm opacity-70">Adicione ícones em Amostras para vê-los em uso.</p>;
  }
  // Fewer samples than slots: the set repeats rather than leaving a part empty.
  const pick = (index: number) => names[index % names.length];
  const glyph = (index: number, size = 16, tint = color) => (
    <Glyph prefix={asset.iconKey} name={pick(index)} size={size} color={tint} />
  );
  const primary = dark ? "bg-paper text-paper-fg" : "bg-ink text-fg";

  return (
    <div className="grid items-start gap-x-6 gap-y-8 text-sm @3xl:grid-cols-2">
      <SpecimenScreen title="Abas e lista">
        <div className="flex gap-1 border-b border-current/15 px-2">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn(
                "-mb-px inline-flex h-9 min-w-0 items-center gap-1.5 px-2",
                index === 0 ? "border-b-2 border-current" : "opacity-60",
              )}
            >
              {glyph(index)}
              <span className="truncate">{labelOf(pick(index))}</span>
            </span>
          ))}
        </div>
        <ul className="p-1">
          {[3, 4, 5].map((index, row) => (
            <li
              key={index}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2",
                row === 0 && "bg-current/[0.06]",
              )}
            >
              {glyph(index)}
              <span className="truncate">{labelOf(pick(index))}</span>
            </li>
          ))}
        </ul>
      </SpecimenScreen>

      <SpecimenScreen title="Barra de ferramentas">
        <div className="flex items-center gap-1 p-2">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              title={labelOf(pick(index))}
              className={cn(
                "grid size-8 place-items-center rounded-md",
                index === 1 && "bg-current/10",
              )}
            >
              {glyph(index, 20)}
            </span>
          ))}
          <span className="mx-1 h-5 w-px bg-current/15" />
          {[4, 5].map((index) => (
            <span key={index} className="grid size-8 place-items-center rounded-md">
              {glyph(index, 20)}
            </span>
          ))}
          <span
            className={cn("ml-auto inline-flex h-8 items-center gap-2 rounded-md px-3", primary)}
          >
            {glyph(6, 16, inverse)}
            {labelOf(pick(6))}
          </span>
        </div>
      </SpecimenScreen>

      <SpecimenScreen title="Busca e filtros">
        <div className="space-y-2 p-3">
          <span className="flex h-9 items-center gap-2 rounded-md border border-current/20 px-2.5">
            {glyph(1)}
            <span className="opacity-60">Buscar em tudo</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[2, 3, 4].map((index, chip) => (
              <span
                key={index}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs",
                  chip === 0 ? "border-current/50" : "border-current/15",
                )}
              >
                {glyph(index)}
                {labelOf(pick(index))}
              </span>
            ))}
          </div>
        </div>
      </SpecimenScreen>

      <SpecimenScreen title="Aviso">
        <div className="flex items-start gap-3 p-3">
          <span className="mt-0.5">{glyph(5, 20)}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Arquivo enviado</span>
            <span className="block opacity-70">O relatório já está na pasta da equipe.</span>
          </span>
          <span className="shrink-0 underline underline-offset-2">Abrir</span>
        </div>
      </SpecimenScreen>

      <SpecimenScreen title="Estado vazio">
        <div className="grid justify-items-center gap-2 px-4 py-6 text-center">
          {glyph(7, 32)}
          <span className="font-medium">Nada por aqui ainda</span>
          <span className="max-w-[30ch] opacity-70">Quando algo chegar, aparece nesta lista.</span>
          <span className="mt-1 inline-flex h-8 items-center gap-2 rounded-md border border-current/20 px-3">
            {glyph(0)}
            {labelOf(pick(0))}
          </span>
        </div>
      </SpecimenScreen>
    </div>
  );
}
