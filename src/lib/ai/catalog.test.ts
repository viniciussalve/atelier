import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findFont,
  findIconSet,
  fontStyleLabel,
  iconSetStyle,
  iconSetsFrom,
  isVariable,
  searchFonts,
  searchIconSets,
} from "./catalog.ts";
import { FONTS, ICON_INFO } from "./test-fixtures.ts";

const families = (list: { family: string }[]) => list.map((entry) => entry.family);
const prefixes = (list: { prefix: string }[]) => list.map((entry) => entry.prefix);

describe("iconSetsFrom", () => {
  const sets = iconSetsFrom(ICON_INFO);

  it("reads every visible set and leaves hidden ones out", () => {
    assert.deepEqual(prefixes(sets).sort(), ["fa6-solid", "logos", "lucide", "mingcute"]);
  });

  it("keeps grid, license, stroke and palette", () => {
    const lucide = sets.find((set) => set.prefix === "lucide");
    assert.deepEqual(
      {
        grid: lucide?.grid,
        license: lucide?.license,
        stroke: lucide?.stroke,
        palette: lucide?.palette,
        author: lucide?.author,
      },
      { grid: 24, license: "ISC", stroke: true, palette: false, author: "Lucide Contributors" },
    );
    assert.equal(sets.find((set) => set.prefix === "logos")?.grid, null);
  });
});

describe("iconSetStyle", () => {
  const sets = iconSetsFrom(ICON_INFO);
  const style = (prefix: string) => iconSetStyle(sets.find((set) => set.prefix === prefix)!);

  it("names line, solid, brand and color sets", () => {
    assert.equal(style("lucide"), "Contorno");
    assert.equal(style("fa6-solid"), "Preenchido");
    assert.equal(style("logos"), "Marcas");
  });

  it("falls back when nothing tells the style", () => {
    assert.equal(style("mingcute"), "Vários estilos");
  });
});

describe("fontStyleLabel and isVariable", () => {
  it("uses the library's style names", () => {
    assert.equal(fontStyleLabel("sans-serif"), "Sans serif");
    assert.equal(fontStyleLabel("monospace"), "Monoespaçada");
    assert.equal(fontStyleLabel("handwriting"), "Manuscrita");
  });

  it("calls a font variable when it has a weight axis", () => {
    assert.equal(isVariable(FONTS[0]), true);
    assert.equal(isVariable(FONTS[2]), false);
  });
});

describe("searchFonts", () => {
  it("ranks the exact name, then the start, then words, then anywhere", () => {
    assert.deepEqual(families(searchFonts(FONTS, { q: "inter" })), ["Inter", "Inter Tight"]);
    assert.deepEqual(families(searchFonts(FONTS, { q: "display" })), ["Playfair Display"]);
  });

  it("ignores accents and case", () => {
    assert.deepEqual(families(searchFonts(FONTS, { q: "ÚBUNTU" })), ["Ubuntu"]);
  });

  it("filters by category, variable axis and alphabet", () => {
    assert.deepEqual(families(searchFonts(FONTS, { category: "serif" })), ["Playfair Display"]);
    assert.deepEqual(families(searchFonts(FONTS, { variable: true })), ["Inter", "Inter Tight"]);
    assert.deepEqual(families(searchFonts(FONTS, { subset: "cyrillic" })), ["Caveat"]);
  });

  it("caps the list", () => {
    assert.equal(searchFonts(FONTS, { limit: 2 }).length, 2);
    assert.equal(searchFonts(FONTS, { limit: 0 }).length, 1);
  });
});

describe("searchIconSets", () => {
  const sets = iconSetsFrom(ICON_INFO);

  it("matches name or prefix", () => {
    assert.deepEqual(prefixes(searchIconSets(sets, { q: "fa6" })), ["fa6-solid"]);
    assert.deepEqual(prefixes(searchIconSets(sets, { q: "awesome" })), ["fa6-solid"]);
  });

  it("filters by grid, stroke, palette and license", () => {
    assert.deepEqual(prefixes(searchIconSets(sets, { grid: 24 })), ["mingcute", "lucide"]);
    assert.deepEqual(prefixes(searchIconSets(sets, { stroke: true })), ["lucide"]);
    assert.deepEqual(prefixes(searchIconSets(sets, { palette: true })), ["logos"]);
    assert.deepEqual(prefixes(searchIconSets(sets, { license: "mit" })), []);
    assert.deepEqual(prefixes(searchIconSets(sets, { license: "apache" })), ["mingcute"]);
  });

  it("lists bigger sets first without a query", () => {
    assert.equal(searchIconSets(sets, {})[0].prefix, "mingcute");
  });
});

describe("findFont and findIconSet", () => {
  it("finds by exact name, ignoring case and accents", () => {
    assert.equal(findFont(FONTS, "inter tight")?.family, "Inter Tight");
    assert.equal(findFont(FONTS, "Inte"), undefined);
    assert.equal(findIconSet(iconSetsFrom(ICON_INFO), "LUCIDE")?.name, "Lucide");
  });
});
