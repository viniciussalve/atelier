import { groundOf } from "@/components/library/shared/grounds";
import { parseWeights, weightName } from "@/lib/library/fonts";
import type { Asset } from "@/lib/library/types";
import type { PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";
import { SpecimenSection } from "./section";

const READING =
  "A pessoa pergunta, o agente responde, e o parágrafo que fica na tela precisa aguentar a leitura. Veja o desenho do a, do g e do s, o espaço entre as linhas, e se uma resposta de três ou quatro frases continua confortável. Números como 10 e 100 não podem parecer letras, nem a palavra Ilustração.";

const SIZES = [12, 14, 16, 20, 28, 40];

/** The proof sheet for a font. Sizes are in em of the pane's "Corpo", except the fixed-size rows. */
export function FontProof({
  asset,
  paneId,
  settings,
  onSettings,
}: {
  asset: Asset;
  paneId: string;
  settings: PaneSettings;
  onSettings: (patch: Partial<PaneSettings>) => void;
}) {
  const ground = groundOf(settings.ground);
  const onPaper = !ground.dark;
  const face = { fontFamily: asset.family };
  const section = { asset, paneId, onPaper };

  return (
    <div className="space-y-12" style={{ fontSize: settings.fontSize }}>
      <SpecimenSection title="Título" section="titulo" {...section}>
        <h2
          className="max-w-[20ch] text-[2.5em] leading-[1.1] font-medium tracking-tight"
          style={face}
        >
          Clareza na conversa com o agente
        </h2>
      </SpecimenSection>

      <SpecimenSection title="Leitura" section="leitura" {...section}>
        <p className="max-w-[62ch] text-[1.0625em] leading-relaxed" style={face}>
          {READING}
        </p>
        <textarea
          value={settings.sampleText}
          onChange={(event) => onSettings({ sampleText: event.target.value })}
          aria-label="Texto de prova, editável"
          rows={4}
          className="mt-4 block w-full max-w-[62ch] resize-y rounded-md border border-dashed border-current/20 bg-transparent px-3 py-2 leading-relaxed outline-none focus:border-current/50"
          style={face}
        />
      </SpecimenSection>

      <SpecimenSection title="Interface" section="interface" {...section}>
        <div className="max-w-md space-y-3" style={face}>
          <p className="text-[11px] opacity-70">Agente, agora</p>
          <div className="rounded-lg border border-current/15 px-3 py-2 text-sm leading-snug">
            Posso resumir a conversa em três pontos, sem perder o que você marcou como decisão.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium",
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
          <p className="flex flex-wrap gap-x-5 text-[13px] tabular-nums opacity-80">
            <span>R$ 1.250,00</span>
            <span>10/08/2026</span>
            <span>98,6%</span>
          </p>
        </div>
      </SpecimenSection>

      <SpecimenSection title="Caracteres críticos" section="criticos" {...section}>
        <div className="space-y-1 text-[1.5em] leading-relaxed" style={face}>
          <p>Il1 O0 rn m cl d</p>
          <p>áéíóú âêô ãõ ç Ç</p>
          <p>0O 1lI 5S 8B 6b 9g</p>
        </div>
      </SpecimenSection>

      <SpecimenSection title="Tamanhos" {...section}>
        <div className="space-y-1" style={face}>
          {SIZES.map((size) => (
            <p
              key={size}
              className="flex items-baseline gap-4 leading-snug"
              style={{ fontSize: size }}
            >
              <span
                className="w-6 shrink-0 text-[11px] opacity-50 tabular-nums"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {size}
              </span>
              <span className="truncate">Clareza na conversa com o agente</span>
            </p>
          ))}
        </div>
      </SpecimenSection>
    </div>
  );
}

/** Every declared weight, one line each, at 1.5em of the pane's "Corpo". */
export function FontWeights({ asset, settings }: { asset: Asset; settings: PaneSettings }) {
  const weights = parseWeights(asset.weights);
  return (
    <div className="space-y-6" style={{ fontSize: settings.fontSize }}>
      {weights.map((weight) => (
        <div key={weight}>
          <p className="text-xs opacity-60 tabular-nums">
            {weight} {weightName(weight)}
          </p>
          <p
            className="mt-1 truncate text-[1.5em] leading-snug"
            style={{ fontFamily: asset.family, fontWeight: weight }}
          >
            Clareza na conversa com o agente
          </p>
          <p
            className="max-w-[62ch] leading-relaxed opacity-80"
            style={{ fontFamily: asset.family, fontWeight: weight }}
          >
            {settings.sampleText}
          </p>
        </div>
      ))}
    </div>
  );
}

const GLYPH_ROWS: { label: string; chars: string }[] = [
  { label: "Maiúsculas", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { label: "Minúsculas", chars: "abcdefghijklmnopqrstuvwxyz" },
  { label: "Números", chars: "0123456789" },
  { label: "Acentos", chars: "áàâãäéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÇ" },
  { label: "Pontuação", chars: ".,:;!?¡¿'\"“”‘’()[]{}-–—/\\@#$%&*+=<>«»…" },
];

/** The character set, grouped, in cells big enough to judge each glyph. */
export function FontGlyphs({ asset, settings }: { asset: Asset; settings: PaneSettings }) {
  return (
    <div className="space-y-8">
      {GLYPH_ROWS.map((row) => (
        <section key={row.label} aria-label={row.label}>
          <h3 className="text-xs font-medium opacity-60">{row.label}</h3>
          <div
            className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(3em,1fr))] border-t border-l border-current/10"
            style={{ fontSize: settings.fontSize }}
          >
            {[...row.chars].map((char, index) => (
              <span
                key={`${char}-${index}`}
                className="grid aspect-square place-items-center border-r border-b border-current/10 text-[1.6em]"
                style={{ fontFamily: asset.family }}
              >
                {char}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
