import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import {
  DELIMITADOR,
  MARCA_IA,
  PENDENTE,
  componenteMd,
  extrairComponentes,
  quandoUsarDe,
} from "./componentes.mjs";
import { RAIZ } from "./gerar.mjs";

function projeto(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), "ds-componentes-"));
  symlinkSync(join(RAIZ, "node_modules"), join(raiz, "node_modules"));
  for (const [caminho, texto] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true });
    writeFileSync(join(raiz, caminho), texto);
  }
  return raiz;
}

const FIXTURE = {
  "src/components/ui/chip.tsx": `import type { HTMLAttributes, ReactNode } from "react";

export const LIMITE = 3;

/** A small label. */
export function Chip({
  tone,
  children,
}: {
  /** Color of the chip. */
  tone?: "good" | "bad";
  children: ReactNode;
}) {
  return <span data-tone={tone}>{children}</span>;
}

export function ChipGroup(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}
`,
  "src/components/library/browser/card.tsx": `import { Chip } from "@/components/ui/chip";

export function Card() {
  return (
    <div>
      <Chip tone="good">Ok</Chip>
    </div>
  );
}
`,
  "src/components/library/orphan.tsx": `export function Orphan() {
  return null;
}
`,
  "src/routes/index.tsx": `import { Card } from "../components/library/browser/card";

export const Page = () => <Card />;
`,
};

test("reads exports and props from the types, and skips constants", () => {
  const [chip] = extrairComponentes(projeto(FIXTURE));
  assert.equal(chip.nome, "chip");
  assert.equal(chip.camada, "ui");
  assert.deepEqual(
    chip.exports.map((e) => e.nome),
    ["Chip", "ChipGroup"],
  );
  const [principal, grupo] = chip.exports;
  assert.equal(principal.descricao, "A small label.");
  assert.deepEqual(principal.proprias, [
    { nome: "tone", tipo: '"good" | "bad"', obrigatoria: false, descricao: "Color of the chip." },
    { nome: "children", tipo: "ReactNode", obrigatoria: true, descricao: "" },
  ]);
  // HTML attributes come from React's types: counted, not listed.
  assert.deepEqual(grupo.proprias, []);
  assert.equal(grupo.herdadas[0].pacote, "react");
  assert.ok(grupo.herdadas[0].total > 50);
});

test("finds where a component appears and a real use of it", () => {
  const [chip, card, orphan] = extrairComponentes(projeto(FIXTURE));
  assert.deepEqual(chip.ondeAparece, [
    { area: "Coleção", arquivo: "src/components/library/browser/card.tsx" },
  ]);
  assert.deepEqual(chip.trecho, {
    de: "src/components/library/browser/card.tsx",
    codigo: '<Chip tone="good">Ok</Chip>',
  });
  assert.deepEqual(card.ondeAparece, [{ area: "Rota /", arquivo: "src/routes/index.tsx" }]);
  assert.equal(card.trecho.codigo, "<Card />");
  assert.equal(orphan.nome, "orphan");
  assert.deepEqual(orphan.ondeAparece, []);
  assert.equal(orphan.trecho, undefined);
});

test("refuses two components with the same file name", () => {
  const raiz = projeto({
    ...FIXTURE,
    "src/components/library/shared/chip.tsx": "export function Chip() { return null; }\n",
  });
  assert.throws(() => extrairComponentes(raiz), /mesmo nome de arquivo/);
});

test("the page has the fixed headings, lowercase metadata and ends in the delimiter", () => {
  const [chip] = extrairComponentes(projeto(FIXTURE));
  const md = componenteMd(chip, undefined);
  assert.match(
    md,
    /^---\ncomponente: chip\ncamada: ui\narquivo: src\/components\/ui\/chip\.tsx\nexport: chip, chipgroup\n---\n/,
  );
  const titulos = [...md.matchAll(/^##? (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(titulos, [
    "Chip",
    "Camada",
    "Arquivo",
    "Export",
    "Props",
    "Telas onde aparece",
    "Quando usar",
    "Trecho de código",
  ]);
  assert.match(md, /\| `tone` \| `"good" \\\| "bad"` \| não \| Color of the chip\. \|/);
  assert.match(md, /Também aceita as props herdadas: \d+ de `react`\./);
  assert.ok(md.includes(`${MARCA_IA}\n\n${PENDENTE}`));
  assert.ok(md.endsWith(`\n${DELIMITADOR}\n`));
  assert.equal(md.split(DELIMITADOR).length, 2);
});

test("keeps the AI-written text when regenerating, and nothing else", () => {
  const [chip] = extrairComponentes(projeto(FIXTURE));
  assert.equal(quandoUsarDe(componenteMd(chip, undefined)), undefined);
  const texto = "Para marcar um estado curto.\n\n- Evite em listas longas.";
  const md = componenteMd(chip, texto);
  assert.equal(quandoUsarDe(md), texto);
  assert.equal(componenteMd(chip, quandoUsarDe(md)), md);
  assert.equal(quandoUsarDe(undefined), undefined);
});
