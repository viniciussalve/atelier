import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { RAIZ } from "./gerar.mjs";
import { fonteDoAtelier, rotasDe } from "./validar.mjs";
import { validarSpec } from "./validar-spec.mjs";

const execFileAsync = promisify(execFile);
const EXEMPLOS = join(RAIZ, "docs/ds/exemplos");
const ler = (nome) => JSON.parse(readFileSync(join(EXEMPLOS, nome), "utf8"));

test("routes come from the TanStack file names", () => {
  assert.deepEqual(
    rotasDe(["__root.tsx", "index.tsx", "ia.ts", "llms[.]txt.ts", "api/fontes.ts", "api/index.ts"]),
    ["/", "/api", "/api/fontes", "/ia", "/llms.txt"],
  );
});

test("reads what a spec may cite from the repository", () => {
  const fonte = fonteDoAtelier();
  assert.equal(fonte.tokens.length, 26);
  assert.ok(fonte.tokens.includes("--color-proof-ink"));
  assert.deepEqual(
    fonte.componentes.find((c) => c.nome === "dialog"),
    { nome: "dialog", exports: ["Modal", "DialogClose"] },
  );
  assert.ok(fonte.rotas.includes("/") && fonte.rotas.includes("/mcp"));
  assert.ok(fonte.fontes.includes(".claude/skills/atelier-iteracao/references/armadilhas.md"));
});

test("every example in docs/ds/exemplos is valid against the atelier as it is", () => {
  const fonte = fonteDoAtelier();
  const exemplos = readdirSync(EXEMPLOS).filter((nome) => nome.endsWith(".json"));
  assert.ok(exemplos.length >= 3);
  for (const nome of exemplos) {
    assert.deepEqual(validarSpec(ler(nome), fonte).erros, [], nome);
  }
});

test("T21: the missing chart goes in lacunas, not in componentes", () => {
  const fonte = fonteDoAtelier();
  const t21 = ler("t21-grafico-de-pizza.json");
  assert.deepEqual(t21.componentes, []);
  const inventado = {
    ...t21,
    componentes: [
      {
        nome: "pie-chart",
        export: "PieChart",
        uso: "gráfico",
        fonte: "docs/ds/componentes/pie-chart.md",
      },
    ],
  };
  const r = validarSpec(inventado, fonte);
  assert.equal(r.valida, false);
  assert.match(r.erros[0], /ponha em `lacunas`/);
});

test("T11: --color-primary is rejected and the real colors are listed", () => {
  const t19 = ler("t19-comparar-fontes.json");
  const r = validarSpec(
    {
      ...t19,
      tokens: [{ nome: "--color-primary", uso: "cor primária", fonte: "docs/ds/tokens.md" }],
    },
    fonteDoAtelier(),
  );
  assert.deepEqual(r.tokens_rejeitados, ["--color-primary"]);
  assert.match(r.erros[0], /--color-accent, --color-accent-fg/);
});

test("the command prints one result per spec and exits 1 when one fails", async () => {
  const pasta = mkdtempSync(join(tmpdir(), "spec-"));
  const ruim = join(pasta, "ruim.json");
  writeFileSync(ruim, JSON.stringify({ ...ler("t20-buscar-icones.json"), versao: "1" }));
  const boa = join(EXEMPLOS, "t20-buscar-icones.json");
  const script = join(RAIZ, "scripts/ds/validar.mjs");
  const ok = await execFileAsync(process.execPath, [script, boa]);
  assert.match(ok.stdout, /"valida": true/);
  await assert.rejects(execFileAsync(process.execPath, [script, boa, ruim]), (erro) => {
    assert.equal(erro.code, 1);
    assert.match(erro.stdout, /"valida": true[\s\S]*"valida": false/);
    assert.match(erro.stdout, /versao: deve ser \\"0\\"\./);
    return true;
  });
});
