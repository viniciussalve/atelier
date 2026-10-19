import { groundOf } from "@/components/library/shared/grounds";
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
