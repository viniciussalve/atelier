import type { Asset } from "./types.ts";

const WEIGHT_NAMES: Record<number, string> = {
  100: "Fino",
  200: "Extraleve",
  300: "Leve",
  400: "Regular",
  500: "Médio",
  600: "Seminegrito",
  700: "Negrito",
  800: "Extranegrito",
  900: "Black",
};

/** "400–600" → [400, 500, 600]; "400, 700" → [400, 700]; anything unreadable → [400]. */
export function parseWeights(value: string): number[] {
  const range = /^\s*(\d{3})\s*[-–—]\s*(\d{3})\s*$/.exec(value);
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
    const weights: number[] = [];
    for (let weight = from; weight <= to; weight += 100) weights.push(weight);
    return weights;
  }
  const list = value
    .split(/[,;\s]+/)
    .map(Number)
    .filter((weight) => Number.isInteger(weight) && weight >= 100 && weight <= 900);
  return list.length ? [...new Set(list)].sort((a, b) => a - b) : [400];
}

export function weightName(weight: number): string {
  return WEIGHT_NAMES[weight] ?? String(weight);
}

/** The weight a font gives each part of an interface: running text, labels and buttons, titles. */
export type WeightRoles = { texto: number; rotulo: number; titulo: number };

/** The declared weight closest to `target`; a tie goes to the lighter one unless `heavier`. */
function closest(weights: number[], target: number, heavier = false): number {
  return weights.reduce((best, weight) => {
    const gap = Math.abs(weight - target) - Math.abs(best - target);
    return gap < 0 || (gap === 0 && heavier === weight > best) ? weight : best;
  });
}

/**
 * Text near 400, labels near 500 and titles near 600, each never lighter than
 * the role below it. A font with one weight uses it everywhere.
 */
export function weightRoles(weights: number[]): WeightRoles {
  const sorted = weights.length ? [...weights].sort((a, b) => a - b) : [400];
  const texto = closest(sorted, 400);
  const rotulo = closest(
    sorted.filter((weight) => weight >= texto),
    500,
  );
  const titulo = closest(
    sorted.filter((weight) => weight >= rotulo),
    600,
    true,
  );
  return { texto, rotulo, titulo };
}

/** The first family of a CSS font stack, without quotes. */
export function primaryFamily(stack: string): string {
  return (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
}

/** Weights the app chrome itself uses. */
const UI_FONTS: Record<string, number[]> = {
  "IBM Plex Sans": [400, 500, 600],
  "IBM Plex Mono": [400, 500],
};

/**
 * One Google Fonts stylesheet with every weight each font asset declares. Weights
 * are listed one by one: a `400..500` range request only returns 400 for some families.
 */
export function googleFontsHref(assets: Asset[]): string {
  const families = new Map<string, Set<number>>();
  const add = (family: string, weights: number[]) => {
    if (!family) return;
    const set = families.get(family) ?? new Set<number>();
    weights.forEach((weight) => set.add(weight));
    families.set(family, set);
  };
  for (const [family, weights] of Object.entries(UI_FONTS)) add(family, weights);
  for (const item of assets) {
    if (item.kind === "font") add(primaryFamily(item.family), parseWeights(item.weights));
  }
  const params = [...families.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, weights]) => {
      const list = [...weights].sort((a, b) => a - b).join(";");
      return `family=${family.replace(/ /g, "+")}:wght@${list}`;
    });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

/**
 * One family's stylesheet. Items added from the catalogs each get their own, so a
 * family or weight Google does not serve (a 400 for the whole request) breaks only
 * that family. No weights asks for the family's default cut.
 */
export function googleFontHref(family: string, weights: number[]): string {
  const name = encodeURIComponent(family).replace(/%20/g, "+");
  const axis = weights.length ? `:wght@${[...weights].sort((a, b) => a - b).join(";")}` : "";
  return `https://fonts.googleapis.com/css2?family=${name}${axis}&display=swap`;
}

export function fontAssetHref(asset: Pick<Asset, "family" | "weights">): string {
  const weights = asset.weights.trim() ? parseWeights(asset.weights) : [];
  return googleFontHref(primaryFamily(asset.family), weights);
}
