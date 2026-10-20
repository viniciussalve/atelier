import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { codigoDoNo, lerValidador, validarSpecApp, yaml } from "./dify.mjs";
import { RAIZ } from "./gerar.mjs";
import { fonteDoAtelier } from "./validar.mjs";
import { validarSpec } from "./validar-spec.mjs";

/** Runs the Code node's JavaScript the way Dify does: a bare script that defines main. */
const rodar = (codigo) => new Function(`${codigo}\nreturn main;`)();

test("the Code node runs on its own and answers like the validator", () => {
  const fonte = fonteDoAtelier();
  const main = rodar(codigoDoNo(lerValidador(RAIZ), fonte));
  const t19 = readFileSync(join(RAIZ, "docs/ds/exemplos/t19-comparar-fontes.json"), "utf8");
  assert.deepEqual(main({ spec: t19 }), validarSpec(t19, fonte));
  assert.equal(main({ spec: t19 }).valida, true);

  const inventado = JSON.stringify({
    ...JSON.parse(t19),
    tokens: [{ nome: "--color-primary", uso: "x", fonte: "docs/ds/tokens.md" }],
  });
  assert.deepEqual(main({ spec: inventado }).tokens_rejeitados, ["--color-primary"]);
  assert.deepEqual(main({ spec: "{nope" }).erros, ["JSON inválido: a spec não pôde ser lida."]);
});

test("refuses a validator that grew an import", () => {
  assert.throws(
    () => codigoDoNo('import x from "y";\nexport function validarSpec() {}', {}),
    /import nem export/,
  );
});

test("main keeps the output lists within Dify's limit of 30", () => {
  const fonte = fonteDoAtelier();
  const main = rodar(codigoDoNo(lerValidador(RAIZ), fonte));
  const t19 = JSON.parse(
    readFileSync(join(RAIZ, "docs/ds/exemplos/t19-comparar-fontes.json"), "utf8"),
  );
  const tokens = Array.from({ length: 40 }, (_, i) => ({
    nome: `--color-x${i}`,
    uso: "x",
    fonte: "docs/ds/tokens.md",
  }));
  const r = main({ spec: JSON.stringify({ ...t19, tokens }) });
  assert.equal(r.valida, false);
  assert.equal(r.erros.length, 30);
  assert.equal(r.erros.at(-1), "… e mais 11 erros.");
  assert.equal(r.tokens_rejeitados.length, 30);
  assert.deepEqual(Object.keys(r), ["valida", "erros", "tokens_rejeitados"]);
});

test("the app is Start -> Code -> End, with no trigger, and End returns what Code declares", () => {
  const app = validarSpecApp(lerValidador(RAIZ), fonteDoAtelier());
  assert.equal(app.version, "0.7.0");
  assert.equal(app.app.mode, "workflow");
  const { nodes, edges } = app.workflow.graph;
  assert.deepEqual(
    nodes.map((n) => n.data.type),
    ["start", "code", "end"],
  );
  const [inicio, codigo, fim] = nodes;
  assert.equal(inicio.data.variables[0].variable, "spec");
  assert.equal(codigo.data.code_language, "javascript");
  assert.deepEqual(codigo.data.variables[0].value_selector, [inicio.id, "spec"]);
  assert.deepEqual(
    fim.data.outputs.map((o) => [o.variable, o.value_type, o.value_selector[0]]),
    Object.entries(codigo.data.outputs).map(([nome, saida]) => [nome, saida.type, codigo.id]),
  );
  assert.deepEqual(
    edges.map((e) => [e.source, e.target]),
    [
      [inicio.id, codigo.id],
      [codigo.id, fim.id],
    ],
  );
});

test("yaml: quoted scalars, literal blocks, nested lists and empty collections", () => {
  const texto = yaml({
    versao: "0.7.0",
    id: "1760",
    n: 1,
    sim: false,
    nada: null,
    vazio: [],
    obj: {},
    codigo: "linha 1\n  recuada\n\nfim",
    lista: [{ a: "x", b: ["y", 2] }, "z"],
  });
  assert.equal(
    texto,
    [
      'versao: "0.7.0"',
      'id: "1760"',
      "n: 1",
      "sim: false",
      "nada: null",
      "vazio: []",
      "obj: {}",
      "codigo: |-",
      "  linha 1",
      "    recuada",
      "",
      "  fim",
      "lista:",
      '- a: "x"',
      "  b:",
      '  - "y"',
      "  - 2",
      '- "z"',
    ].join("\n"),
  );
});

test("the committed DSL carries the Code node built from the validator", () => {
  const dsl = readFileSync(join(RAIZ, "dify/validar-spec.yml"), "utf8");
  const bloco = /\n( +)code: \|-\n([\s\S]*?)\n\1[a-z_]+:/.exec(dsl);
  const recuo = `${bloco[1]}  `;
  const codigo = bloco[2]
    .split("\n")
    .map((l) => l.slice(recuo.length))
    .join("\n");
  // `|-` drops the final newline; the rest must come back as it went in.
  assert.equal(codigo.trimEnd(), codigoDoNo(lerValidador(RAIZ), fonteDoAtelier()).trimEnd());
});
