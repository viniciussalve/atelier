// The pilot flow `interface-spec` (ALL-93): a screen request in, an
// InterfaceSpec v0 out. Generated from the repository like validar-spec, so
// the token list, the schema and the validation come from one place.
//
//   Início (pedido) -> busca em Componentes -> busca em Regras do DS
//     -> contexto -> Loop [LLM -> validar -> atualizar] -> Fim (spec)
//
// The loop retries with the validator's errors until the spec is valid or the
// attempts run out; meta is filled by code, never by the LLM.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VERSAO_DSL, aresta, codigoDoNo, no, yaml } from "./dify.mjs";

export const DSL_PILOTO = "dify/interface-spec.yml";
export const CONFIG_PILOTO = "dify/interface-spec.config.json";

export const lerConfig = (raiz) => JSON.parse(readFileSync(join(raiz, CONFIG_PILOTO), "utf8"));

// Node ids go into `{{#id.var#}}` templates, which only take [a-zA-Z0-9_].
const ID = {
  inicio: "1760918500001",
  componentes: "1760918500002",
  regras: "1760918500003",
  contexto: "1760918500004",
  laco: "1760918500010",
  llm: "1760918500011",
  validar: "1760918500012",
  atualizar: "1760918500013",
  fim: "1760918500020",
};
const INICIO_LACO = `${ID.laco}start`;

/** The schema the LLM fills: the v0 contract without `meta`, which code writes. */
export function schemaDoLlm(schema) {
  const { meta: _meta, ...propriedades } = schema.properties;
  return {
    type: "object",
    additionalProperties: false,
    required: schema.required.filter((campo) => campo !== "meta"),
    properties: propriedades,
  };
}

export function promptDoLlm({ tokensMd, rotas }) {
  const sistema = `Você escreve a InterfaceSpec v0 de uma tela do atelier, a ferramenta de avaliação de fontes e ícones. Responda só com o JSON.

Regras:
1. Tokens: use só os da lista abaixo, com o nome exato. Um nome fora dela não existe; não invente nem aproxime. A \`fonte\` de todo token é "docs/ds/tokens.md".
2. Componentes: use só os que aparecem no contexto recuperado, em "## Componentes". \`nome\` é o nome da página sem ".md" (ex.: "segmented"), \`export\` é um dos exports da página com a caixa do código, e \`fonte\` é o caminho no título da seção (ex.: "docs/ds/componentes/segmented.md").
3. Fluxo: os passos que a pessoa faz, em ordem. \`rota\` é uma das rotas reais abaixo (pode levar query, como "/?adicionar=fonte:Inter"); \`acao\` é uma de abrir, clicar, digitar, arrastar, pressionar, ver; \`alvo\` é o nome que a pessoa vê na tela.
4. Lacunas: se o pedido precisa de algo que o atelier não tem (um componente, um token), diga em \`lacunas\` o que falta e por quê, em vez de inventar.
5. Siga as regras do design system no contexto ("## Regras do DS").
6. \`versao\` é "0" e \`pedido\` repete o pedido. Não escreva \`meta\`.

Rotas reais: ${rotas.join(", ")}

Tokens (docs/ds/tokens.md):

${tokensMd.trim()}

Contexto recuperado:

{{#${ID.contexto}.contexto#}}`;
  const usuario = `Pedido: {{#${ID.inicio}.pedido#}}

Erros da tentativa anterior, se houver (corrija todos): {{#${ID.laco}.erros#}}`;
  return { sistema, usuario };
}

/** Changes whenever the prompt text does, so a round can tell prompts apart. */
export const versaoDoPrompt = ({ sistema, usuario }) =>
  createHash("sha256").update(`${sistema}\n---\n${usuario}`).digest("hex").slice(0, 12);

const MAIN_VALIDAR = [
  "function main({ gerado, pedido, tentativas, rejeitados, flow_version, prompt_version }) {",
  "  const anteriores = Array.isArray(rejeitados) ? rejeitados : [];",
  "  const n = (Number(tentativas) || 0) + 1;",
  "  const base = gerado && typeof gerado === 'object' && !Array.isArray(gerado) ? gerado : {};",
  "  // meta and pedido come from the flow, never from the LLM.",
  "  const { meta: _meta, ...corpo } = base;",
  "  const spec = {",
  "    ...corpo,",
  "    pedido: typeof pedido === 'string' ? pedido : corpo.pedido,",
  "    meta: { flow_version, prompt_version, tentativas: n, tokens_rejeitados: anteriores },",
  "  };",
  "  const r = validarSpec(spec, FONTE);",
  "  const erros =",
  "    r.erros.length > LIMITE",
  "      ? [...r.erros.slice(0, LIMITE - 1), `… e mais ${r.erros.length - LIMITE + 1} erros.`]",
  "      : r.erros;",
  "  const todos = [...new Set([...anteriores, ...r.tokens_rejeitados])].slice(0, LIMITE);",
  "  return { spec, valida: r.valida ? 1 : 0, erros, rejeitados: todos, tentativas: n };",
  "}",
];

