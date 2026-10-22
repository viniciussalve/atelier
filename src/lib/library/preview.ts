import type { CollectionPreview, Kind } from "./types.ts";

/** What the collection draws in each font when the preview field is blank. */
export const PREVIEW_SAMPLE = "Respostas claras, decisões rápidas, em 10 ou 100 conversas por dia.";

/** Size of the specimen on every card and row: font body in px, icon side in px. */
export const PREVIEW_RANGE: Record<Kind, { min: number; max: number; step: number }> = {
  font: { min: 12, max: 96, step: 1 },
  icon: { min: 16, max: 64, step: 4 },
};

export const DEFAULT_PREVIEW: Record<Kind, CollectionPreview> = {
  font: { text: "", size: 40 },
  icon: { text: "", size: 32 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** A saved preview with every field checked; the size is kept inside the kind range. */
export function sanitizePreview(kind: Kind, raw: unknown): CollectionPreview {
  const fallback = DEFAULT_PREVIEW[kind];
  if (!isRecord(raw)) return { ...fallback };
  const range = PREVIEW_RANGE[kind];
  const size =
    typeof raw.size === "number" && Number.isFinite(raw.size)
      ? Math.min(range.max, Math.max(range.min, Math.round(raw.size)))
      : fallback.size;
  return { text: typeof raw.text === "string" ? raw.text : fallback.text, size };
}

export function previewText(preview: CollectionPreview): string {
  return preview.text.trim() ? preview.text : PREVIEW_SAMPLE;
}
