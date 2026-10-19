import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  applyFilters,
  collectionList,
  defaultNav,
  facetCounts,
  matchesQuery,
  scopeToView,
  sortAssets,
  viewCounts,
} from "./filters.ts";
import { asset, folder } from "./test-fixtures.ts";
import type { Filters, KindNav } from "./types.ts";

const folders = [
  folder("sans", "Sans serif"),
  folder("ui", "Interface", "sans"),
  folder("mono", "Mono"),
];

const assets = [
  asset({
    id: "inter",
    name: "Inter",
    folderIds: ["ui"],
    tags: ["legível", "ui"],
    license: "OFL",
    style: "Sans serif",
    verdict: "usar",
    criteria: { leitura: { value: 5, note: "" } },
    lastUsedAt: "2026-10-19T10:00:00.000Z",
  }),
  asset({
    id: "roboto",
    name: "Roboto",
    folderIds: ["sans"],
    tags: ["sistema"],
    license: "Apache 2.0",
    style: "Sans serif",
    criteria: { leitura: { value: 3, note: "" } },
    lastUsedAt: "2026-10-19T11:00:00.000Z",
  }),
  asset({
    id: "jet",
    name: "JetBrains Mono",
    folderIds: ["mono"],
    tags: ["código"],
    license: "OFL",
    style: "Monoespaçada",
    verdict: "evitar",
  }),
  asset({ id: "noto", name: "Noto Sans", license: "OFL", style: "Sans serif" }),
  asset({ id: "lucide", name: "Lucide", kind: "icon", license: "ISC" }),
];

const filters = (patch: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...patch });
const names = (list: { name: string }[]) => list.map((item) => item.name);

describe("scopeToView", () => {
  it("scopes by kind for every view", () => {
    assert.deepEqual(names(scopeToView(assets, folders, "font", { type: "all" })).length, 4);
    assert.deepEqual(names(scopeToView(assets, folders, "icon", { type: "all" })), ["Lucide"]);
  });

  it("includes subfolders in a folder view", () => {
    assert.deepEqual(names(scopeToView(assets, folders, "font", { type: "folder", id: "sans" })), [
      "Inter",
      "Roboto",
    ]);
  });

  it("lists items without a verdict as pending", () => {
    assert.deepEqual(names(scopeToView(assets, folders, "font", { type: "pending" })), [
      "Roboto",
      "Noto Sans",
    ]);
  });

  it("lists items without folder, without tag, and recently used", () => {
    assert.deepEqual(names(scopeToView(assets, folders, "font", { type: "uncategorized" })), [
      "Noto Sans",
    ]);
    assert.deepEqual(names(scopeToView(assets, folders, "font", { type: "untagged" })), [
      "Noto Sans",
    ]);
    assert.deepEqual(names(scopeToView(assets, folders, "font", { type: "recent" })), [
      "Inter",
      "Roboto",
    ]);
  });
});

describe("matchesQuery", () => {
  it("ignores accents and case and searches tags and folder names", () => {
    assert.ok(matchesQuery(assets[0], folders, "LEGIVEL"));
    assert.ok(matchesQuery(assets[0], folders, "interface"));
    assert.ok(!matchesQuery(assets[2], folders, "legivel"));
  });
});

describe("applyFilters", () => {
  const fonts = assets.filter((item) => item.kind === "font");

  it("ORs values inside a facet and ANDs across facets", () => {
    assert.deepEqual(names(applyFilters(fonts, filters({ verdict: ["usar", "evitar"] }))), [
      "Inter",
      "JetBrains Mono",
    ]);
    assert.deepEqual(
      names(applyFilters(fonts, filters({ verdict: ["usar", "evitar"], style: ["Monoespaçada"] }))),
      ["JetBrains Mono"],
    );
  });

  it("treats an empty verdict as 'no verdict'", () => {
    assert.deepEqual(names(applyFilters(fonts, filters({ verdict: [""] }))), [
      "Roboto",
      "Noto Sans",
    ]);
  });

  it("filters by derived status", () => {
    assert.deepEqual(names(applyFilters(fonts, filters({ status: ["em-avaliacao"] }))), ["Roboto"]);
  });

  it("drops unscored items under a minimum score", () => {
    assert.deepEqual(names(applyFilters(fonts, filters({ minScore: 3 }))), ["Inter", "Roboto"]);
    assert.deepEqual(names(applyFilters(fonts, filters({ minScore: 4 }))), ["Inter"]);
  });

  it("compares the minimum score with the face the item shows", () => {
    // (4 × 3 + 3 × 2) / 5 = 3,6, shown as Bom (4).
    const nearlyGood = asset({
      id: "dm",
      name: "DM Sans",
      criteria: { leitura: { value: 4, note: "" }, distincao: { value: 3, note: "" } },
    });
    assert.deepEqual(names(applyFilters([nearlyGood], filters({ minScore: 4 }))), ["DM Sans"]);
    assert.deepEqual(names(applyFilters([nearlyGood], filters({ minScore: 5 }))), []);
  });

  it("matches any of an item's tags", () => {
    assert.deepEqual(names(applyFilters(fonts, filters({ tags: ["ui", "código"] }))), [
      "Inter",
      "JetBrains Mono",
    ]);
  });
});

