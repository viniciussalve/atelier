import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { RAIZ, diferencas, gerarDocs } from "./gerar.mjs";

test("docs/ds/ is up to date with the code (run npm run ds:gerar)", () => {
  assert.deepEqual(diferencas(), []);
});

test("flags a changed page and a page left over from a removed component", () => {
  const raiz = mkdtempSync(join(tmpdir(), "ds-"));
  cpSync(join(RAIZ, "docs/ds"), join(raiz, "docs/ds"), { recursive: true });
  cpSync(join(RAIZ, "src"), join(raiz, "src"), { recursive: true });
  symlinkSync(join(RAIZ, "node_modules"), join(raiz, "node_modules"));
  const arquivos = gerarDocs(raiz);
  assert.deepEqual(diferencas(raiz, arquivos), []);

  writeFileSync(join(raiz, "docs/ds/tokens.md"), "editado à mão\n");
  mkdirSync(join(raiz, "docs/ds/componentes"), { recursive: true });
  writeFileSync(join(raiz, "docs/ds/componentes/removido.md"), "x\n");
  assert.deepEqual(diferencas(raiz, arquivos), [
    "docs/ds/tokens.md",
    "docs/ds/componentes/removido.md",
  ]);
});
