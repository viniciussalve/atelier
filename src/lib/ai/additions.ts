/**
 * Adding items from the catalogs: the `adicionar` list an AI (or a person) writes
 * in a link, the assets built from catalog entries, and the merge into the library.
 */
import {
  findFont,
  findIconSet,
  fontStyleLabel,
  iconSetStyle,
  type CatalogFont,
  type CatalogIconSet,
  type FontCategory,
} from "./catalog.ts";
import { primaryFamily } from "../library/fonts.ts";
import { normalizeText } from "../library/folders.ts";
import { makeAsset } from "../library/seed.ts";
import type { Asset, Kind } from "../library/types.ts";

export type AddSpec = { kind: Kind; key: string };

export const MAX_ADDITIONS = 20;

/** The tag on items an AI suggested, so they can be filtered. */
export const AI_TAG = "ia";

const KINDS: Record<string, Kind> = {
  fonte: "font",
  fontes: "font",
  font: "font",
  fonts: "font",
  icones: "icon",
  icone: "icon",
  icons: "icon",
  icon: "icon",
  conjunto: "icon",
};

/** "fonte", "icones", "ícone", "icons", "conjunto"… → the kind; anything else → undefined. */
export function kindFrom(text: unknown): Kind | undefined {
  return typeof text === "string" ? KINDS[normalizeText(text.trim())] : undefined;
}