describe("facetCounts", () => {
  const fonts = assets.filter((item) => item.kind === "font");

  it("counts each facet with every other filter applied", () => {
    const counts = facetCounts(fonts, filters({ verdict: ["usar"] }), ["verdict", "license"]);
    // verdict ignores its own selection
    assert.deepEqual(counts.verdict, [
      { value: "usar", count: 1 },
      { value: "evitar", count: 1 },
      { value: "", count: 2 },
    ]);
    // license respects the verdict selection
    assert.deepEqual(counts.license, [
      { value: "Apache 2.0", count: 0 },
      { value: "OFL", count: 1 },
    ]);
  });

  it("keeps a selected value even when nothing has it", () => {
    const counts = facetCounts(fonts, filters({ tags: ["sumiu"] }), ["tags"]);
    assert.ok(counts.tags.some((option) => option.value === "sumiu" && option.count === 0));
  });
});

describe("sortAssets", () => {
  const fonts = assets.filter((item) => item.kind === "font");

  it("sorts by name with Portuguese collation", () => {
    assert.deepEqual(names(sortAssets(fonts, { key: "name", dir: "desc" })), [
      "Roboto",
      "Noto Sans",
      "JetBrains Mono",
      "Inter",
    ]);
  });

  it("keeps unscored items last in either direction", () => {
    assert.deepEqual(names(sortAssets(fonts, { key: "score", dir: "desc" })).slice(0, 2), [
      "Inter",
      "Roboto",
    ]);
    assert.deepEqual(names(sortAssets(fonts, { key: "score", dir: "asc" })).slice(0, 2), [
      "Roboto",
      "Inter",
    ]);
  });

  it("orders verdicts usar, revisar, evitar, none", () => {
    assert.deepEqual(names(sortAssets(fonts, { key: "verdict", dir: "asc" })), [
      "Inter",
      "JetBrains Mono",
      "Noto Sans",
      "Roboto",
    ]);
  });

  it("keeps never-used items last by recent use", () => {
    assert.deepEqual(names(sortAssets(fonts, { key: "recent", dir: "desc" })).slice(0, 2), [
      "Roboto",
      "Inter",
    ]);
  });
});

describe("collectionList", () => {
  const nav = (patch: Partial<KindNav>): KindNav => ({ ...defaultNav().font, ...patch });

  it("reports the filtered list and the view total", () => {
    const result = collectionList(
      { assets, folders },
      "font",
      nav({ filters: filters({ license: ["OFL"] }) }),
    );
    assert.deepEqual(names(result.list), ["Inter", "JetBrains Mono", "Noto Sans"]);
    assert.equal(result.total, 4);
  });

  it("applies the text query", () => {
    const result = collectionList({ assets, folders }, "font", nav({ query: "mono" }));
    assert.deepEqual(names(result.list), ["JetBrains Mono"]);
  });

  it("always orders the recent view by use", () => {
    const result = collectionList(
      { assets, folders },
      "font",
      nav({ view: { type: "recent" }, sort: { key: "name", dir: "asc" } }),
    );
    assert.deepEqual(names(result.list), ["Roboto", "Inter"]);
  });
});

describe("viewCounts and activeFilterCount", () => {
  it("counts the quick views", () => {
    assert.deepEqual(viewCounts(assets, "font"), {
      all: 4,
      recent: 2,
      pending: 2,
      uncategorized: 1,
      untagged: 1,
    });
  });

  it("counts selected values plus the minimum score", () => {
    assert.equal(activeFilterCount(EMPTY_FILTERS), 0);
    assert.equal(activeFilterCount(filters({ verdict: ["usar", ""], minScore: 3 })), 3);
  });
});
