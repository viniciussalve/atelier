import { criteriaFor, isScore } from "./criteria.ts";
import { defaultNav } from "./filters.ts";
import { defaultLibrary, seedAssets, seedFolders } from "./seed.ts";
import type { Asset, CriterionScore, Folder, Kind, LibraryData, Scorecard, View } from "./types.ts";

type Persisted = Record<string, unknown>;

function isObject(value: unknown): value is Persisted {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isCriterionScore(value: unknown): value is CriterionScore {
  return (
    isObject(value) &&
    (value.value === null || isScore(value.value)) &&
    typeof value.note === "string"
  );
}

/**
 * v4 scorecards: numeric criteria become `{ value, note }`. A v3 star rating
 * with no criterion scored is spread over every criterion of the kind, so the
 * computed overall score equals the old rating. Unknown keys are dropped.
 */
function upgradeAsset(raw: Persisted): Asset {
  const kind: Kind = raw.kind === "icon" ? "icon" : "font";
  const old = isObject(raw.criteria) ? raw.criteria : {};
  const criteria: Scorecard = {};
  for (const def of criteriaFor(kind)) {
    const value = old[def.id];
    if (isScore(value)) criteria[def.id] = { value, note: "" };
    else if (isCriterionScore(value) && (value.value !== null || value.note))
      criteria[def.id] = value;
  }
  const rating = typeof raw.rating === "number" ? Math.round(raw.rating) : 0;
  const anyScored = Object.values(criteria).some((entry) => entry?.value != null);
  if (isScore(rating) && !anyScored) {
    for (const def of criteriaFor(kind)) {
      criteria[def.id] = { value: rating, note: criteria[def.id]?.note ?? "" };
    }
  }
  const rest = { ...raw };
  delete rest.rating;
  return {
    ...(rest as unknown as Asset),
    kind,
    folderIds: Array.isArray(raw.folderIds) ? (raw.folderIds as string[]) : [],
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    samples: Array.isArray(raw.samples) ? (raw.samples as string[]) : [],
    verdict:
      raw.verdict === "usar" || raw.verdict === "revisar" || raw.verdict === "evitar"
        ? raw.verdict
        : "",
    criteria,
  };
}

function isFolder(value: unknown): value is Folder {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.kind === "font" || value.kind === "icon")
  );
}

function validView(view: unknown, folders: Folder[], kind: Kind): view is View {
  if (!isObject(view)) return false;
  if (view.type === "folder") {
    return folders.some((folder) => folder.id === view.id && folder.kind === kind);
  }
  return ["all", "recent", "pending", "uncategorized", "untagged"].includes(view.type as string);
}

/** zustand `persist` migration for the library store, from any earlier version to v4. */
export function migrateLibrary(persisted: unknown, version: number): LibraryData {
  if (!isObject(persisted)) return defaultLibrary();
  const folders: Folder[] = Array.isArray(persisted.folders)
    ? persisted.folders.filter(isFolder)
    : seedFolders;
  let assets: Persisted[] = Array.isArray(persisted.assets)
    ? persisted.assets.filter(isObject)
    : (seedAssets as unknown as Persisted[]);
  let allFolders = folders;
  if (version < 2) {
    // v2 replaced the icon library with Iconify sets.
    allFolders = [
      ...folders.filter((folder) => folder.kind === "font"),
      ...seedFolders.filter((folder) => folder.kind === "icon"),
    ];
    assets = [
      ...assets.filter((item) => item.kind === "font"),
      ...(seedAssets.filter((item) => item.kind === "icon") as unknown as Persisted[]),
    ];
  }
  const upgraded = assets.map(upgradeAsset).map((item) => ({
    ...item,
    folderIds: item.folderIds.filter((id) =>
      allFolders.some((folder) => folder.id === id && folder.kind === item.kind),
    ),
  }));
  const kind: Kind = persisted.kind === "icon" ? "icon" : "font";
  const nav = defaultNav();
  if (validView(persisted.view, allFolders, kind))
    nav[kind] = { ...nav[kind], view: persisted.view };
  return { kind, nav, expanded: [], folders: allFolders, assets: upgraded };
}