/** Letters, digits, spaces and the few marks Google Fonts names use ("M PLUS 1p", "Noto Sans JP"). */
const FAMILY = /^[\p{L}\p{N}][\p{L}\p{N} .'&+-]{0,79}$/u;
const PREFIX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "fonte:Inter, icones:lucide" → specs; repeats and anything unreadable drop out. */
export function parseAddList(value: string): AddSpec[] {
  const specs: AddSpec[] = [];
  const seen = new Set<string>();
  for (const part of value.split(/[,;\n]+/)) {
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    const kind = kindFrom(part.slice(0, colon));
    let key = part
      .slice(colon + 1)
      .trim()
      .replace(/\s+/g, " ");
    if (!kind || !key) continue;
    if (kind === "icon") key = key.toLowerCase();
    if (!(kind === "font" ? FAMILY : PREFIX).test(key)) continue;
    const id = specKey({ kind, key });
    if (seen.has(id)) continue;
    seen.add(id);
    specs.push({ kind, key });
    if (specs.length === MAX_ADDITIONS) break;
  }
  return specs;
}

export function formatAddList(specs: AddSpec[]): string {
  return specs.map((spec) => `${spec.kind === "font" ? "fonte" : "icones"}:${spec.key}`).join(",");
}

/**
 * The link that opens the Atelier at `base` (see `appBase`) with the add dialog
 * filled in. `:` and `,` stay readable, so an AI can copy the shape.
 */
export function addLink(base: string, specs: AddSpec[], reason = ""): string {
  const readable = (text: string) =>
    encodeURIComponent(text).replace(/%3A/gi, ":").replace(/%2C/gi, ",");
  const motivo = reason.trim() ? `&motivo=${encodeURIComponent(reason.trim())}` : "";
  return `${base.replace(/\/+$/, "")}/?adicionar=${readable(formatAddList(specs))}${motivo}`;
}

function specKey(spec: AddSpec): string {
  return `${spec.kind}:${spec.kind === "font" ? normalizeText(spec.key) : spec.key}`;
}

/** What makes two items the same: the first font family, or the icon set prefix. */
export function assetKeyOf(asset: Pick<Asset, "kind" | "family" | "iconKey" | "name">): string {
  return asset.kind === "font"
    ? specKey({ kind: "font", key: primaryFamily(asset.family) || asset.name })
    : specKey({ kind: "icon", key: asset.iconKey });
}

/** "100–900" when the weights step by 100, else "300, 400, 700". */
export function formatWeights(weights: number[]): string {
  if (weights.length === 0) return "";
  const stepped = weights.every(
    (weight, index) => index === 0 || weight - weights[index - 1] === 100,
  );
  return stepped && weights.length > 1
    ? `${weights[0]}–${weights[weights.length - 1]}`
    : weights.join(", ");
}

export function slug(text: string): string {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const GENERIC: Record<FontCategory, string> = {
  "sans-serif": "sans-serif",
  serif: "serif",
  display: "sans-serif",
  handwriting: "cursive",
  monospace: "monospace",
};

/** A CSS stack; names with spaces or digits go in quotes. */
function fontStack(family: string, category: FontCategory): string {
  const name = /^[A-Za-z-]+$/.test(family) ? family : `"${family}"`;
  return `${name}, ${GENERIC[category]}`;
}

function specimenUrl(family: string): string {
  return `https://fonts.google.com/specimen/${family.replace(/ /g, "+")}`;
}

const stamps = (now: string) => ({ createdAt: now, modifiedAt: now, importedAt: now });

export function fontAsset(font: CatalogFont, now: string): Asset {
  return makeAsset({
    id: slug(font.family),
    kind: "font",
    name: font.family,
    folderIds: [],
    tags: [],
    family: fontStack(font.family, font.category),
    weights: formatWeights(font.weights),
    style: fontStyleLabel(font.category),
    format: "WOFF2",
    license: font.license,
    url: specimenUrl(font.family),
    ...stamps(now),
  });
}

/** A family Google Fonts serves but the bundled catalog does not know yet. */
export function unverifiedFontAsset(family: string, now: string): Asset {
  return makeAsset({
    id: slug(family),
    kind: "font",
    name: family,
    folderIds: [],
    tags: [],
    family: fontStack(family, "sans-serif"),
    format: "WOFF2",
    url: specimenUrl(family),
    ...stamps(now),
  });
}

export function iconSetAsset(set: CatalogIconSet, now: string): Asset {
  return makeAsset({
    id: set.prefix,
    kind: "icon",
    name: set.name,
    folderIds: [],
    tags: [],
    iconKey: set.prefix,
    format: set.prefix,
    samples: set.samples.slice(0, 8),
    style: iconSetStyle(set),
    sizeLabel: `${set.total.toLocaleString("pt-BR")} ícones`,
    license: set.license,
    url: `https://icon-sets.iconify.design/${set.prefix}/`,
    ...stamps(now),
  });
}

/** Catalog entries for each spec; the rest is left for the caller to check elsewhere. */
export function resolveSpecs(
  specs: AddSpec[],
  catalog: { fonts: CatalogFont[]; sets: CatalogIconSet[] },
  now: string,
): { found: Asset[]; missing: AddSpec[] } {
  const found: Asset[] = [];
  const missing: AddSpec[] = [];
  for (const spec of specs) {
    if (spec.kind === "font") {
      const font = findFont(catalog.fonts, spec.key);
      if (font) found.push(fontAsset(font, now));
      else missing.push(spec);
    } else {
      const set = findIconSet(catalog.sets, spec.key);
      if (set) found.push(iconSetAsset(set, now));
      else missing.push(spec);
    }
  }
  return { found, missing };
}

/**
 * Adds what the library does not have yet. Ids stay unique, dates are the time of
 * adding, and `tags`/`notes` mark where the items came from (an AI suggestion).
 * Returns the same list when nothing is new.
 */
export function mergeNewAssets(
  existing: Asset[],
  incoming: Asset[],
  options: { now: string; tags?: string[]; notes?: string },
): { assets: Asset[]; added: string[] } {
  const keys = new Set(existing.map(assetKeyOf));
  const ids = new Set(existing.map((asset) => asset.id));
  const fresh: Asset[] = [];
  for (const item of incoming) {
    const key = assetKeyOf(item);
    if (keys.has(key)) continue;
    keys.add(key);
    const base = item.id || slug(item.name) || "item";
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    fresh.push({
      ...item,
      id,
      folderIds: [],
      tags: [...new Set([...item.tags, ...(options.tags ?? [])])],
      notes: options.notes?.trim() || item.notes,
      verdict: "",
      criteria: {},
      ...stamps(options.now),
      lastUsedAt: null,
    });
  }
  if (fresh.length === 0) return { assets: existing, added: [] };
  return { assets: [...existing, ...fresh], added: fresh.map((asset) => asset.id) };
}
