/**
 * The catalogs the Atelier adds items from: Google Fonts families and Iconify icon
 * sets. Pure: the server passes the bundled data in, tests pass fixtures.
 */
import { normalizeText } from "../library/folders.ts";

export type FontCategory = "sans-serif" | "serif" | "display" | "handwriting" | "monospace";
export type FontAxis = { tag: string; min: number; max: number };

/** One Google Fonts family, as scripts/catalog-google-fonts.mjs writes it. */
export type CatalogFont = {
  family: string;
  category: FontCategory;
  weights: number[];
  italic: boolean;
  /** Variable axes besides `ital`; empty for static families. */
  axes: FontAxis[];
  subsets: string[];
  /** "OFL", "Apache 2.0", "UFL", or "" when the source does not say. */
  license: string;
  modified: string;
};

/** The part of Iconify's IconifyInfo the catalog reads. */
export type IconifyInfoLike = {
  name: string;
  total?: number;
  author?: { name: string };
  license?: { title: string; spdx?: string };
  samples?: string[];
  height?: number | number[];
  category?: string;
  palette?: boolean;
  tags?: string[];
  hidden?: boolean;
};

export type CatalogIconSet = {
  prefix: string;
  name: string;
  total: number;
  author: string;
  license: string;
  spdx: string;
  samples: string[];
  /** Design grid in px (16, 20, 24, 32…), or null for mixed sets. */
  grid: number | null;
  category: string;
  /** Icons carry their own colors instead of `currentColor`. */
  palette: boolean;
  /** Drawn with strokes, per Iconify's "Uses Stroke" tag. */
  stroke: boolean;
};

const FONT_STYLE: Record<FontCategory, string> = {
  "sans-serif": "Sans serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Manuscrita",
  monospace: "Monoespaçada",
};

export function fontStyleLabel(category: FontCategory): string {
  return FONT_STYLE[category] ?? "";
}

export function isVariable(font: Pick<CatalogFont, "axes">): boolean {
  return font.axes.some((axis) => axis.tag === "wght");
}

export function iconSetsFrom(raw: Record<string, IconifyInfoLike>): CatalogIconSet[] {
  return Object.entries(raw)
    .filter(([, info]) => !info.hidden)
    .map(([prefix, info]) => ({
      prefix,
      name: info.name,
      total: info.total ?? 0,
      author: info.author?.name ?? "",
      license: info.license?.title ?? "",
      spdx: info.license?.spdx ?? "",
      samples: info.samples ?? [],
      grid: typeof info.height === "number" ? info.height : null,
      category: info.category ?? "",
      palette: info.palette ?? false,
      stroke: info.tags?.includes("Uses Stroke") ?? false,
    }));
}

/** A style name in the library's words, from the set's name, tags and category. */
export function iconSetStyle(set: CatalogIconSet): string {
  const words = normalizeText(`${set.prefix} ${set.name}`);
  if (set.category === "Logos") return "Marcas";
  if (set.category === "Emoji") return "Emoji";
  if (set.category === "Flags / Maps") return "Bandeiras e mapas";
  if (/duotone|twotone|two-tone/.test(words)) return "Duotone";
  if (set.palette) return "Colorido";
  if (/\b(solid|fill|filled|bold|bulk)\b|-(solid|fill|filled|bold)\b/.test(words)) {
    return "Preenchido";
  }
  if (set.stroke || /\b(outline|outlined|line|light|thin|stroke)\b/.test(words)) return "Contorno";
  return "Vários estilos";
}

/** 0 for an exact match, then start, word start, anywhere; -1 for no match. */
function rank(text: string, query: string): number {
  const value = normalizeText(text);
  if (value === query) return 0;
  if (value.startsWith(query)) return 1;
  if (value.split(/[\s-]+/).some((word) => word.startsWith(query))) return 2;
  return value.includes(query) ? 3 : -1;
}

function clampLimit(limit: number | undefined): number {
  const value = limit !== undefined && Number.isFinite(limit) ? limit : 20;
  return Math.min(100, Math.max(1, Math.floor(value)));
}

export type FontQuery = {
  q?: string;
  category?: FontCategory;
  variable?: boolean;
  /** An alphabet such as "cyrillic" or "vietnamese". */
  subset?: string;
  limit?: number;
};

export function searchFonts(fonts: CatalogFont[], query: FontQuery): CatalogFont[] {
  const q = normalizeText(query.q?.trim() ?? "");
  const ranked: { font: CatalogFont; rank: number }[] = [];
  for (const font of fonts) {
    if (query.category && font.category !== query.category) continue;
    if (query.variable !== undefined && isVariable(font) !== query.variable) continue;
    if (query.subset && !font.subsets.includes(query.subset)) continue;
    const score = q ? rank(font.family, q) : 0;
    if (score >= 0) ranked.push({ font, rank: score });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || a.font.family.localeCompare(b.font.family))
    .slice(0, clampLimit(query.limit))
    .map((entry) => entry.font);
}

export type IconSetQuery = {
  q?: string;
  category?: string;
  grid?: number;
  stroke?: boolean;
  palette?: boolean;
  /** Matched against the license title and SPDX id, so "mit" or "apache" work. */
  license?: string;
  limit?: number;
};

export function searchIconSets(sets: CatalogIconSet[], query: IconSetQuery): CatalogIconSet[] {
  const q = normalizeText(query.q?.trim() ?? "");
  const license = normalizeText(query.license?.trim() ?? "");
  const ranked: { set: CatalogIconSet; rank: number }[] = [];
  for (const set of sets) {
    if (query.category && normalizeText(set.category) !== normalizeText(query.category)) continue;
    if (query.grid !== undefined && set.grid !== query.grid) continue;
    if (query.stroke !== undefined && set.stroke !== query.stroke) continue;
    if (query.palette !== undefined && set.palette !== query.palette) continue;
    if (license && !normalizeText(`${set.license} ${set.spdx}`).includes(license)) continue;
    const matches = q ? [rank(set.prefix, q), rank(set.name, q)].filter((r) => r >= 0) : [0];
    if (matches.length) ranked.push({ set, rank: Math.min(...matches) });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || b.set.total - a.set.total)
    .slice(0, clampLimit(query.limit))
    .map((entry) => entry.set);
}

export function findFont(fonts: CatalogFont[], family: string): CatalogFont | undefined {
  const wanted = normalizeText(family.trim());
  return fonts.find((font) => normalizeText(font.family) === wanted);
}

export function findIconSet(sets: CatalogIconSet[], prefix: string): CatalogIconSet | undefined {
  const wanted = prefix.trim().toLowerCase();
  return sets.find((set) => set.prefix === wanted);
}
