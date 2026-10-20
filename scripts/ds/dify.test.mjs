import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { codigoDoNo, lerValidador } from "./dify.mjs";
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
