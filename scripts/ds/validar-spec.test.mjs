import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { RAIZ } from "./gerar.mjs";
import { validarSpec } from "./validar-spec.mjs";

const SCHEMA = JSON.parse(
  readFileSync(join(RAIZ, "docs/ds/interface-spec.v0.schema.json"), "utf8"),
);
const BASE = {
  schema: SCHEMA,
  tokens: ["--color-bg", "--color-proof", "--color-accent", "--color-good", "--radius-md"],
  componentes: [
    { nome: "segmented", exports: ["Segmented"] },
    { nome: "dialog", exports: ["Modal", "DialogClose"] },
  ],
  rotas: ["/", "/mcp"],
  fontes: [
    "docs/ds/tokens.md",
    "docs/ds/componentes/segmented.md",
    "docs/ds/componentes/dialog.md",
  ],
};

function spec(mudar = {}) {
  return {
    versao: "0",
    pedido: "Uma tela que alterna entre grade e lista",
    tela: { nome: "Coleção", resumo: "Ver os itens em grade ou em lista." },
    tokens: [{ nome: "--color-proof", uso: "anel de foco", fonte: "docs/ds/tokens.md" }],
    componentes: [
      {
        nome: "segmented",
        export: "Segmented",
        uso: "grade ou lista",
        fonte: "docs/ds/componentes/segmented.md",
      },
    ],
    fluxo: [{ rota: "/", acao: "clicar", alvo: "botão Lista" }],
    lacunas: [],
    meta: { flow_version: "1", prompt_version: "1", tentativas: 1, tokens_rejeitados: [] },
    ...mudar,
  };
}

test("a spec that only cites what exists is valid", () => {
  assert.deepEqual(validarSpec(spec(), BASE), { valida: true, erros: [], tokens_rejeitados: [] });
});

test("schema: says where and what, for missing, extra and wrong-type fields", () => {
  const { meta: _, ...semMeta } = spec();
  const r = validarSpec({ ...semMeta, extra: 1, versao: 0, fluxo: [] }, BASE);
  assert.equal(r.valida, false);
  assert.deepEqual(r.erros, [
    "(raiz): falta o campo obrigatório `meta`.",
    "extra: campo fora do schema.",
    'versao: deve ser "0".',
    "fluxo: precisa de pelo menos 1 item.",
  ]);
});

test("schema: enum, pattern, integer minimum and nested items", () => {
  const r = validarSpec(
    spec({
      fluxo: [{ rota: "sem-barra", acao: "voar", alvo: "x" }],
      meta: { flow_version: "1", prompt_version: "1", tentativas: 0.5, tokens_rejeitados: [1] },
    }),
    BASE,
  );
  assert.deepEqual(r.erros, [
    "fluxo[0].rota: não segue o padrão ^/.",
    "fluxo[0].acao: deve ser um de abrir, clicar, digitar, arrastar, pressionar, ver.",
    "meta.tentativas: deve ser inteiro.",
    "meta.tokens_rejeitados[0]: deve ser string.",
    "fluxo[0].rota: `sem-barra` não é uma rota do atelier. Rotas: /, /mcp.",
  ]);
});

test("T11: an invented token is rejected and the valid ones of its group are listed", () => {
  const r = validarSpec(
    spec({
      tokens: [{ nome: "--color-primary", uso: "cor primária", fonte: "docs/ds/tokens.md" }],
    }),
    BASE,
  );
  assert.equal(r.valida, false);
  assert.deepEqual(r.tokens_rejeitados, ["--color-primary"]);
  assert.deepEqual(r.erros, [
    "tokens[0].nome: `--color-primary` não existe. Tokens desse grupo: --color-bg, --color-proof, --color-accent, --color-good.",
  ]);
});

test("a typo gets the closest real name", () => {
  const r = validarSpec(
    spec({ tokens: [{ nome: "--color-prof", uso: "foco", fonte: "docs/ds/tokens.md" }] }),
    BASE,
  );
  assert.deepEqual(r.erros, [
    "tokens[0].nome: `--color-prof` não existe. Você quis dizer `--color-proof`?",
  ]);
});

