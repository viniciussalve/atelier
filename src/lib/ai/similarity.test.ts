import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { iconSetsFrom } from "./catalog.ts";
import {
  coverageFrom,
  fontSimilarity,
  iconSetSimilarity,
  recommend,
  similarFonts,
  similarIconSets,
  tasteOf,
  withCoverage,
} from "./similarity.ts";
import { FONTS, ICON_INFO, font } from "./test-fixtures.ts";

const [inter, interTight, ubuntu, playfair, spaceMono, caveat] = FONTS;
const SETS = iconSetsFrom(ICON_INFO);
const set = (prefix: string) => SETS.find((entry) => entry.prefix === prefix)!;

describe("fontSimilarity", () => {
  it("is 1 for the same font and lower for a different category", () => {
    assert.equal(fontSimilarity(inter, inter).score, 1);
    assert.ok(fontSimilarity(inter, interTight).score > fontSimilarity(inter, playfair).score);
    assert.ok(fontSimilarity(inter, interTight).score > fontSimilarity(inter, ubuntu).score);
  });

  it("explains what the two fonts share", () => {
    assert.deepEqual(fontSimilarity(inter, interTight).reasons, [
      "mesma categoria (Sans serif)",
      "variável",
      "mesma faixa de pesos",
      "mesmos alfabetos",
    ]);
    // Different categories: only the weights match.
    assert.deepEqual(fontSimilarity(spaceMono, caveat).reasons, ["mesma faixa de pesos"]);
  });
});

describe("iconSetSimilarity", () => {
  it("weighs style, grid and category", () => {
    const outline = iconSetSimilarity(set("lucide"), set("mingcute"));
    const brand = iconSetSimilarity(set("lucide"), set("logos"));
    assert.ok(outline.score > brand.score);
    assert.ok(outline.reasons.includes("grade 24"));
    assert.ok(outline.reasons.includes("mesma categoria (UI 24px)"));
  });
});

describe("similarFonts and similarIconSets", () => {
  it("ranks the closest first and leaves the target and exclusions out", () => {
    const list = similarFonts(inter, FONTS, { limit: 3 });
    assert.equal(list[0].item.family, "Inter Tight");
    assert.ok(list.every((match) => match.item.family !== "Inter"));
    const without = similarFonts(inter, FONTS, { exclude: ["Inter Tight"], limit: 3 });
    assert.ok(without.every((match) => match.item.family !== "Inter Tight"));
    assert.equal(similarIconSets(set("lucide"), SETS, { limit: 1 })[0].item.prefix, "mingcute");
  });
});

describe("tasteOf", () => {
  it("likes Usar and Bom or better, dislikes Evitar and Ruim or worse", () => {
    assert.deepEqual(
      tasteOf([
        { n: "Inter", k: "Inter", v: "usar" },
        { n: "Ubuntu", k: "Ubuntu", g: 4 },
        { n: "Playfair Display", k: "Playfair Display", v: "evitar", g: 5 },
        { n: "Caveat", k: "Caveat", g: 2 },
        { n: "Space Mono", k: "Space Mono", g: 3 },
        { n: "Sem chave" },
      ]),
      { liked: ["Inter", "Ubuntu"], disliked: ["Playfair Display", "Caveat"] },
    );
  });
});

describe("recommend", () => {
  it("moves toward what the person likes and away from what they avoid", () => {
    const catalog = [...FONTS, font({ family: "Inter Display", weights: [400, 500, 600, 700] })];
    const list = recommend([inter], [playfair], catalog, fontSimilarity, (entry) => entry.family, {
      exclude: ["Inter", "Playfair Display"],
      limit: 3,
    });
    assert.equal(list[0].item.family, "Inter Tight");
    assert.match(list[0].reasons[0], /^parecida com Inter: mesma categoria/);
    assert.ok(list.every((match) => !["Inter", "Playfair Display"].includes(match.item.family)));
    assert.equal(list.at(-1)?.item.family !== "Playfair Display", true);
  });

  it("returns nothing without anything liked", () => {
    assert.deepEqual(
      recommend([], [], FONTS, fontSimilarity, (entry) => entry.family, {}),
      [],
    );
  });
});

describe("coverage", () => {
  it("counts the names a set has, aliases included", () => {
    assert.deepEqual(
      coverageFrom(
        { icons: { house: {}, search: {} }, aliases: { home: {} }, not_found: ["bell"] },
        ["house", "search", "home", "bell"],
      ),
      { found: ["house", "search", "home"], missing: ["bell"] },
    );
  });

  it("blends coverage into the ranking and says it", () => {
    const matches = similarIconSets(set("lucide"), SETS, { limit: 3 });
    const ranked = withCoverage(matches, {
      mingcute: { found: ["house"], missing: ["bell", "search", "user"] },
      "fa6-solid": { found: ["house", "bell", "search", "user"], missing: [] },
    });
    assert.equal(ranked[0].item.prefix, "fa6-solid");
    assert.ok(ranked[0].reasons.includes("tem 4 de 4 das suas amostras"));
  });
});