/** Retrieved chunks as text, each under the path the spec cites as `fonte`. */
export const CODIGO_CONTEXTO = `function main({ componentes, regras }) {
  const lista = (itens) => (Array.isArray(itens) ? itens : []);
  const bloco = (itens, prefixo) =>
    lista(itens)
      .map((i) => \`### \${prefixo}\${i?.metadata?.document_name ?? "?"}\\n\\n\${i?.content ?? ""}\`)
      .join("\\n\\n");
  return {
    contexto: [
      "## Componentes",
      bloco(componentes, "docs/ds/componentes/") || "(nenhum componente recuperado)",
      "## Regras do DS",
      bloco(regras, "") || "(nenhuma regra recuperada)",
    ].join("\\n\\n"),
    // Zero tells the evaluator the bases gave nothing, so component cases
    // and the screen trap measured nothing.
    recuperados: lista(componentes).length + lista(regras).length,
  };
}
`;

const modelo = (config, extra = {}) => ({
  provider: config.modelo.provider,
  name: config.modelo.name,
  mode: "chat",
  // Structured output goes through JSON mode for DeepSeek; thinking stays off.
  completion_params: { thinking: false, ...extra },
});

function busca(id, x, titulo, base, topK, config) {
  return no(id, "knowledge-retrieval", x, {
    title: titulo,
    query_variable_selector: [ID.inicio, "pedido"],
    dataset_ids: base ? [base] : [],
    retrieval_mode: "multiple",
    multiple_retrieval_config: {
      top_k: topK,
      score_threshold: null,
      reranking_enable: false,
      reranking_mode: "reranking_model",
    },
    // conhecimento/configuracao-bases.md: Automático primeiro; Parameter
    // Extractor + Manual só se o automático errar no teste.
    metadata_filtering_mode: "automatic",
    metadata_model_config: modelo(config),
  });
}

/** A node inside the loop: the engine needs loop_id; the rest is for the canvas. */
function dentro(id, tipo, x, data) {
  const { positionAbsolute: _fora, ...base } = no(id, tipo, x, {
    ...data,
    isInLoop: true,
    isInIteration: false,
    loop_id: ID.laco,
  });
  return { ...base, parentId: ID.laco, zIndex: 1002, position: { x, y: 80 } };
}

function arestaDentro(de, para, tipoDe, tipoPara) {
  const base = aresta(de, para, tipoDe, tipoPara);
  return { ...base, zIndex: 1002, data: { ...base.data, isInLoop: true, loop_id: ID.laco } };
}

const SAIDAS_VALIDAR = {
  spec: "object",
  valida: "number",
  erros: "array[string]",
  rejeitados: "array[string]",
  tentativas: "number",
};

const ENV_IDS = {
  flow_version: "7d0b3c1e-9a52-4c0e-8f61-5a1b2c3d4e01",
  prompt_version: "7d0b3c1e-9a52-4c0e-8f61-5a1b2c3d4e02",
};

/**
 * @param {{ validador: string, fonte: object, schema: object, tokensMd: string, config: object }} p
 */
