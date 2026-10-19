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
import type { Asset } from "../library/types.ts";

export const FONTS = fontData as CatalogFont[];

let sets: CatalogIconSet[] | null = null;
export function iconSets(): CatalogIconSet[] {
  sets ??= iconSetsFrom(collections as Record<string, IconifyInfoLike>);
  return sets;
}

type Fetch = typeof fetch;

/** Google Fonts answers 400 for a family it does not serve. */
export async function googleServes(family: string, fetchImpl: Fetch = fetch): Promise<boolean> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}`;
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(4000) });
    return response.ok;
  } catch {
    return false;
  }
}

/** Assets for each spec, in order; fonts the bundle lacks are checked with Google Fonts. */
export async function resolveAdditions(
  specs: AddSpec[],
  now: string,
  fetchImpl: Fetch = fetch,
): Promise<{ assets: Asset[]; missing: AddSpec[] }> {
  const { found, missing } = resolveSpecs(specs, { fonts: FONTS, sets: iconSets() }, now);
  const still: AddSpec[] = [];
  for (const spec of missing) {
    if (spec.kind === "font" && (await googleServes(spec.key, fetchImpl))) {
      found.push(unverifiedFontAsset(spec.key, now));
    } else {
      still.push(spec);
    }
  }
  return { assets: found, missing: still };
}

/** Icon names ("lucide:house") from Iconify's search, optionally within some sets. */
export async function searchIcons(
  query: string,
  options: { prefixes?: string[]; limit?: number } = {},
  fetchImpl: Fetch = fetch,
): Promise<{ icons: string[]; ok: boolean }> {
  const url = new URL("https://api.iconify.design/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(Math.min(999, Math.max(32, options.limit ?? 64))));
  if (options.prefixes?.length) url.searchParams.set("prefixes", options.prefixes.join(","));
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { icons: [], ok: false };
    const body = (await response.json()) as { icons?: unknown };
    const icons = Array.isArray(body.icons)
      ? body.icons.filter((icon) => typeof icon === "string")
      : [];
    return { icons, ok: true };
  } catch {
    return { icons: [], ok: false };
  }
}
