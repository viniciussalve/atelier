// Test-only builders. Not imported by app code.
import type { Asset, Folder, Kind } from "./types.ts";

const STAMP = "2026-10-19T12:00:00.000Z";

export function asset(partial: Partial<Asset> & { id: string; kind?: Kind }): Asset {
  return {
    kind: "font",
    name: partial.id,
    folderIds: [],
    tags: [],
    notes: "",
    url: "",
    verdict: "",
    criteria: {},
    family: "",
    style: "",
    weights: "",
    format: "",
    sizeLabel: "",
    license: "",
    iconKey: "",
    samples: [],
    createdAt: STAMP,
    modifiedAt: STAMP,
    importedAt: STAMP,
    lastUsedAt: null,
    ...partial,
  };
}

export function folder(
  id: string,
  name: string,
  parentId: string | null = null,
  kind: Kind = "font",
): Folder {
  return { id, name, kind, parentId };
}