export function pilotoApp({ validador, fonte, schema, tokensMd, config }) {
  const prompt = promptDoLlm({ tokensMd, rotas: fonte.rotas });
  const versaoPrompt = versaoDoPrompt(prompt);
  const nodes = [
    no(ID.inicio, "start", 80, {
      title: "Início",
      variables: [
        {
          variable: "pedido",
          label: "Pedido de tela",
          type: "paragraph",
          required: true,
          max_length: 4000,
          options: [],
        },
      ],
    }),
    busca(ID.componentes, 380, "Buscar componentes", config.bases.componentes, 3, config),
    busca(ID.regras, 680, "Buscar regras do DS", config.bases.regras, 4, config),
    no(ID.contexto, "code", 980, {
      title: "Montar contexto",
      code_language: "javascript",
      code: CODIGO_CONTEXTO,
      variables: [
        { variable: "componentes", value_selector: [ID.componentes, "result"] },
        { variable: "regras", value_selector: [ID.regras, "result"] },
      ],
      outputs: {
        contexto: { type: "string", children: null },
        recuperados: { type: "number", children: null },
      },
    }),
    {
      ...no(ID.laco, "loop", 1280, {
        title: "Gerar e corrigir",
        start_node_id: INICIO_LACO,
        loop_count: config.tentativas,
        logical_operator: "and",
        break_conditions: [
          {
            id: "pronto",
            varType: "number",
            variable_selector: [ID.laco, "valida"],
            comparison_operator: "=",
            value: "1",
          },
        ],
        // Array constants must be JSON text: a YAML list is silently emptied.
        loop_variables: [
          { id: "v-spec", label: "spec", var_type: "object", value_type: "constant", value: "{}" },
          {
            id: "v-valida",
            label: "valida",
            var_type: "number",
            value_type: "constant",
            value: "0",
          },
          {
            id: "v-erros",
            label: "erros",
            var_type: "array[string]",
            value_type: "constant",
            value: "[]",
          },
          {
            id: "v-rejeitados",
            label: "rejeitados",
            var_type: "array[string]",
            value_type: "constant",
            value: "[]",
          },
          {
            id: "v-tentativas",
            label: "tentativas",
            var_type: "number",
            value_type: "constant",
            value: "0",
          },
        ],
      }),
      width: 1000,
      height: 260,
      zIndex: 1,
    },
    {
      id: INICIO_LACO,
      type: "custom-loop-start",
      parentId: ID.laco,
      zIndex: 1002,
      draggable: false,
      selectable: false,
      position: { x: 60, y: 80 },
      data: { type: "loop-start", title: "", desc: "", isInLoop: true },
    },
    dentro(ID.llm, "llm", 180, {
      title: "Escrever a spec",
      model: modelo(config, { temperature: 0.2, max_tokens: 8192 }),
      prompt_template: [
        { id: "sistema", role: "system", text: prompt.sistema, edition_type: "basic" },
        { id: "usuario", role: "user", text: prompt.usuario, edition_type: "basic" },
      ],
      context: { enabled: false, variable_selector: [] },
      vision: { enabled: false },
      memory: null,
      reasoning_format: "separated",
      structured_output_enabled: true,
      structured_output: { schema: schemaDoLlm(schema) },
    }),
    dentro(ID.validar, "code", 480, {
      title: "Validar e preencher meta",
      code_language: "javascript",
      code: codigoDoNo(validador, fonte, MAIN_VALIDAR),
      variables: [
        { variable: "gerado", value_selector: [ID.llm, "structured_output"] },
        { variable: "pedido", value_selector: [ID.inicio, "pedido"] },
        { variable: "tentativas", value_selector: [ID.laco, "tentativas"] },
        { variable: "rejeitados", value_selector: [ID.laco, "rejeitados"] },
        { variable: "flow_version", value_selector: ["env", "flow_version"] },
        { variable: "prompt_version", value_selector: ["env", "prompt_version"] },
      ],
      outputs: Object.fromEntries(
        Object.entries(SAIDAS_VALIDAR).map(([nome, type]) => [nome, { type, children: null }]),
      ),
    }),
    dentro(ID.atualizar, "assigner", 780, {
      title: "Guardar a tentativa",
      version: "2",
      items: Object.keys(SAIDAS_VALIDAR).map((nome) => ({
        variable_selector: [ID.laco, nome],
        input_type: "variable",
        operation: "over-write",
        value: [ID.validar, nome],
      })),
    }),
    no(ID.fim, "end", 2380, {
      title: "Fim",
      outputs: [
        ["spec", "object"],
        ["valida", "number"],
        ["erros", "array[string]"],
        ["tentativas", "number"],
      ]
        .map(([nome, tipo]) => ({
          variable: nome,
          value_selector: [ID.laco, nome],
          value_type: tipo,
        }))
        .concat({
          variable: "recuperados",
          value_selector: [ID.contexto, "recuperados"],
          value_type: "number",
        }),
    }),
  ];
  const edges = [
    aresta(ID.inicio, ID.componentes, "start", "knowledge-retrieval"),
    aresta(ID.componentes, ID.regras, "knowledge-retrieval", "knowledge-retrieval"),
    aresta(ID.regras, ID.contexto, "knowledge-retrieval", "code"),
    aresta(ID.contexto, ID.laco, "code", "loop"),
    arestaDentro(INICIO_LACO, ID.llm, "loop-start", "llm"),
    arestaDentro(ID.llm, ID.validar, "llm", "code"),
    arestaDentro(ID.validar, ID.atualizar, "code", "assigner"),
    aresta(ID.laco, ID.fim, "loop", "end"),
  ];
  return {
    app: {
      name: "interface-spec",
      mode: "workflow",
      icon: "🧭",
      icon_type: "emoji",
      icon_background: "#E0F2FE",
      description:
        "Fluxo piloto (ALL-93): pedido de tela -> InterfaceSpec v0, validada e corrigida em até " +
        `${config.tentativas} tentativas. Gerado por npm run ds:gerar; não edite no Dify, reimporte.`,
      use_icon_as_answer_icon: false,
    },
    dependencies: [],
    kind: "app",
    version: VERSAO_DSL,
    workflow: {
      conversation_variables: [],
      environment_variables: Object.entries({
        flow_version: config.flow_version,
        prompt_version: versaoPrompt,
      }).map(([nome, valor]) => ({
        id: ENV_IDS[nome],
        name: nome,
        value: valor,
        value_type: "string",
        description:
          nome === "prompt_version" ? "Hash do prompt, gerado." : "Sobe a cada mudança do fluxo.",
        selector: ["env", nome],
      })),
      rag_pipeline_variables: [],
      features: {},
      graph: { nodes, edges, viewport: { x: 0, y: 0, zoom: 0.7 } },
    },
  };
}

export const pilotoDsl = (p) =>
  `# Gerado por npm run ds:gerar a partir de ${CONFIG_PILOTO}. Importe no Dify 1.17.1 como arquivo DSL.\n${yaml(
    pilotoApp(p),
  )}\n`;
