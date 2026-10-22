// Fails when a component invents a colour or a measure instead of using the
// tokens in `@theme` of src/styles.css.
//
//   node scripts/ds/reuso.mjs
//
// The rule is structure, not taste: a hex, a Tailwind palette colour or an
// arbitrary px is verifiable in milliseconds. Everything else about the design
// lives in docs/steering/ and is judged by people.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ } from "./raiz.mjs";

export { RAIZ };

/** Where the rule applies: application code, never the tooling. */
export const FONTE = "src";

/**
 * Files allowed to break the rule, each with the reason it is correct there.
 * A new entry needs a human decision: it hides real debt from the check.
 * @type {Record<string, string>}
 */
export const PERMITIDOS = {
  "src/components/library/shared/grounds.ts":
    "hex espelha o @theme para o Iconify colorir SVGs; um token não atravessa a API dele.",
  "src/components/ui/face-icon.tsx":
    "#fff e #000 são tinta de máscara SVG, não cor de interface.",
  "src/lib/error-component.tsx":
    "renderiza quando o tema pode não ter carregado; utilidade de paleta é a escolha certa ali.",
  "src/routes/__root.tsx":
    "#0c0d10 no meta theme-color: o navegador lê antes do CSS, então um var() não chega lá.",
  "src/components/library/browser/asset-card.tsx":
    "LIGHT_INK espelha --color-fg, mesmo motivo de grounds.ts. Dívida de Goal B.",
  "src/components/library/evaluation/score-control.tsx":
    "3 medidas finas do controle de nota; entram na escala quando Goal B redesenhar a avaliação.",
  "src/components/library/icons.tsx":
    "traço do glifo em px, não espaçamento de layout: o token de raio não descreve isso.",
  "src/components/library/import-dialog.tsx":
    "text-[15px] num diálogo; Goal B troca pela escala de tipo.",
  "src/components/library/sidebar/sidebar.tsx":
    "text-[15px] do título da barra; Goal B redesenha a barra.",
  "src/components/library/specimen/controls.tsx":
    "text-[11px] do espécime, fora do escopo de Goal B por decisão humana.",
  "src/components/library/specimen/font-specimen.tsx":
    "text-[11px] do espécime, fora do escopo de Goal B por decisão humana.",
  "src/components/library/specimen/icon-specimen.tsx":
    "text-[11px] do espécime, fora do escopo de Goal B por decisão humana.",
};

/** Generated files are not hand-written, so the rule does not judge them. */
const GERADOS = ["routeTree.gen.ts"];

const ehGerado = (caminho) =>
  caminho.endsWith(".gen.ts") || GERADOS.some((nome) => caminho.endsWith(nome));

const REGRAS = [
  {
    nome: "hex",
    motivo: "cor em hex: use o token de @theme pelo nome (bg-proof, text-muted).",
    // #abc, #aabbcc, #aabbccdd — e nada de âncora que pegue `#1 de 3`.
    padrao: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
  },
  {
    nome: "paleta",
    motivo: "cor de paleta do Tailwind: não existe no atelier; use um token.",
    padrao:
      /\b(?:bg|text|border|from|to|via|ring|outline|fill|stroke|shadow|divide|accent|caret|decoration|placeholder)-(?:red|blue|green|zinc|slate|gray|grey|neutral|stone|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/g,
  },
  {
    nome: "medida-arbitraria",
    motivo:
      "medida arbitrária em px: use a escala do Tailwind ou um token de raio/espaço.",
    // `min-[860px]:` e `max-[860px]:` são variantes de mídia do Tailwind, não
    // medidas: o px ali é a largura da janela, e a escala não cobre janela.
    padrao: /(?<!min-)(?<!max-)\[[0-9.]+px\]/g,
  },
];

/** Every .ts and .tsx under `pasta`, as paths from `raiz`, sorted. */
function arquivosFonte(raiz, pasta = FONTE) {
  const caminho = join(raiz, pasta);
  const entrada = (() => {
    try {
      return statSync(caminho);
    } catch {
      return undefined;
    }
  })();
  if (!entrada) return [];
  if (!entrada.isDirectory()) return [];
  const saida = [];
  for (const nome of readdirSync(caminho).sort()) {
    const relativo = `${pasta}/${nome}`;
    const absoluto = join(raiz, relativo);
    if (statSync(absoluto).isDirectory()) {
      saida.push(...arquivosFonte(raiz, relativo));
      continue;
    }
    if (!/\.tsx?$/.test(nome)) continue;
    if (ehGerado(relativo)) continue;
    saida.push(relativo);
  }
  return saida;
}

/** Line number of an offset in `texto`, 1-based. */
function linhaDe(texto, indice) {
  let linha = 1;
  for (let i = 0; i < indice; i += 1) if (texto[i] === "\n") linha += 1;
  return linha;
}

/**
 * Violations of the token-reuse rule.
 * @param {string} raiz
 * @returns {{ arquivo: string, linha: number, regra: string, motivo: string, trecho: string }[]}
 */
export function violacoes(raiz = RAIZ) {
  const achados = [];
  for (const arquivo of arquivosFonte(raiz)) {
    if (arquivo in PERMITIDOS) continue;
    const texto = readFileSync(join(raiz, arquivo), "utf8");
    for (const regra of REGRAS) {
      regra.padrao.lastIndex = 0;
      for (const achado of texto.matchAll(regra.padrao)) {
        achados.push({
          arquivo: arquivo.split(sep).join("/"),
          linha: linhaDe(texto, achado.index),
          regra: regra.nome,
          motivo: regra.motivo,
          trecho: achado[0],
        });
      }
    }
  }
  return achados;
}

/** Human-readable report, one line per violation. */
export function relatorio(achados) {
  return achados
    .map((a) => `  ${a.arquivo}:${a.linha}  ${a.trecho}  (${a.regra}) ${a.motivo}`)
    .join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const achados = violacoes();
  if (achados.length) {
    console.error(
      `Cor inventada fora do @theme de src/styles.css:\n${relatorio(achados)}\n\n` +
        `Use o token pelo nome. Se o caso é legítimo, ele entra em PERMITIDOS com o motivo escrito.`,
    );
    process.exit(1);
  }
  console.log(`Nenhuma cor ou medida inventada em ${FONTE}/ (${Object.keys(PERMITIDOS).length} arquivos permitidos com motivo).`);
}
