import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { PERMITIDOS, RAIZ, violacoes } from "./reuso.mjs";

/** A throwaway repository with `src/` files, so the rule reads only what the test wrote. */
function repo(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), "reuso-"));
  for (const [caminho, texto] of Object.entries(arquivos)) {
    const absoluto = join(raiz, caminho);
    mkdirSync(join(absoluto, ".."), { recursive: true });
    writeFileSync(absoluto, texto);
  }
  return raiz;
}

const nomes = (achados) => achados.map((a) => `${a.arquivo}:${a.regra}`);

test("the repository uses only tokens", () => {
  assert.deepEqual(violacoes(RAIZ), []);
});

test("HAPPY_PATH: token classes pass", () => {
  const raiz = repo({
    "src/components/limpo.tsx": 'export const X = () => <p className="bg-surface text-muted" />;\n',
  });
  assert.deepEqual(violacoes(raiz), []);
});

test("HEX_LITERAL: names the file, the line and the literal", () => {
  const raiz = repo({
    "src/components/hex.tsx": 'const A = "#93cfe4";\nconst B = 1;\nconst C = "#1c1e24";\n',
  });
  const achados = violacoes(raiz);
  assert.deepEqual(
    achados.map((a) => [a.arquivo, a.linha, a.trecho, a.regra]),
    [
      ["src/components/hex.tsx", 1, "#93cfe4", "hex"],
      ["src/components/hex.tsx", 3, "#1c1e24", "hex"],
    ],
  );
});

test("PALETTE_COLOUR: the shade is required, so `text-muted` stays legal", () => {
  const raiz = repo({
    "src/components/paleta.tsx":
      'const A = "bg-zinc-900";\nconst B = "text-red-500";\nconst C = "text-muted";\n',
  });
  assert.deepEqual(nomes(violacoes(raiz)), [
    "src/components/paleta.tsx:paleta",
    "src/components/paleta.tsx:paleta",
  ]);
});

test("ARBITRARY_PX: a measure fails, a media variant does not", () => {
  const raiz = repo({
    "src/components/medida.tsx":
      'const A = "w-[137px]";\nconst B = "min-[860px]:block";\nconst C = "text-[11px]";\n',
  });
  const achados = violacoes(raiz);
  assert.deepEqual(
    achados.map((a) => a.trecho),
    ["[137px]", "[11px]"],
  );
});

test("ALLOWLISTED: a permitted file is skipped even with a hex", () => {
  const [permitido] = Object.keys(PERMITIDOS);
  const raiz = repo({ [permitido]: 'const A = "#93cfe4";\n' });
  assert.deepEqual(violacoes(raiz), []);
});

test("GENERATED: routeTree.gen.ts and *.gen.ts are not judged", () => {
  const raiz = repo({
    "src/routeTree.gen.ts": 'const A = "#93cfe4";\n',
    "src/lib/tokens.gen.ts": 'const B = "bg-zinc-900";\n',
  });
  assert.deepEqual(violacoes(raiz), []);
});

test("only .ts and .tsx are read, so a stylesheet is not this rule's business", () => {
  const raiz = repo({
    "src/styles.css": "--color-x: #93cfe4;\n",
    "src/leia-me.md": "#93cfe4\n",
  });
  assert.deepEqual(violacoes(raiz), []);
});
