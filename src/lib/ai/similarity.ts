/**
 * Similarity "on paper", from catalog metadata: category, variable axes, weights
 * and alphabets for fonts; category, style, grid, palette, license and size for
 * icon sets, plus how many of the person's sample names a set has. It does not
 * look at the shapes: two fonts can share every field and still feel different.
 */
import { normalizeText } from "../library/folders.ts";
import {
  fontStyleLabel,
  iconSetStyle,
  isVariable,
  type CatalogFont,
  type CatalogIconSet,
} from "./catalog.ts";
import type { SnapItem } from "./snapshot.ts";

export type Similarity = { score: number; reasons: string[] };
export type Match<T> = { item: T; score: number; reasons: string[] };

const round = (value: number) => Math.round(value * 1000) / 1000;

function jaccard<T>(a: T[], b: T[]): number {
  const left = new Set(a);
  const right = new Set(b);
  if (left.size === 0 && right.size === 0) return 1;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared++;
  return shared / (left.size + right.size - shared);
}

/** Overlap of two weight spans over their union; a single weight spans 100. */
function spanOverlap(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const [aMin, aMax] = [Math.min(...a), Math.max(...a) + 100];
  const [bMin, bMax] = [Math.min(...b), Math.max(...b) + 100];
  const overlap = Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
  return overlap / (Math.max(aMax, bMax) - Math.min(aMin, bMin));
}

export function fontSimilarity(a: CatalogFont, b: CatalogFont): Similarity {
  let score = 0;
  const reasons: string[] = [];
  if (a.category === b.category) {
    score += 0.35;
    reasons.push(`mesma categoria (${fontStyleLabel(a.category)})`);
  }
  if (isVariable(a) === isVariable(b)) {
    score += 0.1;
    if (isVariable(a)) reasons.push("variável");
  }
  const extra = (font: CatalogFont) =>
    font.axes.filter((axis) => axis.tag !== "wght").map((axis) => axis.tag);
  const axes = jaccard(extra(a), extra(b));
  score += 0.1 * axes;
  const shared = extra(a).filter((tag) => extra(b).includes(tag));
  if (shared.length) reasons.push(`eixos em comum: ${shared.join(", ")}`);
  const weights = spanOverlap(a.weights, b.weights);
  score += 0.2 * weights;
  if (weights >= 0.99) reasons.push("mesma faixa de pesos");
  else if (weights >= 0.6) reasons.push("faixa de pesos parecida");
  if (a.italic === b.italic) {
    score += 0.05;
    if (a.italic) reasons.push("com itálico");
  }
  const subsets = jaccard(a.subsets, b.subsets);
  score += 0.2 * subsets;
  if (subsets >= 0.99) reasons.push("mesmos alfabetos");
  else if (subsets >= 0.6) reasons.push("alfabetos parecidos");
  return { score: round(score), reasons };
}

export function iconSetSimilarity(a: CatalogIconSet, b: CatalogIconSet): Similarity {
  let score = 0;
  const reasons: string[] = [];
  if (a.category && a.category === b.category) {
    score += 0.2;
    reasons.push(`mesma categoria (${a.category})`);
  }
  const style = iconSetStyle(a);
  if (style === iconSetStyle(b)) {
    score += 0.25;
    reasons.push(`mesmo estilo (${style.toLowerCase()})`);
  }
  if (a.grid !== null && a.grid === b.grid) {
    score += 0.2;
    reasons.push(`grade ${a.grid}`);
  } else if (a.grid !== null && b.grid !== null && Math.abs(a.grid - b.grid) <= 4) {
    score += 0.1;
    reasons.push(`grade parecida (${b.grid})`);
  }
  if (a.palette === b.palette) score += 0.1;
  const license = (set: CatalogIconSet) => normalizeText(set.spdx || set.license);
  if (license(a) && license(a) === license(b)) {
    score += 0.1;
    reasons.push(`mesma licença (${b.license})`);
  }
  if (a.total && b.total) {
    const ratio = Math.abs(Math.log10(a.total / b.total));
    score += 0.15 * Math.max(0, 1 - ratio);
    if (ratio <= Math.log10(2)) {
      reasons.push(`tamanho parecido (${b.total.toLocaleString("pt-BR")} ícones)`);
    }
  }
  return { score: round(score), reasons };
}

