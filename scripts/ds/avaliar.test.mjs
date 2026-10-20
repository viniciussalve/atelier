import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  CONJUNTO,
  RODADAS,
  avaliarCaso,
  casosDe,
  compararRodadas,
  lerCsv,
  metricas,
  relatorioMd,
  rodarFluxo,
  ultimaRodada,
} from "./avaliar.mjs";
import { RAIZ } from "./gerar.mjs";
import { fonteDoAtelier } from "./validar.mjs";

const fonte = fonteDoAtelier();
const t19 = JSON.parse(
  readFileSync(join(RAIZ, "docs/ds/exemplos/t19-comparar-fontes.json"), "utf8"),
);
const comTokens = (nomes, meta = {}) => ({
  ...t19,
  tokens: nomes.map((nome) => ({ nome, uso: "x", fonte: "docs/ds/tokens.md" })),
  meta: { ...t19.meta, ...meta },
});

test("reads quoted CSV fields with commas, quotes and empty cells", () => {
  assert.deepEqual(lerCsv('a,b,c\n1,"x, ""y""",\n2,z,w\n'), [
    { a: "1", b: 'x, "y"', c: "" },
    { a: "2", b: "z", c: "w" },
  ]);
});

test("the test set becomes cases, with the screen request taken out of 'Pedido: …'", () => {
  const casos = casosDe(readFileSync(join(RAIZ, CONJUNTO), "utf8"));
  assert.equal(casos.length, 21);
  const t01 = casos.find((c) => c.id === "T01");
  assert.deepEqual(
    [t01.pedido, t01.esperado, t01.tipo, t01.camada],
    ["Troque o valor fixo #93cfe4 usado num anel de foco", "--color-proof", "positivo", "token"],
  );
  assert.equal(
    casos.find((c) => c.id === "T19").pedido,
    "tela que compara duas fontes lado a lado com veredito",
  );
});

test("a positive token case passes when the spec names the expected token", () => {
  const caso = { id: "T01", camada: "token", tipo: "positivo", esperado: "--color-proof" };
  assert.equal(avaliarCaso(caso, comTokens(["--color-proof"]), fonte).token_certo, true);
  assert.equal(avaliarCaso(caso, comTokens(["--color-accent"]), fonte).token_certo, false);
});

test("a trap passes only without an invented token; negatives are not measured", () => {
  const armadilha = { id: "T11", camada: "token", tipo: "armadilha", esperado: "" };
  assert.equal(avaliarCaso(armadilha, comTokens(["--color-accent"]), fonte).armadilha_ok, true);
  const caiu = avaliarCaso(armadilha, comTokens(["--color-primary"]), fonte);
  assert.equal(caiu.armadilha_ok, false);
  assert.deepEqual(caiu.tokens_inventados, ["--color-primary"]);
  const negativo = { id: "T14", camada: "token", tipo: "negativo", esperado: "" };
  assert.equal(avaliarCaso(negativo, comTokens([]), fonte).medido, false);
});

test("no spec back is a failed case, not a crash", () => {
  const caso = { id: "T19", camada: "spec", tipo: "positivo", esperado: "" };
  const r = avaliarCaso(caso, undefined, fonte, "timeout");
  assert.equal(r.valida, false);
  assert.deepEqual(r.erros, ["O fluxo não devolveu spec: timeout"]);
});

test("metrics follow the evaluation plan and the blocking ones gate the round", () => {
  const casos = [
    { id: "T01", camada: "token", tipo: "positivo", esperado: "--color-proof" },
    { id: "T02", camada: "token", tipo: "positivo", esperado: "--color-bg" },
    { id: "T11", camada: "token", tipo: "armadilha", esperado: "" },
    { id: "T14", camada: "token", tipo: "negativo", esperado: "" },
  ];
  const specs = [
    comTokens(["--color-proof"], { tentativas: 1 }),
    comTokens(["--color-accent"], { tentativas: 2, tokens_rejeitados: ["--color-primary"] }),
    comTokens(["--color-accent"], { tentativas: 3 }),
    comTokens([], { tentativas: 1 }),
  ];
  const m = metricas(casos.map((c, i) => avaliarCaso(c, specs[i], fonte)));
  assert.deepEqual(m.spec_valida, { valor: 1, criterio: "= 100%", passou: true, bloqueia: true });
  assert.deepEqual(m.token_certo, {
    valor: 0.5,
    criterio: "≥ 90%",
    passou: false,
    bloqueia: false,
  });
  assert.equal(m.token_inventado_primeira.valor, 0.25);
  assert.equal(m.token_inventado_final.valor, 0);
  assert.equal(m.armadilha.valor, 1);
  assert.equal(m.tentativas_medias.valor, 1.75);
  assert.equal(m.falso_positivo.valor, null);
  assert.equal(m.aprovada, true, "only blocking metrics gate the round");
});

