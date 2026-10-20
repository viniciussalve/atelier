// The Dify apps, as DSL generated from the repository. The `validar-spec`
// app (ALL-104) runs scripts/ds/validar-spec.mjs in a Code node, with what
// the atelier has embedded next to it, so the rule and the lists have a
// single source: regenerate and re-import when they change.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const DSL_VALIDAR = "dify/validar-spec.yml";
/** The DSL version Dify 1.17.1 writes and expects (api/constants/dsl_version.py). */
export const VERSAO_DSL = "0.7.0";
/** Dify refuses an output array longer than this (CODE_MAX_STRING_ARRAY_LENGTH). */
export const LIMITE_LISTA = 30;

const MAIN_VALIDAR = [
  "function main({ spec }) {",
  "  const r = validarSpec(spec, FONTE);",
  "  const erros =",
  "    r.erros.length > LIMITE",
  "      ? [...r.erros.slice(0, LIMITE - 1), `… e mais ${r.erros.length - LIMITE + 1} erros.`]",
  "      : r.erros;",
  "  return { valida: r.valida, erros, tokens_rejeitados: r.tokens_rejeitados.slice(0, LIMITE) };",
  "}",
];

/**
 * The Code node's JavaScript: the validator without `export`, the atelier's
 * lists as a constant, and the `main` Dify calls.
 * @param {string} validador source of validar-spec.mjs
 * @param {object} fonte what a spec may cite (fonteDoAtelier)
 * @param {string[]} [principal] the lines of `main`; the validar-spec app's by default
 */
export function codigoDoNo(validador, fonte, principal = MAIN_VALIDAR) {
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
    "// Dify refuses an output array longer than 30 (CODE_MAX_STRING_ARRAY_LENGTH).",
    `const LIMITE = ${LIMITE_LISTA};`,
    "",
    ...principal,
    "",
  ].join("\n");
}

export const lerValidador = (raiz) =>
  readFileSync(join(raiz, "scripts/ds/validar-spec.mjs"), "utf8");

const ID = { start: "1760918400001", code: "1760918400002", end: "1760918400003" };

export function no(id, tipo, x, data) {
  return {
    id,
    type: "custom",
    position: { x, y: 280 },
    positionAbsolute: { x, y: 280 },
    width: 244,
    height: 90,
    selected: false,
    sourcePosition: "right",
    targetPosition: "left",
    data: { type: tipo, desc: "", selected: false, ...data },
  };
}

export function aresta(de, para, tipoDe, tipoPara) {
  return {
    id: `${de}-source-${para}-target`,
    source: de,
    sourceHandle: "source",
    target: para,
    targetHandle: "target",
    type: "custom",
    zIndex: 0,
    data: { sourceType: tipoDe, targetType: tipoPara, isInIteration: false, isInLoop: false },
  };
}

const SAIDAS = [
  ["valida", "boolean"],
  ["erros", "array[string]"],
  ["tokens_rejeitados", "array[string]"],
];

/**
 * The `validar-spec` app (ALL-104): Start (the spec as text) -> Code -> End,
 * with no trigger node, so it can be published as API and as MCP server.
 */
export function validarSpecApp(validador, fonte) {
  return {
    app: {
      name: "validar-spec",
      mode: "workflow",
      icon: "✅",
      icon_type: "emoji",
      icon_background: "#E4FBCC",
      description:
        "Valida uma InterfaceSpec do atelier sem IA: schema v0, tokens, componentes, fontes e rotas. Gerado por npm run ds:gerar; não edite no Dify, reimporte.",
      use_icon_as_answer_icon: false,
    },
    dependencies: [],
    kind: "app",
    version: VERSAO_DSL,
    workflow: {
      conversation_variables: [],
      environment_variables: [],
      rag_pipeline_variables: [],
      features: {},
      graph: {
        nodes: [
          no(ID.start, "start", 80, {
            title: "Início",
            variables: [
              {
                variable: "spec",
                label: "InterfaceSpec (JSON)",
                type: "paragraph",
                required: true,
                max_length: 100000,
                options: [],
              },
            ],
          }),
          no(ID.code, "code", 380, {
            title: "validarSpec",
            code_language: "javascript",
            code: codigoDoNo(validador, fonte),
            variables: [
              { variable: "spec", value_selector: [ID.start, "spec"], value_type: "string" },
            ],
            outputs: Object.fromEntries(
              SAIDAS.map(([nome, type]) => [nome, { type, children: null }]),
            ),
          }),
          no(ID.end, "end", 680, {
            title: "Fim",
            outputs: SAIDAS.map(([nome, type]) => ({
              variable: nome,
              value_selector: [ID.code, nome],
              value_type: type,
            })),
          }),
        ],
        edges: [aresta(ID.start, ID.code, "start", "code"), aresta(ID.code, ID.end, "code", "end")],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    },
  };
}

/**
 * Enough YAML for a DSL: maps, lists and scalars. Multi-line strings become
 * literal blocks; every other string is double-quoted JSON, which YAML reads
 * as is, so a version or an id never turns into a number.
 */
export function yaml(valor, recuo = "") {
  const escalar = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));
  const bloco = (texto, r) =>
    `|-\n${texto
      .split("\n")
      .map((l) => (l ? `${r}  ${l}` : ""))
      .join("\n")}`;
  const item = (v, r) => {
    if (typeof v === "string" && v.includes("\n")) return ` ${bloco(v, r)}`;
    if (Array.isArray(v)) return v.length ? `\n${yaml(v, r)}` : " []";
    if (v && typeof v === "object") return Object.keys(v).length ? `\n${yaml(v, `${r}  `)}` : " {}";
    return ` ${v === null ? "null" : escalar(v)}`;
  };
  if (Array.isArray(valor)) {
    return valor
      .map((v) => {
        if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) {
          const [primeira, ...resto] = yaml(v, `${recuo}  `).split("\n");
          return [`${recuo}- ${primeira.trimStart()}`, ...resto].join("\n");
        }
        return `${recuo}-${item(v, `${recuo}  `)}`;
      })
      .join("\n");
  }
  return Object.entries(valor)
    .map(([chave, v]) => `${recuo}${chave}:${item(v, recuo)}`)
    .join("\n");
}

export const validarSpecDsl = (validador, fonte) =>
  `# Gerado por npm run ds:gerar. Importe no Dify 1.17.1 como arquivo DSL.\n${yaml(
    validarSpecApp(validador, fonte),
  )}\n`;
