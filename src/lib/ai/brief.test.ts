import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { guide, libraryBrief, robotsTxt } from "./brief.ts";
import { parseAddList } from "./additions.ts";
import { snapshotOf } from "./snapshot.ts";
import { defaultLibrary } from "../library/seed.ts";

const BASE = "https://atelier.app";
const brief = libraryBrief(snapshotOf(defaultLibrary(), "2026-10-19T12:00:00.000Z"), BASE);

describe("libraryBrief", () => {
  it("lists each item with faces, verdict and context", () => {
    assert.match(
      brief,
      /- \*\*Inter\*\*: Usar; nota geral Ótimo; Leitura Ótimo, Interface Ótimo, Distinção Ótimo, Tom Bom; estilo Sans serif; pesos 400–600; licença OFL; tags legível, ui; pastas Sans serif \/ Interface\. Notas: “Corpo de chat e labels\. Distingue bem I, l e 1\.”/,
    );
    assert.match(brief, /- \*\*Lucide\*\* \(`lucide`\): Usar;/);
    assert.match(brief, /- \*\*Roboto\*\*: sem veredito; ainda não avaliado;/);
  });

  it("puts decided items before unevaluated ones", () => {
    assert.ok(brief.indexOf("**Inter**") < brief.indexOf("**Roboto**"));
  });

  it("dates the snapshot and counts the items", () => {
    assert.match(brief, /de 19\/10\/2026/);
    assert.match(brief, /## Fontes na biblioteca \(9\)/);
    assert.match(brief, /## Conjuntos de ícones na biblioteca \(8\)/);
  });

  it("teaches the add link with an example the app reads back", () => {
    const example = /(https:\/\/atelier\.app\/\?adicionar=\S+)/.exec(brief)?.[1] ?? "";
    const specs = parseAddList(new URL(example).searchParams.get("adicionar") ?? "");
    assert.deepEqual(specs, [
      { kind: "font", key: "Inter Tight" },
      { kind: "icon", key: "mingcute" },
    ]);
  });

  it("explains the scale and every criterion", () => {
    assert.match(brief, /1 Muito ruim, 2 Ruim, 3 Ok, 4 Bom, 5 Ótimo/);
    assert.match(brief, /- Leitura \(`leitura`, peso 3\):/);
    assert.match(brief, /- Cobertura \(`cobertura`, peso 2\):/);
  });

  it("says when the snapshot was trimmed", () => {
    const trimmed = libraryBrief(
      { ...snapshotOf(defaultLibrary(), "2026-10-19T12:00:00.000Z"), resumido: true },
      BASE,
    );
    assert.match(trimmed, /saiu resumido/);
    assert.doesNotMatch(brief, /saiu resumido/);
  });
});

describe("guide and robotsTxt", () => {
  it("guides without anyone's library and points to the link", () => {
    const text = guide(BASE);
    assert.match(text, /^# Atelier\n\n> /);
    assert.match(text, /Link para IA/);
    assert.match(text, /https:\/\/atelier\.app\/api\/fontes\?/);
    assert.doesNotMatch(text, /\*\*Inter\*\*:/);
  });

  it("allows everything and points to llms.txt", () => {
    assert.equal(
      robotsTxt(BASE),
      "# Atelier. Instruções para IAs: https://atelier.app/llms.txt\nUser-agent: *\nAllow: /\n",
    );
  });
});
