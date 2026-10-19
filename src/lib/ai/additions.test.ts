import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addLink,
  assetKeyOf,
  fontAsset,
  formatAddList,
  formatWeights,
  iconSetAsset,
  mergeNewAssets,
  parseAddList,
  resolveSpecs,
  slug,
  unverifiedFontAsset,
} from "./additions.ts";
import { iconSetsFrom } from "./catalog.ts";
import { FONTS, ICON_INFO } from "./test-fixtures.ts";
import { makeAsset } from "../library/seed.ts";

const NOW = "2026-10-19T12:00:00.000Z";
const SETS = iconSetsFrom(ICON_INFO);

describe("parseAddList", () => {
  it("reads fonts and icon sets in Portuguese or English", () => {
    assert.deepEqual(parseAddList("fonte:Inter, fonte: DM  Sans ;icones:lucide\nicons:Tabler"), [
      { kind: "font", key: "Inter" },
      { kind: "font", key: "DM Sans" },
      { kind: "icon", key: "lucide" },
      { kind: "icon", key: "tabler" },
    ]);
    assert.deepEqual(parseAddList("ícones:ph,font:Caveat"), [
      { kind: "icon", key: "ph" },
      { kind: "font", key: "Caveat" },
    ]);
  });

  it("drops repeats, unknown kinds and invalid names", () => {
    assert.deepEqual(
      parseAddList("fonte:Inter,fonte:inter,cor:azul,Inter,icones:Not Valid!,fonte:<b>,icones:"),
      [{ kind: "font", key: "Inter" }],
    );
  });

  it("caps the list at 20", () => {
    const many = Array.from({ length: 30 }, (_, index) => `icones:set-${index}`).join(",");
    assert.equal(parseAddList(many).length, 20);
  });
});

describe("formatAddList and addLink", () => {
  const specs = [
    { kind: "font", key: "DM Sans" },
    { kind: "icon", key: "lucide" },
  ] as const;

  it("writes the list back in the link format", () => {
    assert.equal(formatAddList([...specs]), "fonte:DM Sans,icones:lucide");
  });

  it("builds a link the app reads back", () => {
    const link = addLink("https://atelier.app", [...specs], "Parecidas com Inter");
    assert.equal(
      link,
      "https://atelier.app/?adicionar=fonte:DM%20Sans,icones:lucide&motivo=Parecidas%20com%20Inter",
    );
    const url = new URL(link);
    assert.equal(url.pathname, "/");
    assert.deepEqual(parseAddList(url.searchParams.get("adicionar") ?? ""), specs);
    assert.equal(url.searchParams.get("motivo"), "Parecidas com Inter");
    assert.equal(addLink("https://atelier.app/", [...specs]).includes("motivo"), false);
    const prefixed = new URL(addLink("https://preview.grok.mil/hds-a1-8080-b2", [...specs]));
    assert.equal(prefixed.pathname, "/hds-a1-8080-b2/");
  });
});

describe("formatWeights", () => {
  it("writes a range when the weights step by 100", () => {
    assert.equal(formatWeights([100, 200, 300, 400, 500, 600, 700, 800, 900]), "100–900");
    assert.equal(formatWeights([400]), "400");
  });

  it("lists the weights otherwise", () => {
    assert.equal(formatWeights([300, 400, 500, 700]), "300, 400, 500, 700");
    assert.equal(formatWeights([]), "");
  });
});

describe("slug", () => {
  it("makes ids from names", () => {
    assert.equal(slug("Inter Tight"), "inter-tight");
    assert.equal(slug("Noto Serif Display — Itálico"), "noto-serif-display-italico");
  });
});

