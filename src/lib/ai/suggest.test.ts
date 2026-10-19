import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { iconSetsFrom } from "./catalog.ts";
import { snapshotOf } from "./snapshot.ts";
import { recommendFor, similarTo, suggestionJson, suggestionMarkdown } from "./suggest.ts";
import { FONTS, ICON_INFO } from "./test-fixtures.ts";
import { defaultLibrary } from "../library/seed.ts";

const deps = {
  fonts: FONTS,
  sets: iconSetsFrom(ICON_INFO),
  coverage: async (prefixes: string[], names: string[]) =>
    Object.fromEntries(
      prefixes.map((prefix) => [prefix, { found: names.slice(0, 1), missing: names.slice(1) }]),
    ),
};

describe("similarTo", () => {
  it("lists fonts close to a family, in Markdown and JSON", async () => {
    const result = await similarTo({ fonte: "inter", limite: 2 }, deps);
    assert.ok(result.ok);
    assert.equal(result.title, "Parecidas com Inter");
    assert.match(
      suggestionMarkdown(result),
      /^# Parecidas com Inter\n\n- \*\*Inter Tight\*\* \(\d+%\)/,
    );
    assert.equal(suggestionJson(result).parecidas?.[0].adicionar, "fonte:Inter Tight");
  });

  it("checks sample coverage for icon sets", async () => {
    const result = await similarTo(
      { conjunto: "lucide", amostras: ["house", "bell"], limite: 2 },
      deps,
    );
    assert.ok(result.ok);
    assert.ok(result.sets[0].reasons.includes("tem 1 de 2 das suas amostras"));
  });

  it("says what is missing", async () => {
    assert.deepEqual(await similarTo({ fonte: "Nada" }, deps), {
      ok: false,
      status: 404,
      error: "Não achei “Nada” no Google Fonts.",
    });
    assert.equal((await similarTo({}, deps)).ok, false);
  });
});

describe("recommendFor", () => {
  it("recommends from the library's taste, without what it already has", async () => {
    const snapshot = snapshotOf(defaultLibrary(), "2026-10-19T12:00:00.000Z");
    const result = await recommendFor(snapshot, "fontes", 3, deps);
    assert.ok(result.ok);
    assert.ok(result.fonts.length > 0);
    assert.ok(result.fonts.every((m) => !["Inter", "Playfair Display"].includes(m.item.family)));
  });

  it("asks for evaluations when nothing is liked", async () => {
    const empty = { v: 1 as const, em: "2026-10-19T12:00:00.000Z", fontes: [], icones: [] };
    const result = await recommendFor(empty, "icones", 3, deps);
    assert.equal(result.ok, false);
  });
});

describe("recommendFor, when the liked items are outside the catalogs", () => {
  it("says the catalogs do not have them, instead of asking for evaluations", async () => {
    const custom = {
      v: 1 as const,
      em: "2026-10-19T12:00:00.000Z",
      fontes: [{ n: "Marca Sans", k: "Marca Sans", v: "usar" as const }],
      icones: [],
    };
    const result = await recommendFor(custom, "fontes", 3, deps);
    assert.equal(result.ok, false);
    assert.ok(!result.ok && /Marca Sans/.test(result.error) && /catálogo/.test(result.error));
    assert.ok(!result.ok && !/Ainda não há nada marcado/.test(result.error));
  });

  it("treats a limit that is not a number as the default", async () => {
    const snapshot = snapshotOf(defaultLibrary(), "2026-10-19T12:00:00.000Z");
    const result = await recommendFor(snapshot, "fontes", Number.NaN, deps);
    assert.ok(result.ok && result.fonts.length > 0);
    const similar = await similarTo({ fonte: "Inter", limite: Number.NaN }, deps);
    assert.ok(similar.ok && similar.fonts.length > 0);
  });
});
