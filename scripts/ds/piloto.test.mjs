import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { lerValidador } from "./dify.mjs";
import { RAIZ } from "./gerar.mjs";
import {
  CODIGO_CONTEXTO,
  lerConfig,
  pilotoApp,
  promptDoLlm,
  schemaDoLlm,
  versaoDoPrompt,
} from "./piloto.mjs";
import { SCHEMA, fonteDoAtelier } from "./validar.mjs";

const fonte = fonteDoAtelier();
const schema = JSON.parse(readFileSync(join(RAIZ, SCHEMA), "utf8"));
const tokensMd = readFileSync(join(RAIZ, "docs/ds/tokens.md"), "utf8");
const config = lerConfig(RAIZ);
const montar = (mudar = {}) =>
  pilotoApp({
    validador: lerValidador(RAIZ),
    fonte,
    schema,
    tokensMd,
    config: { ...config, ...mudar },
  });
const no = (app, titulo) => app.workflow.graph.nodes.find((n) => n.data.title === titulo);
/** Runs a Code node's JavaScript the way Dify does: a bare script that defines main. */
const rodar = (codigo) => new Function(`${codigo}\nreturn main;`)();
const t19 = JSON.parse(
  readFileSync(join(RAIZ, "docs/ds/exemplos/t19-comparar-fontes.json"), "utf8"),
);

test("the LLM fills the v0 contract without meta, which the flow writes", () => {
  const llm = schemaDoLlm(schema);
  assert.equal("meta" in llm.properties, false);
  assert.deepEqual(llm.required, [
    "versao",
    "pedido",
    "tela",
    "tokens",
    "componentes",
    "fluxo",
    "lacunas",
  ]);
  assert.deepEqual(llm.properties.fluxo, schema.properties.fluxo);
});

test("the prompt carries every token and every real route, and its version follows its text", () => {
  const prompt = promptDoLlm({ tokensMd, rotas: fonte.rotas });
  for (const token of fonte.tokens) assert.ok(prompt.sistema.includes(`\`${token}\``), token);
  for (const rota of fonte.rotas) assert.ok(prompt.sistema.includes(rota), rota);
  assert.match(prompt.usuario, /\{\{#\d+\.pedido#\}\}/);
  assert.match(prompt.usuario, /\{\{#\d+\.erros#\}\}/);
  assert.match(versaoDoPrompt(prompt), /^[0-9a-f]{12}$/);
  assert.notEqual(
    versaoDoPrompt(prompt),
    versaoDoPrompt({ ...prompt, sistema: `${prompt.sistema}.` }),
  );
});

test("the graph: Início -> two searches -> contexto -> loop [LLM -> validar -> guardar] -> Fim", () => {
  const app = montar();
  const { nodes, edges } = app.workflow.graph;
  const porId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  assert.deepEqual(
    edges.map((e) => `${porId[e.source].data.type}->${porId[e.target].data.type}`),
    [
      "start->knowledge-retrieval",
      "knowledge-retrieval->knowledge-retrieval",
      "knowledge-retrieval->code",
      "code->loop",
      "loop-start->llm",
      "llm->code",
      "code->assigner",
      "loop->end",
    ],
  );
  const laco = nodes.find((n) => n.data.type === "loop");
  assert.equal(laco.data.loop_count, config.tentativas);
  assert.deepEqual(laco.data.break_conditions[0].variable_selector, [laco.id, "valida"]);
  // Array constants must be JSON text, or Dify empties them.
  for (const v of laco.data.loop_variables) assert.equal(typeof v.value, "string", v.label);
  for (const n of nodes.filter(
    (n) => ["llm", "code", "assigner"].includes(n.data.type) && n.parentId,
  )) {
    assert.equal(n.data.loop_id, laco.id, n.data.title);
  }
  assert.equal(
    nodes.filter((n) => n.data.type === "start" || n.data.type.startsWith("trigger")).length,
    1,
    "one Start and no trigger, so it can be published as API and MCP",
  );
  const fim = nodes.find((n) => n.data.type === "end");
  assert.deepEqual(
    fim.data.outputs.map((o) => o.variable),
    ["spec", "valida", "erros", "tentativas"],
  );
});

test("the model, the bases and the flow version come from the config", () => {
  const app = montar({ bases: { componentes: "b-comp", regras: "" }, flow_version: "7" });
  assert.deepEqual(no(app, "Buscar componentes").data.dataset_ids, ["b-comp"]);
  assert.deepEqual(no(app, "Buscar regras do DS").data.dataset_ids, []);
  const llm = no(app, "Escrever a spec").data;
  assert.equal(llm.model.provider, config.modelo.provider);
  assert.equal(llm.model.name, config.modelo.name);
  assert.equal(llm.model.completion_params.thinking, false);
  assert.equal(llm.structured_output_enabled, true);
  const env = Object.fromEntries(app.workflow.environment_variables.map((e) => [e.name, e.value]));
  assert.equal(env.flow_version, "7");
  assert.match(env.prompt_version, /^[0-9a-f]{12}$/);
});

test("validar fills meta, passes a good spec and piles up rejected tokens across attempts", () => {
  const main = rodar(no(montar(), "Validar e preencher meta").data.code);
  const { meta: _meta, ...gerado } = t19;
  const boa = main({
    gerado,
    tentativas: 0,
    rejeitados: [],
    flow_version: "1",
    prompt_version: "p",
  });
  assert.equal(boa.valida, 1);
  assert.equal(boa.tentativas, 1);
  assert.deepEqual(boa.spec.meta, {
    flow_version: "1",
    prompt_version: "p",
    tentativas: 1,
    tokens_rejeitados: [],
  });
  const ruim = main({
    gerado: {
      ...gerado,
      meta: { flow_version: "llm" },
      tokens: [{ nome: "--color-primary", uso: "x", fonte: "docs/ds/tokens.md" }],
    },
    tentativas: 1,
    rejeitados: ["--color-x"],
    flow_version: "1",
    prompt_version: "p",
  });
  assert.equal(ruim.valida, 0);
  assert.equal(ruim.tentativas, 2);
  assert.equal(ruim.spec.meta.flow_version, "1", "the LLM's meta is thrown away");
  assert.deepEqual(ruim.spec.meta.tokens_rejeitados, ["--color-x"]);
  assert.deepEqual(ruim.rejeitados, ["--color-x", "--color-primary"]);
  assert.match(ruim.erros[0], /--color-primary/);
  assert.equal(
    main({ gerado: null, tentativas: 0, rejeitados: null, flow_version: "1", prompt_version: "p" })
      .valida,
    0,
  );
});

test("contexto labels each chunk with the path the spec cites as fonte", () => {
  const main = rodar(CODIGO_CONTEXTO);
  const { contexto } = main({
    componentes: [{ content: "Para alternar.", metadata: { document_name: "segmented.md" } }],
    regras: [],
  });
  assert.match(
    contexto,
    /## Componentes\n\n### docs\/ds\/componentes\/segmented\.md\n\nPara alternar\./,
  );
  assert.match(contexto, /## Regras do DS\n\n\(nenhuma regra recuperada\)/);
});
