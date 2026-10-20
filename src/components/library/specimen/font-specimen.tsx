import { groundOf } from "@/components/library/shared/grounds";
import type { Asset } from "@/lib/library/types";
import type { PaneSettings } from "@/lib/library/workspace-model";
import { SpecimenSection } from "./section";

const SIZES = [12, 14, 16, 20, 28, 40];

/** The headline of the proof. */
const HEADLINE = "Respostas claras, decisões rápidas";
/** Its first half, short enough for the size ladder to fit a narrow pane up to 40 px. */
const HEADLINE_SHORT = "Respostas claras";

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
          {HEADLINE}
        </h2>
      </SpecimenSection>

      <SpecimenSection title="Leitura" section="leitura" {...section}>
        {/* The paragraph is the text field: click it to write your own. */}
        <textarea
          value={settings.sampleText}
          onChange={(event) => onSettings({ sampleText: event.target.value })}
          aria-label="Texto de prova, editável"
          placeholder="Escreva o texto da prova"
          rows={3}
          spellCheck={false}
          className="-mx-2 block w-[calc(100%+1rem)] max-w-[calc(62ch+1rem)] resize-none rounded-md bg-transparent px-2 py-1 text-[1.0625em] leading-relaxed [field-sizing:content] placeholder:opacity-40 hover:bg-current/[0.04] focus:bg-current/[0.06]"
          style={face}
        />
      </SpecimenSection>

      <SpecimenSection title="Caracteres" section="criticos" {...section}>
        {/* Look-alike pairs first, then the accents of Portuguese inside real words. */}
        <div className="space-y-1 text-[1.5em] leading-relaxed" style={face}>
          <p>Il1 O0 rn m cl d 5S 8B</p>
          <p>Ilustração, você, pão, à, Ç</p>
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
              <span className="truncate">{HEADLINE_SHORT}</span>
            </p>
          ))}
        </div>
      </SpecimenSection>
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
