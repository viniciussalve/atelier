// The Dify apps, as DSL generated from the repository. The `validar-spec`
// app (ALL-104) runs scripts/ds/validar-spec.mjs in a Code node, with what
// the atelier has embedded next to it, so the rule and the lists have a
// single source: regenerate and re-import when they change.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The Code node's JavaScript: the validator without `export`, the atelier's
 * lists as a constant, and the `main` Dify calls.
 * @param {string} validador source of validar-spec.mjs
 * @param {object} fonte what a spec may cite (fonteDoAtelier)
 */
export function codigoDoNo(validador, fonte) {
  const corpo = validador.replace(/^export function /m, "function ");
  if (/^\s*(import|export)\b/m.test(corpo)) {
    throw new Error("validar-spec.mjs não pode ter import nem export além de validarSpec.");
  }
  return [
    "// Gerado por npm run ds:gerar a partir de scripts/ds/validar-spec.mjs. Não edite aqui.",
    corpo.trim(),
    "",
    `const FONTE = ${JSON.stringify(fonte)};`,
    "",
    "function main({ spec }) {",
    "  return validarSpec(spec, FONTE);",
    "}",
    "",
  ].join("\n");
}

export const lerValidador = (raiz) =>
  readFileSync(join(raiz, "scripts/ds/validar-spec.mjs"), "utf8");
