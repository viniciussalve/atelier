/**
 * Server half of the catalogs: the bundled data and the two live checks that need
 * the network (Google Fonts for a family the bundle does not know, Iconify search).
 */
// The package's index imports its JSON without an import attribute, which Node rejects.
import collections from "@iconify/collections/collections.json" with { type: "json" };
import fontData from "./data/google-fonts.json" with { type: "json" };
import { resolveSpecs, unverifiedFontAsset, type AddSpec } from "./additions.ts";
import {
  iconSetsFrom,
  type CatalogFont,
  type CatalogIconSet,
  type IconifyInfoLike,
} from "./catalog.ts";
import { googleFontHref } from "../library/fonts.ts";
import type { Asset } from "../library/types.ts";

export const FONTS = fontData as CatalogFont[];

let sets: CatalogIconSet[] | null = null;
export function iconSets(): CatalogIconSet[] {
  sets ??= iconSetsFrom(collections as Record<string, IconifyInfoLike>);
  return sets;
}

type Fetch = typeof fetch;

/**
 * Google Fonts answers 400 for a family it does not serve. Asks for the same
 * stylesheet the app will load for the family.
 */
export async function googleServes(family: string, fetchImpl: Fetch = fetch): Promise<boolean> {
  try {
    const response = await fetchImpl(googleFontHref(family, []), {
      signal: AbortSignal.timeout(4000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Assets for each spec: the catalog's first, then the fonts the bundle lacks that
 * Google Fonts serves, each group in list order.
 */
export async function resolveAdditions(
  specs: AddSpec[],
  now: string,
  fetchImpl: Fetch = fetch,
): Promise<{ assets: Asset[]; missing: AddSpec[] }> {
  const { found, missing } = resolveSpecs(specs, { fonts: FONTS, sets: iconSets() }, now);
  // All at once: each check may wait its whole timeout, and a list holds up to 20 items.
  const served = await Promise.all(
    missing.map((spec) => (spec.kind === "font" ? googleServes(spec.key, fetchImpl) : false)),
  );
  const still: AddSpec[] = [];
  missing.forEach((spec, index) => {
    if (served[index]) found.push(unverifiedFontAsset(spec.key, now));
    else still.push(spec);
  });
  return { assets: found, missing: still };
}

/** Iconify's search answers at least 32 names, whatever the limit asked. */
const ICONIFY_MIN_LIMIT = 32;

/** 1 to 999 names, 64 when the limit is missing or not a number. */
function iconLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return 64;
  return Math.min(999, Math.max(1, Math.floor(limit)));
}

/** Icon names ("lucide:house") from Iconify's search, optionally within some sets. */
export async function searchIcons(
  query: string,
  options: { prefixes?: string[]; limit?: number } = {},
  fetchImpl: Fetch = fetch,
): Promise<{ icons: string[]; ok: boolean }> {
  const limit = iconLimit(options.limit);
  const url = new URL("https://api.iconify.design/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(Math.max(ICONIFY_MIN_LIMIT, limit)));
  if (options.prefixes?.length) url.searchParams.set("prefixes", options.prefixes.join(","));
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { icons: [], ok: false };
    const body = (await response.json()) as { icons?: unknown };
    const icons = Array.isArray(body.icons)
      ? body.icons.filter((icon) => typeof icon === "string")
      : [];
    return { icons: icons.slice(0, limit), ok: true };
  } catch {
    return { icons: [], ok: false };
  }
}
