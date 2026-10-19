import type { ReactNode } from "react";
import { GROUNDS, groundOf } from "@/components/library/shared/grounds";
import type { Asset } from "@/lib/library/types";
import { FONT_SIZE_RANGE, type PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";

const READING =
  "A pessoa pergunta, o agente responde, e o parágrafo que fica na tela precisa aguentar a leitura. Veja o desenho do a, do g e do s, o espaço entre as linhas, e se uma resposta de três ou quatro frases continua confortável. Números como 10 e 100 não podem parecer letras, nem a palavra Ilustração.";

export function FontSpecimen({
  asset,
  settings,
  onSettings,
}: {
  asset: Asset;
  settings: PaneSettings;
  onSettings: (patch: Partial<PaneSettings>) => void;
}) {
  const ground = groundOf(settings.ground);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-muted">
          Corpo
          <input
            type="range"
            min={FONT_SIZE_RANGE.min}
            max={FONT_SIZE_RANGE.max}
            value={settings.fontSize}
            aria-label="Tamanho do texto"
            onChange={(event) => onSettings({ fontSize: Number(event.target.value) })}
            className="w-24 accent-proof"
          />
          <span className="w-6 tabular-nums">{settings.fontSize}</span>
        </label>
        <GroundPicker value={settings.ground} onChange={(next) => onSettings({ ground: next })} />
      </div>
      <div className={cn("flex-1 space-y-10 px-6 py-8 sm:px-10", ground.surface)}>
        <section>
          <SpecimenLabel>Título</SpecimenLabel>
          <h2
            className="mt-2 max-w-xl text-4xl leading-tight font-medium tracking-tight"
            style={{ fontFamily: asset.family }}
          >
            Clareza na conversa com o agente
          </h2>
        </section>
        <section>
          <SpecimenLabel>Leitura</SpecimenLabel>
          <p
            className="mt-3 max-w-xl text-[17px] leading-relaxed"
            style={{ fontFamily: asset.family }}
          >
            {READING}
          </p>
          <textarea
            value={settings.sampleText}
            onChange={(event) => onSettings({ sampleText: event.target.value })}
            aria-label="Texto de prova"
            className="mt-4 w-full max-w-xl resize-y bg-transparent leading-relaxed outline-none"
            style={{ fontFamily: asset.family, fontSize: settings.fontSize }}
            rows={5}
          />
        </section>
        <section>
          <SpecimenLabel>Interface</SpecimenLabel>
          <div className="mt-3 max-w-md space-y-3" style={{ fontFamily: asset.family }}>
            <p className="text-[11px] opacity-70">Agente, agora</p>
            <div className="rounded-lg border border-current/15 px-3 py-2 text-sm leading-snug">
              Posso resumir a conversa em três pontos, sem perder o que você marcou como decisão.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-8 items-center rounded-md px-3 text-sm",
                  ground.dark ? "bg-paper text-paper-fg" : "bg-ink text-fg",
                )}
              >
                Enviar
              </span>
              <span className="inline-flex h-8 items-center rounded-md border border-current/20 px-3 text-sm">
                Revisar
              </span>
              <span className="text-xs opacity-70">Rótulo de campo, 12 px</span>
            </div>
          </div>
        </section>
        <section>
          <SpecimenLabel>Caracteres críticos</SpecimenLabel>
          <div
            className="mt-3 space-y-1 text-2xl leading-relaxed"
            style={{ fontFamily: asset.family }}
          >
            <p>Il1 O0 rn m</p>
            <p>áéíóú âêô ãõ ç</p>
            <p>0O 1lI 5S 8B</p>
          </div>
        </section>
        <section>
          <SpecimenLabel>Tamanhos</SpecimenLabel>
          <div className="mt-3" style={{ fontFamily: asset.family }}>
            {[13, 16, 20, 28, 40].map((size) => (
              <p key={size} className="py-1" style={{ fontSize: size }}>
                <span className="mr-3 inline-block w-6 text-[11px] opacity-50 tabular-nums">
                  {size}
                </span>
                Clareza na conversa
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function GroundPicker({
  value,
  onChange,
}: {
  value: PaneSettings["ground"];
  onChange: (value: PaneSettings["ground"]) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Fundo" className="ml-auto flex gap-1">
      {GROUNDS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={value === item.id}
          aria-label={item.label}
          title={item.label}
          onClick={() => onChange(item.id)}
          className={cn(
            "grid size-7 place-items-center rounded-md border text-xs font-medium",
            item.surface,
            value === item.id ? "border-proof ring-1 ring-proof" : "border-border",
          )}
        >
          A
        </button>
      ))}
    </div>
  );
}

export function SpecimenLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium opacity-60">{children}</p>;
}
