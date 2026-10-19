import type { CatalogFont, IconifyInfoLike } from "./catalog.ts";

export function font(partial: Partial<CatalogFont> & Pick<CatalogFont, "family">): CatalogFont {
  return {
    category: "sans-serif",
    weights: [400, 700],
    italic: false,
    axes: [],
    subsets: ["latin", "latin-ext"],
    license: "OFL",
    modified: "2025-09-10",
    ...partial,
  };
}

export const FONTS: CatalogFont[] = [
  font({
    family: "Inter",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    italic: true,
    axes: [
      { tag: "opsz", min: 14, max: 32 },
      { tag: "wght", min: 100, max: 900 },
    ],
  }),
  font({
    family: "Inter Tight",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    axes: [{ tag: "wght", min: 100, max: 900 }],
  }),
  font({ family: "Ubuntu", weights: [300, 400, 500, 700], license: "UFL" }),
  font({ family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] }),
  font({ family: "Space Mono", category: "monospace" }),
  font({ family: "Caveat", category: "handwriting", subsets: ["cyrillic", "latin"] }),
];

/** Shaped like Iconify's collections.json. */
export const ICON_INFO: Record<string, IconifyInfoLike> = {
  lucide: {
    name: "Lucide",
    total: 1891,
    author: { name: "Lucide Contributors" },
    license: { title: "ISC", spdx: "ISC" },
    samples: ["circle-check", "award", "house"],
    height: 24,
    category: "UI 24px",
    tags: ["Precise Shapes", "Has Padding", "Uses Stroke"],
    palette: false,
  },
  "fa6-solid": {
    name: "Font Awesome Solid",
    total: 1388,
    author: { name: "Dave Gandy" },
    license: { title: "CC BY 4.0", spdx: "CC-BY-4.0" },
    samples: ["location-pin", "gem", "folder"],
    height: 32,
    category: "General",
    palette: false,
  },
  logos: {
    name: "SVG Logos",
    total: 1800,
    author: { name: "Gil Barbara" },
    license: { title: "CC0", spdx: "CC0-1.0" },
    samples: ["github-icon"],
    category: "Logos",
    palette: true,
  },
  mingcute: {
    name: "MingCute Icon",
    total: 3098,
    author: { name: "MingCute Design" },
    license: { title: "Apache 2.0", spdx: "Apache-2.0" },
    samples: ["home-1-line", "settings-1-line", "search-line"],
    height: 24,
    category: "UI 24px",
    tags: ["Precise Shapes", "Has Padding"],
    palette: false,
  },
  old: { name: "Old Set", total: 10, hidden: true },
};
