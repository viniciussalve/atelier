import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { overallScore } from "./criteria.ts";
import { migrateLibrary } from "./migrate.ts";
import { DEFAULT_PREVIEW } from "./preview.ts";
import { defaultLibrary, seedAssets, seedFolders } from "./seed.ts";

const v3Asset = (patch: Record<string, unknown>) => ({
  id: "x",
  kind: "font",
  name: "X",
  folderIds: [],
  tags: [],
  notes: "",
  url: "",
  rating: 0,
  verdict: "",
  criteria: {},
  family: "X",
  style: "",
  weights: "",
  format: "",
  sizeLabel: "",
  license: "",
  iconKey: "",
  samples: [],
  createdAt: "2026-10-19T12:00:00.000Z",
  modifiedAt: "2026-10-19T12:00:00.000Z",
  importedAt: "2026-10-19T12:00:00.000Z",
  lastUsedAt: null,
  ...patch,
});

const v3 = (assets: unknown[], extra: Record<string, unknown> = {}) => ({
  kind: "font",
  view: { type: "all" },
  selectedId: "x",
  query: "abc",
  sampleText: "texto",
  previewMode: "preview",
  ground: "ink",
  zoom: 18,
  folders: [
    { id: "f-sans", name: "Sans serif", kind: "font", parentId: null },
    { id: "i-ui", name: "Interface", kind: "icon", parentId: null },
  ],
  assets,
  ...extra,
});

describe("migrateLibrary from v3", () => {
  it("turns numeric criteria into scores and drops zeros and unknown keys", () => {
    const data = migrateLibrary(
      v3([v3Asset({ criteria: { leitura: 4, tom: 0, inventado: 5 } })]),
      3,
    );
    assert.deepEqual(data.assets[0].criteria, { leitura: { value: 4, note: "" } });
  });

  it("spreads an old star rating over every criterion so the overall score stays the same", () => {
    const data = migrateLibrary(v3([v3Asset({ rating: 4 })]), 3);
    const item = data.assets[0];
    assert.equal(Object.keys(item.criteria).length, 4);
    assert.equal(overallScore(item), 4);
    assert.ok(!("rating" in item));
  });

  it("ignores the rating when some criterion is already scored", () => {
    const data = migrateLibrary(v3([v3Asset({ rating: 5, criteria: { leitura: 2 } })]), 3);
    assert.equal(overallScore(data.assets[0]), 2);
  });

  it("drops folder links to missing folders or to the other library", () => {
    const data = migrateLibrary(v3([v3Asset({ folderIds: ["f-sans", "i-ui", "gone"] })]), 3);
    assert.deepEqual(data.assets[0].folderIds, ["f-sans"]);
  });

  it("keeps a still-valid view and resets one pointing at a deleted folder", () => {
    const kept = migrateLibrary(v3([], { view: { type: "folder", id: "f-sans" } }), 3);
    assert.deepEqual(kept.nav.font.view, { type: "folder", id: "f-sans" });
    const reset = migrateLibrary(v3([], { view: { type: "folder", id: "gone" } }), 3);
    assert.deepEqual(reset.nav.font.view, { type: "all" });
  });

  it("drops the old view and preview state", () => {
    const data = migrateLibrary(v3([]), 3) as unknown as Record<string, unknown>;
    for (const key of ["selectedId", "query", "sampleText", "previewMode", "ground", "zoom"]) {
      assert.ok(!(key in data), key);
    }
    assert.deepEqual(data.expanded, []);
  });

  it("falls back to the seeds for something unreadable", () => {
    assert.deepEqual(migrateLibrary("lixo", 3), defaultLibrary());
  });
});

describe("migrateLibrary from v1", () => {
  it("keeps fonts and swaps icons for the seed sets", () => {
    const data = migrateLibrary(v3([v3Asset({}), v3Asset({ id: "old-icon", kind: "icon" })]), 1);
    assert.ok(data.assets.some((item) => item.id === "x"));
    assert.ok(!data.assets.some((item) => item.id === "old-icon"));
    assert.ok(data.assets.some((item) => item.id === "lucide"));
  });
});

describe("migrateLibrary from v4", () => {
  const v4 = () => {
    const data = defaultLibrary();
    const { preview: _preview, ...font } = data.nav.font;
    const { preview: _iconPreview, ...icon } = data.nav.icon;
    return {
      ...data,
      kind: "icon",
      expanded: ["f-sans"],
      nav: {
        font: { ...font, display: "list", sort: { key: "score", dir: "desc" } },
        icon: { ...icon, view: { type: "folder", id: "gone" } },
      },
    };
  };

  it("keeps the saved navigation and adds the default preview", () => {
    const data = migrateLibrary(v4(), 4);
    assert.equal(data.kind, "icon");
    assert.deepEqual(data.expanded, ["f-sans"]);
    assert.equal(data.nav.font.display, "list");
    assert.deepEqual(data.nav.font.sort, { key: "score", dir: "desc" });
    assert.deepEqual(data.nav.font.preview, DEFAULT_PREVIEW.font);
    assert.deepEqual(data.nav.icon.preview, DEFAULT_PREVIEW.icon);
  });

  it("resets a view pointing at a deleted folder", () => {
    assert.deepEqual(migrateLibrary(v4(), 4).nav.icon.view, { type: "all" });
  });

  it("falls back to defaults for a broken nav field", () => {
    const broken = { ...v4(), nav: { font: { display: "mosaico", sort: "x" }, icon: null } };
    const data = migrateLibrary(broken, 4);
    assert.deepEqual(data.nav, defaultLibrary().nav);
  });
});

describe("seeds", () => {
  it("are already in the current shape", () => {
    const data = migrateLibrary({ ...defaultLibrary() }, 3);
    assert.deepEqual(data.assets, seedAssets);
    assert.deepEqual(data.folders, seedFolders);
  });

  it("show every evaluation state", () => {
    const verdicts = new Set(seedAssets.map((item) => item.verdict));
    assert.deepEqual([...verdicts].sort(), ["", "evitar", "revisar", "usar"]);
    assert.ok(seedAssets.some((item) => !item.verdict && Object.keys(item.criteria).length > 0));
    assert.ok(seedAssets.some((item) => Object.keys(item.criteria).length === 0));
  });
});
