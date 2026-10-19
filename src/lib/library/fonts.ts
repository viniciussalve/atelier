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
