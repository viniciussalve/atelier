// Validates InterfaceSpec files against what the atelier has now: the schema
// in docs/ds, the tokens of docs/ds/tokens.md, the component pages, the
// documents of the knowledge bases and the routes of src/routes.
//
//   node scripts/ds/validar.mjs spec.json [outra.json ...]
//
// Prints one JSON result per spec; exits 1 when any is invalid.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ } from "./gerar.mjs";
import { validarSpec } from "./validar-spec.mjs";

export const SCHEMA = "docs/ds/interface-spec.v0.schema.json";
/** The sources of the "Regras do DS" base (conhecimento/configuracao-bases.md). */
const REGRAS = [
  ".claude/skills/atelier-iteracao/references/design.md",
  ".claude/skills/atelier-iteracao/references/arquitetura.md",
  ".claude/skills/atelier-iteracao/references/armadilhas.md",
  ".claude/skills/atelier-iteracao/references/verificacao.md",
  "README.md",
];

/** TanStack file routes: `index` is the folder itself, `[.]` escapes a dot. */
export function rotasDe(arquivos) {
  return arquivos
    .map((arquivo) => arquivo.replace(/\.tsx?$/, ""))
    .filter((arquivo) => !arquivo.split("/").some((parte) => parte.startsWith("__")))
    .map((arquivo) => `/${arquivo.replaceAll("[.]", ".").replace(/(^|\/)index$/, "")}`)
    .sort();
}

function listar(raiz, pasta) {
  const saida = [];
  const visitar = (relativo) => {
    for (const item of readdirSync(join(raiz, pasta, relativo), { withFileTypes: true })) {
      const caminho = relativo ? `${relativo}/${item.name}` : item.name;
      if (item.isDirectory()) visitar(caminho);
      else saida.push(caminho);
    }
  };
  visitar("");
  return saida;
}

/** What a spec may cite, read from the repository. */
export function fonteDoAtelier(raiz = RAIZ) {
  const ler = (caminho) => readFileSync(join(raiz, caminho), "utf8");
  const tokens = [...ler("docs/ds/tokens.md").matchAll(/^\| `(--[a-z][a-z0-9-]*)` \|/gm)].map(
    (m) => m[1],
  );
  const paginas = listar(raiz, "docs/ds/componentes").filter((nome) => nome.endsWith(".md"));
  const componentes = paginas.map((pagina) => {
    const md = ler(`docs/ds/componentes/${pagina}`);
    const exports = /\n## Export\n\n(.+)\n/.exec(md)?.[1] ?? "";
    return {
      nome: /^componente: (.+)$/m.exec(md)?.[1] ?? pagina.replace(/\.md$/, ""),
      exports: [...exports.matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    };
  });
  return {
    schema: JSON.parse(ler(SCHEMA)),
    tokens,
    componentes,
    rotas: rotasDe(listar(raiz, "src/routes")),
    fontes: [
      "docs/ds/tokens.md",
      ...paginas.map((pagina) => `docs/ds/componentes/${pagina}`),
      ...REGRAS.filter((caminho) => existsSync(join(raiz, caminho))),
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const specs = process.argv.slice(2);
  if (!specs.length) {
    console.error("Uso: npm run ds:validar -- <spec.json> [outra.json ...]");
    process.exit(2);
  }
  const fonte = fonteDoAtelier();
  let falhou = false;
  for (const caminho of specs) {
    const resultado = validarSpec(readFileSync(caminho, "utf8"), fonte);
    falhou ||= !resultado.valida;
    console.log(JSON.stringify({ spec: caminho, ...resultado }, null, 2));
  }
  process.exit(falhou ? 1 : 0);
}
