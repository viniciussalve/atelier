import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  explorerTree,
  filterExplorer,
  folderPath,
  folderScope,
  normalizeText,
  type ExplorerNode,
} from "./folders.ts";
import { asset, folder } from "./test-fixtures.ts";

const folders = [
  folder("sans", "Sans serif"),
  folder("ui", "Interface", "sans"),
  folder("mono", "Monoespaçadas"),
  folder("display", "Títulos"),
  folder("icons", "Interface", null, "icon"),
];

const assets = [
  asset({ id: "inter", name: "Inter", folderIds: ["sans", "ui"] }),
  asset({ id: "roboto", name: "Roboto", folderIds: ["sans"] }),
  asset({ id: "jet", name: "JetBrains Mono", folderIds: ["mono", "display"] }),
  asset({ id: "noto", name: "Noto Sans" }),
  asset({ id: "lucide", name: "Lucide", kind: "icon", folderIds: ["icons"] }),
];

/** Flatten to "path/name" strings for easy comparison. */
function paths(nodes: ExplorerNode[], prefix = ""): string[] {
  return nodes.flatMap((node) =>
    node.type === "asset"
      ? [`${prefix}${node.asset.name}`]
      : [`${prefix}${node.folder.name}/`, ...paths(node.children, `${prefix}${node.folder.name}/`)],
  );
}

describe("folderScope and folderPath", () => {
  it("includes descendants", () => {
    assert.deepEqual(folderScope(folders, "sans"), ["sans", "ui"]);
  });

  it("names the path from the root", () => {
    assert.deepEqual(folderPath(folders, "ui"), ["Sans serif", "Interface"]);
  });
});

describe("explorerTree", () => {
  const tree = explorerTree(folders, assets, "font");

  it("shows an item only under the deepest folder of a branch", () => {
    const shown = paths(tree);
    assert.equal(shown.filter((p) => p.endsWith("Inter")).length, 1);
    assert.ok(shown.includes("Sans serif/Interface/Inter"));
    assert.ok(shown.includes("Sans serif/Roboto"));
  });

  it("keeps an item in two unrelated folders in both", () => {
    const shown = paths(tree);
    assert.ok(shown.includes("Monoespaçadas/JetBrains Mono"));
    assert.ok(shown.includes("Títulos/JetBrains Mono"));
  });

  it("puts loose items at the root after the folders", () => {
    assert.equal(tree.at(-1)?.type, "asset");
    assert.deepEqual(
      tree.map((node) => (node.type === "folder" ? node.folder.name : node.asset.name)),
      ["Monoespaçadas", "Sans serif", "Títulos", "Noto Sans"],
    );
  });

  it("counts distinct items in the folder scope", () => {
    const sans = tree.find((node) => node.type === "folder" && node.folder.id === "sans");
    assert.ok(sans && sans.type === "folder");
    assert.equal(sans.count, 2);
  });

  it("only shows the requested kind", () => {
    assert.ok(!paths(tree).some((p) => p.includes("Lucide")));
    assert.deepEqual(paths(explorerTree(folders, assets, "icon")), [
      "Interface/",
      "Interface/Lucide",
    ]);
  });
});

describe("filterExplorer", () => {
  const tree = explorerTree(folders, assets, "font");

  it("returns everything for an empty query", () => {
    assert.deepEqual(filterExplorer(tree, "  "), tree);
  });

  it("keeps matching leaves with their folders, ignoring accents and case", () => {
    assert.deepEqual(paths(filterExplorer(tree, "INTER")), [
      "Sans serif/",
      "Sans serif/Interface/",
      "Sans serif/Interface/Inter",
    ]);
  });

  it("keeps a whole folder when its name matches", () => {
    assert.deepEqual(paths(filterExplorer(tree, "titulos")), [
      "Títulos/",
      "Títulos/JetBrains Mono",
    ]);
  });
});

describe("normalizeText", () => {
  it("drops accents and case", () => {
    assert.equal(normalizeText("Ilustração ÂÊ"), "ilustracao ae");
  });
});
