import { evaluationStatus, overallScore } from "./criteria.ts";
import { folderScope, normalizeText } from "./folders.ts";
import type {
  Asset,
  EvaluationStatus,
  Filters,
  Folder,
  Kind,
  KindNav,
  ListFacet,
  SortKey,
  SortSpec,
  Verdict,
  View,
} from "./types.ts";

export const EMPTY_FILTERS: Filters = {
  verdict: [],
  status: [],
  minScore: null,
  tags: [],
  license: [],
  style: [],
  format: [],
};

/** Formato is the Iconify prefix for icon sets, so it is only a facet for fonts. */
export const FACETS_BY_KIND: Record<Kind, ListFacet[]> = {
  font: ["verdict", "status", "tags", "license", "style", "format"],
  icon: ["verdict", "status", "tags", "license", "style"],
};

export function defaultNav(): Record<Kind, KindNav> {
  const nav = (): KindNav => ({
    view: { type: "all" },
    query: "",
    filters: EMPTY_FILTERS,
    sort: { key: "name", dir: "asc" },
    display: "grid",
  });
  return { font: nav(), icon: nav() };
}

export function defaultSortDir(key: SortKey): SortSpec["dir"] {
  return key === "name" || key === "verdict" ? "asc" : "desc";
}

export function scopeToView(assets: Asset[], folders: Folder[], kind: Kind, view: View): Asset[] {
  const scoped = assets.filter((item) => item.kind === kind);
  switch (view.type) {
    case "all":
      return scoped;
    case "recent":
      return scoped.filter((item) => item.lastUsedAt);
    case "pending":
      return scoped.filter((item) => !item.verdict);
    case "uncategorized":
      return scoped.filter((item) => item.folderIds.length === 0);
    case "untagged":
      return scoped.filter((item) => item.tags.length === 0);
    case "folder": {
      const ids = new Set(folderScope(folders, view.id));
      return scoped.filter((item) => item.folderIds.some((id) => ids.has(id)));
    }
  }
}

export function matchesQuery(asset: Asset, folders: Folder[], query: string): boolean {
  const needle = normalizeText(query.trim());
  if (!needle) return true;
  const folderNames = folders
    .filter((folder) => asset.folderIds.includes(folder.id))
    .map((folder) => folder.name);
  const haystack = [
    asset.name,
    asset.notes,
    asset.style,
    asset.license,
    asset.iconKey,
    ...asset.tags,
    ...asset.samples,
    ...folderNames,
  ].join(" ");
  return normalizeText(haystack).includes(needle);
}

function facetValues(asset: Asset, facet: ListFacet): string[] {
  switch (facet) {
    case "verdict":
      return [asset.verdict];
    case "status":
      return [evaluationStatus(asset)];
    case "tags":
      return asset.tags;
    case "license":
      return asset.license ? [asset.license] : [];
    case "style":
      return asset.style ? [asset.style] : [];
    case "format":
      return asset.format ? [asset.format] : [];
  }
}

const LIST_FACETS: ListFacet[] = ["verdict", "status", "tags", "license", "style", "format"];

/** OR inside a facet, AND across facets. `except` leaves one facet out, for disjunctive counts. */
export function applyFilters(list: Asset[], filters: Filters, except?: ListFacet): Asset[] {
  return list.filter((item) => {
    for (const facet of LIST_FACETS) {
      if (facet === except) continue;
      const wanted: readonly string[] = filters[facet];
      if (wanted.length && !facetValues(item, facet).some((value) => wanted.includes(value))) {
        return false;
      }
    }
    if (filters.minScore !== null) {
      const score = overallScore(item);
      if (score === null || score < filters.minScore) return false;
    }
    return true;
  });
}

export type FacetOption = { value: string; count: number };

const VERDICT_ORDER: Verdict[] = ["usar", "revisar", "evitar", ""];
const STATUS_ORDER: EvaluationStatus[] = ["nao-avaliado", "em-avaliacao", "decidido"];

/**
 * Options for each facet: the values present in `list` plus any selected ones.
 * Each count applies every other facet's filter but not its own, so picking a
 * value never zeroes its siblings.
 */
export function facetCounts(
  list: Asset[],
  filters: Filters,
  facets: ListFacet[],
): Record<ListFacet, FacetOption[]> {
  const result: Record<ListFacet, FacetOption[]> = {
    verdict: [],
    status: [],
    tags: [],
    license: [],
    style: [],
    format: [],
  };
  for (const facet of facets) {
    const present = new Set<string>(filters[facet]);
    for (const item of list) facetValues(item, facet).forEach((value) => present.add(value));
    const counted = applyFilters(list, filters, facet);
    const count = (value: string) =>
      counted.filter((item) => facetValues(item, facet).includes(value)).length;
    let values: string[];
    if (facet === "verdict") values = VERDICT_ORDER.filter((value) => present.has(value));
    else if (facet === "status") values = STATUS_ORDER.filter((value) => present.has(value));
    else values = [...present].sort((a, b) => a.localeCompare(b, "pt-BR"));
    result[facet] = values.map((value) => ({ value, count: count(value) }));
  }
  return result;
}

export function activeFilterCount(filters: Filters): number {
  return (
    LIST_FACETS.reduce((sum, facet) => sum + filters[facet].length, 0) +
    (filters.minScore === null ? 0 : 1)
  );
}

const byName = (a: Asset, b: Asset) => a.name.localeCompare(b.name, "pt-BR");

/** Missing values (no score, never used, no verdict) sort last in either direction. */
function compareWithBlanksLast<T>(
  a: T | null,
  b: T | null,
  compare: (x: T, y: T) => number,
  dir: number,
) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir * compare(a, b);
}

export function sortAssets(list: Asset[], sort: SortSpec): Asset[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const number = (x: number, y: number) => x - y;
  const text = (x: string, y: string) => x.localeCompare(y);
  const compare = (a: Asset, b: Asset): number => {
    switch (sort.key) {
      case "name":
        return dir * byName(a, b);
      case "score":
        return compareWithBlanksLast(overallScore(a), overallScore(b), number, dir);
      case "modified":
        return dir * text(a.modifiedAt, b.modifiedAt);
      case "recent":
        return compareWithBlanksLast(a.lastUsedAt, b.lastUsedAt, text, dir);
      case "verdict": {
        const rank = (item: Asset) => (item.verdict ? VERDICT_ORDER.indexOf(item.verdict) : null);
        return compareWithBlanksLast(rank(a), rank(b), number, dir);
      }
    }
  };
  return [...list].sort((a, b) => compare(a, b) || byName(a, b));
}

/** The collection a view shows: `list` after search and filters, `total` before them. */
export function collectionList(
  data: { assets: Asset[]; folders: Folder[] },
  kind: Kind,
  nav: KindNav,
): { list: Asset[]; total: number } {
  const scoped = scopeToView(data.assets, data.folders, kind, nav.view);
  const searched = scoped.filter((item) => matchesQuery(item, data.folders, nav.query));
  const filtered = applyFilters(searched, nav.filters);
  const sort: SortSpec = nav.view.type === "recent" ? { key: "recent", dir: "desc" } : nav.sort;
  return { list: sortAssets(filtered, sort), total: scoped.length };
}

export function viewCounts(assets: Asset[], kind: Kind) {
  const scoped = assets.filter((item) => item.kind === kind);
  return {
    all: scoped.length,
    recent: scoped.filter((item) => item.lastUsedAt).length,
    pending: scoped.filter((item) => !item.verdict).length,
    uncategorized: scoped.filter((item) => item.folderIds.length === 0).length,
    untagged: scoped.filter((item) => item.tags.length === 0).length,
  };
}