test("tokens cited in free text count too, but not in lacunas or meta", () => {
  const r = validarSpec(
    spec({
      tela: { nome: "Coleção", resumo: "Fundo em var(--color-surface-2)." },
      tokens: [{ nome: "--color-bg", uso: "junto de --color-made-up", fonte: "docs/ds/tokens.md" }],
      lacunas: [{ falta: "--color-primary", motivo: "o atelier não tem cor primária" }],
      meta: {
        flow_version: "1",
        prompt_version: "1",
        tentativas: 2,
        tokens_rejeitados: ["--color-primary"],
      },
    }),
    BASE,
  );
  assert.deepEqual(r.tokens_rejeitados, ["--color-surface-2", "--color-made-up"]);
  assert.match(r.erros[0], /^tela\.resumo: `--color-surface-2` não existe\./);
  assert.match(r.erros[1], /^tokens\[0\]\.uso: `--color-made-up` não existe\./);
});

test("components: unknown page, export from another page, and unknown source", () => {
  const r = validarSpec(
    spec({
      componentes: [
        {
          nome: "pie-chart",
          export: "PieChart",
          uso: "gráfico",
          fonte: "docs/ds/componentes/pie-chart.md",
        },
        { nome: "dialog", export: "Dialog", uso: "modal", fonte: "docs/ds/componentes/dialog.md" },
        {
          nome: "segmentd",
          export: "Segmented",
          uso: "x",
          fonte: "docs/ds/componentes/segmented.md",
        },
      ],
    }),
    BASE,
  );
  assert.deepEqual(r.erros, [
    "componentes[0].nome: `pie-chart` não existe em docs/ds/componentes. Se o atelier não tem, ponha em `lacunas`.",
    "componentes[0].fonte: `docs/ds/componentes/pie-chart.md` não é um documento das bases.",
    "componentes[1].export: `Dialog` não é export de `dialog`. Exports: Modal, DialogClose.",
    "componentes[2].nome: `segmentd` não existe em docs/ds/componentes. Você quis dizer `segmented`?",
  ]);
});

test("routes are compared without query or hash", () => {
  const r = validarSpec(
    spec({
      fluxo: [
        { rota: "/?adicionar=fonte:Inter", acao: "abrir", alvo: "link" },
        { rota: "/mcp#x", acao: "ver", alvo: "resposta" },
        { rota: "/comparar", acao: "abrir", alvo: "tela" },
      ],
    }),
    BASE,
  );
  assert.deepEqual(r.erros, [
    "fluxo[2].rota: `/comparar` não é uma rota do atelier. Rotas: /, /mcp.",
  ]);
});

test("without lists, only the schema is checked; non-JSON input is an error, not a crash", () => {
  assert.equal(validarSpec(spec(), { schema: SCHEMA }).valida, true);
  assert.deepEqual(validarSpec("{nope", BASE), {
    valida: false,
    erros: ["JSON inválido: a spec não pôde ser lida."],
    tokens_rejeitados: [],
  });
  assert.equal(validarSpec(JSON.stringify(spec()), BASE).valida, true);
});

test("the validator knows every keyword the schema uses", () => {
  const conhecidas = new Set([
    ...["$schema", "$id", "title", "description", "type", "const", "enum", "pattern"],
    ...["minLength", "minimum", "minItems", "items", "required", "properties"],
    "additionalProperties",
  ]);
  const usadas = new Set();
  const visitar = (no) => {
    for (const [chave, valor] of Object.entries(no)) {
      usadas.add(chave);
      if (chave === "properties") Object.values(valor).forEach(visitar);
      else if (chave === "items") visitar(valor);
    }
  };
  visitar(SCHEMA);
  assert.deepEqual(
    [...usadas].filter((chave) => !conhecidas.has(chave)),
    [],
    "palavra-chave nova no schema: ensine o validador (checarSchema) antes",
  );
});