function rank<T>(
  target: T,
  catalog: T[],
  similarity: (a: T, b: T) => Similarity,
  nameOf: (item: T) => string,
  options: { exclude?: string[]; limit?: number },
): Match<T>[] {
  const skip = new Set([nameOf(target), ...(options.exclude ?? [])].map(normalizeText));
  return catalog
    .filter((item) => !skip.has(normalizeText(nameOf(item))))
    .map((item) => ({ item, ...similarity(target, item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 10);
}

export function similarFonts(
  target: CatalogFont,
  catalog: CatalogFont[],
  options: { exclude?: string[]; limit?: number } = {},
): Match<CatalogFont>[] {
  return rank(target, catalog, fontSimilarity, (font) => font.family, options);
}

export function similarIconSets(
  target: CatalogIconSet,
  catalog: CatalogIconSet[],
  options: { exclude?: string[]; limit?: number } = {},
): Match<CatalogIconSet>[] {
  return rank(target, catalog, iconSetSimilarity, (set) => set.prefix, options);
}

/** Keys (family or prefix) of what the person likes and avoids, from their verdicts and faces. */
export function tasteOf(items: SnapItem[]): { liked: string[]; disliked: string[] } {
  const liked: string[] = [];
  const disliked: string[] = [];
  for (const item of items) {
    if (!item.k) continue;
    if (item.v === "usar" || (item.v !== "evitar" && (item.g ?? 0) >= 4)) liked.push(item.k);
    else if (item.v === "evitar" || (item.g !== undefined && item.g <= 2)) disliked.push(item.k);
  }
  return { liked, disliked };
}

/**
 * Catalog items close to what the person likes and far from what they avoid:
 * mean similarity to the liked ones minus half the mean to the avoided ones.
 * Each match says which liked item it is closest to, and why.
 */
export function recommend<T>(
  liked: T[],
  disliked: T[],
  catalog: T[],
  similarity: (a: T, b: T) => Similarity,
  nameOf: (item: T) => string,
  options: { exclude?: string[]; limit?: number; similarWord?: string },
): Match<T>[] {
  if (liked.length === 0) return [];
  const skip = new Set(
    [...liked, ...disliked]
      .map(nameOf)
      .concat(options.exclude ?? [])
      .map(normalizeText),
  );
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const matches: Match<T>[] = [];
  for (const item of catalog) {
    if (skip.has(normalizeText(nameOf(item)))) continue;
    const near = liked.map((other) => ({ other, ...similarity(other, item) }));
    const far = disliked.map((other) => similarity(other, item).score);
    const score = mean(near.map((entry) => entry.score)) - (far.length ? 0.5 * mean(far) : 0);
    const best = near.reduce((top, entry) => (entry.score > top.score ? entry : top));
    const why = best.reasons.slice(0, 3).join(", ");
    matches.push({
      item,
      score: round(score),
      reasons: [
        `${options.similarWord ?? "parecida com"} ${nameOf(best.other)}${why ? `: ${why}` : ""}`,
      ],
    });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, options.limit ?? 10);
}

export type Coverage = { found: string[]; missing: string[] };

/** Which names a set has, from Iconify's `/{prefix}.json?icons=…` answer. */
export function coverageFrom(
  answer: {
    icons?: Record<string, unknown>;
    aliases?: Record<string, unknown>;
    not_found?: string[];
  },
  names: string[],
): Coverage {
  const has = (name: string) => Boolean(answer.icons?.[name] || answer.aliases?.[name]);
  return { found: names.filter(has), missing: names.filter((name) => !has(name)) };
}

/** Re-ranks icon sets with sample coverage: 60% metadata, 40% share of names found. */
export function withCoverage(
  matches: Match<CatalogIconSet>[],
  coverage: Record<string, Coverage>,
): Match<CatalogIconSet>[] {
  return matches
    .map((match) => {
      const known = coverage[match.item.prefix];
      if (!known) {
        return {
          ...match,
          score: round(0.6 * match.score),
          reasons: [...match.reasons, "amostras não conferidas"],
        };
      }
      const total = known.found.length + known.missing.length;
      const share = total ? known.found.length / total : 0;
      return {
        ...match,
        score: round(0.6 * match.score + 0.4 * share),
        reasons: [...match.reasons, `tem ${known.found.length} de ${total} das suas amostras`],
      };
    })
    .sort((a, b) => b.score - a.score);
}
