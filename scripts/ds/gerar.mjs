// Generates docs/ds/ from the code. `--check` writes nothing and fails when
// the committed files differ from what the code generates.
//
//   node scripts/ds/gerar.mjs [--check]

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAX_TOKENS,
  componenteMd,
  estimarTokens,
  extrairComponentes,
  quandoUsarDe,
} from "./componentes.mjs";
import { DSL_VALIDAR, lerValidador, validarSpecDsl } from "./dify.mjs";
import { DSL_PILOTO, lerConfig, pilotoDsl } from "./piloto.mjs";
import { RAIZ } from "./raiz.mjs";
import { lerTokens, tokensMd, tokensTs } from "./tokens.mjs";
import { SCHEMA, fonteDoAtelier } from "./validar.mjs";

export { RAIZ };
export const PASTA = "docs/ds";
export const FONTE_TOKENS = "src/styles.css";
/** The same tokens as TypeScript, for the live page at `/design-system`. */
export const TOKENS_TS = "src/lib/ds/tokens.gen.ts";

/** Every generated file, as `path from the repository root -> content`. */
export function gerarDocs(raiz = RAIZ) {
  const arquivos = new Map();
  const tokens = lerTokens(FONTE_TOKENS, readFileSync(join(raiz, FONTE_TOKENS), "utf8"));
  arquivos.set(`${PASTA}/tokens.md`, tokensMd(tokens, FONTE_TOKENS));
  // The live page reads the same tokens, so `--check` guards it too.
  arquivos.set(TOKENS_TS, tokensTs(tokens, FONTE_TOKENS));
  for (const componente of extrairComponentes(raiz)) {
    const caminho = `${PASTA}/componentes/${componente.nome}.md`;
    const md = componenteMd(componente, quandoUsarDe(ler(join(raiz, caminho))));
    if (estimarTokens(md) > MAX_TOKENS) {
      throw new Error(
        `${caminho} passa de ${MAX_TOKENS} tokens (≈${estimarTokens(md)}): o Dify cortaria o componente ao meio.`,
      );
    }
    arquivos.set(caminho, md);
  }
  // Built from the pages above, so one run is enough.
  const fonte = fonteDoAtelier(raiz, arquivos);
  arquivos.set(DSL_VALIDAR, validarSpecDsl(lerValidador(raiz), fonte));
  arquivos.set(
    DSL_PILOTO,
    pilotoDsl({
      validador: lerValidador(raiz),
      fonte,
      schema: JSON.parse(readFileSync(join(raiz, SCHEMA), "utf8")),
      tokensMd: arquivos.get(`${PASTA}/tokens.md`),
      config: lerConfig(raiz),
    }),
  );
  return arquivos;
}

/** Generated files already on disk, so a removed component drops its page. */
function existentes(raiz) {
  const pasta = join(raiz, PASTA, "componentes");
  let nomes = [];
  try {
    nomes = readdirSync(pasta)
      .filter((nome) => nome.endsWith(".md"))
      .sort();
  } catch {
    // No folder yet.
  }
  return [`${PASTA}/tokens.md`, ...nomes.map((nome) => `${PASTA}/componentes/${nome}`)];
}

function ler(caminho) {
  try {
    return readFileSync(caminho, "utf8");
  } catch {
    return undefined;
  }
}

/** Paths whose content on disk differs from the generated one. */
export function diferencas(raiz = RAIZ, arquivos = gerarDocs(raiz)) {
  const mudou = [...arquivos].filter(([caminho, texto]) => ler(join(raiz, caminho)) !== texto);
  const sobrou = existentes(raiz).filter(
    (caminho) => !arquivos.has(caminho) && ler(join(raiz, caminho)) !== undefined,
  );
  return [...mudou.map(([caminho]) => caminho), ...sobrou];
}

function escrever(raiz, arquivos) {
  for (const caminho of existentes(raiz)) {
    if (!arquivos.has(caminho)) rmSync(join(raiz, caminho), { force: true });
  }
  for (const [caminho, texto] of arquivos) {
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true });
    writeFileSync(join(raiz, caminho), texto);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arquivos = gerarDocs();
  if (process.argv.includes("--check")) {
    const fora = diferencas(RAIZ, arquivos);
    if (fora.length) {
      console.error(
        `docs/ds/ está desatualizado. Rode npm run ds:gerar.\n${fora.map((c) => `  ${c}`).join("\n")}`,
      );
      process.exit(1);
    }
    console.log(`docs/ds/ em dia (${arquivos.size} arquivos).`);
  } else {
    escrever(RAIZ, arquivos);
    console.log(`docs/ds/ gerado (${arquivos.size} arquivos).`);
  }
}