test("comparing with the last round says what got better and what got worse", () => {
  const antes = { metricas: { token_certo: { valor: 0.9 }, tentativas_medias: { valor: 1.2 } } };
  const agora = { metricas: { token_certo: { valor: 0.8 }, tentativas_medias: { valor: 1.1 } } };
  assert.deepEqual(compararRodadas(antes, agora), [
    { metrica: "token_certo", antes: 0.9, agora: 0.8, piorou: true },
    { metrica: "tentativas_medias", antes: 1.2, agora: 1.1, piorou: false },
  ]);
  assert.deepEqual(compararRodadas(undefined, agora), []);
});

test("the report shows the gate, every metric and each failed case", () => {
  const casos = [{ id: "T11", camada: "token", tipo: "armadilha", esperado: "" }];
  const resultados = [avaliarCaso(casos[0], comTokens(["--color-primary"]), fonte)];
  const md = relatorioMd({
    data: "2026-10-20T03:00:00Z",
    fluxo: "http://dify/v1",
    resultados,
    metricas: metricas(resultados),
    comparacao: [],
  });
  assert.match(md, /^# Rodada de avaliação · 2026-10-20T03:00:00Z/);
  assert.match(md, /\*\*Reprovada\*\*/);
  assert.match(md, /\| Armadilha \| 0% \| = 100% \| não \| sim \|/);
  assert.match(md, /- T11: tokens inventados: --color-primary/);
});

/** A Dify stream the way 1.17.1 writes it: `data: {json}` blocks and pings. */
function sse(...eventos) {
  const texto = eventos
    .map((e) => (typeof e === "string" ? `event: ${e}\n\n` : `data: ${JSON.stringify(e)}\n\n`))
    .join("");
  return new Response(
    new ReadableStream({
      start(c) {
        // Split mid-event, as a network would.
        const meio = Math.floor(texto.length / 2);
        c.enqueue(new TextEncoder().encode(texto.slice(0, meio)));
        c.enqueue(new TextEncoder().encode(texto.slice(meio)));
        c.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

test("runs the flow over the streaming API and reads the spec from workflow_finished", async () => {
  let pedido;
  const fetch = async (url, init) => {
    pedido = { url, init, body: JSON.parse(init.body) };
    return sse({ event: "workflow_started", data: {} }, "ping", {
      event: "workflow_finished",
      data: { status: "succeeded", outputs: { spec: JSON.stringify(t19) } },
    });
  };
  const r = await rodarFluxo("um pedido", { url: "http://dify/v1/", chave: "app-123", fetch });
  assert.equal(pedido.url, "http://dify/v1/workflows/run");
  assert.equal(pedido.init.headers.authorization, "Bearer app-123");
  assert.deepEqual(pedido.body, {
    inputs: { pedido: "um pedido" },
    response_mode: "streaming",
    user: "atelier-avaliador",
  });
  assert.deepEqual(r.spec, t19);
});

test("a failed run, an error event or a bad answer comes back as an error", async () => {
  const opcoes = (resposta) => ({ url: "http://dify/v1", chave: "k", fetch: async () => resposta });
  assert.match(
    (
      await rodarFluxo(
        "p",
        opcoes(sse({ event: "workflow_finished", data: { status: "failed", error: "LLM caiu" } })),
      )
    ).erro,
    /LLM caiu/,
  );
  assert.match(
    (await rodarFluxo("p", opcoes(sse({ event: "error", message: "quota" })))).erro,
    /quota/,
  );
  assert.match((await rodarFluxo("p", opcoes(new Response("não", { status: 401 })))).erro, /401/);
  assert.match(
    (
      await rodarFluxo(
        "p",
        opcoes(sse({ event: "workflow_finished", data: { status: "succeeded", outputs: {} } })),
      )
    ).erro,
    /sem `spec`/,
  );
});

test("the last round compared is the last one over the same cases", () => {
  const raiz = mkdtempSync(join(tmpdir(), "rodadas-"));
  mkdirSync(join(raiz, RODADAS), { recursive: true });
  const gravar = (nome, casos) =>
    writeFileSync(join(raiz, RODADAS, `${nome}.json`), JSON.stringify({ data: nome, casos }));
  gravar("2026-10-20T010000-000Z", ["T01", "T02"]);
  gravar("2026-10-20T020000-000Z", ["T01"]);
  gravar("2026-10-20T030000-000Z", ["T02", "T01"]);
  assert.equal(ultimaRodada(raiz, ["T01", "T02"]).data, "2026-10-20T010000-000Z");
  assert.equal(ultimaRodada(raiz, ["T01"]).data, "2026-10-20T020000-000Z");
  assert.equal(ultimaRodada(raiz, ["T19"]), undefined);
  assert.equal(ultimaRodada(mkdtempSync(join(tmpdir(), "vazio-")), ["T01"]), undefined);
});