describe("asset builders", () => {
  it("builds a font from the catalog with its weights, style and specimen link", () => {
    const asset = fontAsset(FONTS[1], NOW);
    assert.equal(asset.id, "inter-tight");
    assert.equal(asset.kind, "font");
    assert.equal(asset.name, "Inter Tight");
    assert.equal(asset.family, '"Inter Tight", sans-serif');
    assert.equal(asset.weights, "100–900");
    assert.equal(asset.style, "Sans serif");
    assert.equal(asset.format, "WOFF2");
    assert.equal(asset.license, "OFL");
    assert.equal(asset.url, "https://fonts.google.com/specimen/Inter+Tight");
    assert.equal(asset.createdAt, NOW);
  });

  it("uses a generic family that matches the category", () => {
    assert.equal(fontAsset(FONTS[4], NOW).family, '"Space Mono", monospace');
    assert.equal(fontAsset(FONTS[3], NOW).family, '"Playfair Display", serif');
    assert.equal(fontAsset(FONTS[5], NOW).family, "Caveat, cursive");
  });

  it("builds an icon set with its count, license and samples", () => {
    const asset = iconSetAsset(
      SETS.find((set) => set.prefix === "lucide")!,
      NOW,
    );
    assert.equal(asset.id, "lucide");
    assert.equal(asset.kind, "icon");
    assert.equal(asset.iconKey, "lucide");
    assert.equal(asset.format, "lucide");
    assert.equal(asset.sizeLabel, "1.891 ícones");
    assert.equal(asset.license, "ISC");
    assert.equal(asset.style, "Contorno");
    assert.deepEqual(asset.samples, ["circle-check", "award", "house"]);
    assert.equal(asset.url, "https://icon-sets.iconify.design/lucide/");
  });

  it("builds a bare font when only Google Fonts vouches for the name", () => {
    const asset = unverifiedFontAsset("Brand New Sans", NOW);
    assert.equal(asset.family, '"Brand New Sans", sans-serif');
    assert.equal(asset.weights, "");
    assert.equal(asset.style, "");
  });
});

describe("resolveSpecs", () => {
  it("finds catalog entries and reports the rest as missing", () => {
    const { found, missing } = resolveSpecs(
      [
        { kind: "font", key: "inter tight" },
        { kind: "icon", key: "lucide" },
        { kind: "font", key: "Brand New Sans" },
        { kind: "icon", key: "nope" },
      ],
      { fonts: FONTS, sets: SETS },
      NOW,
    );
    assert.deepEqual(
      found.map((asset) => asset.name),
      ["Inter Tight", "Lucide"],
    );
    assert.deepEqual(missing, [
      { kind: "font", key: "Brand New Sans" },
      { kind: "icon", key: "nope" },
    ]);
  });
});

describe("assetKeyOf", () => {
  it("names a font by its first family and a set by its prefix", () => {
    const inter = makeAsset({
      id: "x",
      kind: "font",
      name: "Inter",
      folderIds: [],
      tags: [],
      family: "Inter, sans-serif",
    });
    assert.equal(assetKeyOf(inter), assetKeyOf(fontAsset(FONTS[0], NOW)));
    assert.equal(assetKeyOf(iconSetAsset(SETS[0], NOW)), `icon:${SETS[0].prefix}`);
  });
});

describe("mergeNewAssets", () => {
  const existing = [
    makeAsset({
      id: "inter",
      kind: "font",
      name: "Inter",
      folderIds: [],
      tags: [],
      family: "Inter, sans-serif",
    }),
    makeAsset({ id: "inter-tight", kind: "icon", name: "Clash", folderIds: [], tags: [] }),
  ];

  it("skips what the library has, keeps ids unique and marks AI suggestions", () => {
    const incoming = [fontAsset(FONTS[0], NOW), fontAsset(FONTS[1], NOW)];
    const later = "2026-10-20T09:00:00.000Z";
    const { assets, added } = mergeNewAssets(existing, incoming, {
      now: later,
      tags: ["ia"],
      notes: "Parecida com Inter",
    });
    assert.deepEqual(added, ["inter-tight-2"]);
    const tight = assets.find((asset) => asset.id === "inter-tight-2");
    assert.deepEqual(tight?.tags, ["ia"]);
    assert.equal(tight?.notes, "Parecida com Inter");
    assert.equal(tight?.importedAt, later);
    assert.equal(tight?.lastUsedAt, null);
    assert.equal(assets.length, 3);
  });

  it("keeps the same list when nothing is new", () => {
    const result = mergeNewAssets(existing, [fontAsset(FONTS[0], NOW)], { now: NOW });
    assert.equal(result.assets, existing);
    assert.deepEqual(result.added, []);
  });
});
