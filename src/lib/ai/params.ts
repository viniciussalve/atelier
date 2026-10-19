/**
 * Reading the query strings of the AI-facing endpoints (/api/fontes, /api/conjuntos,
 * /api/icones), which accept the Portuguese names an AI is likely to write.
 */
import { normalizeText } from "../library/folders.ts";
import type { FontCategory, FontQuery, IconSetQuery } from "./catalog.ts";

const CATEGORIES: Record<string, FontCategory> = {
  sans: "sans-serif",
  "sans serif": "sans-serif",
  "sans-serif": "sans-serif",
  serif: "serif",
  serifada: "serif",
  "com serifa": "serif",
  display: "display",
  titulo: "display",
  manuscrita: "handwriting",
  cursiva: "handwriting",
  handwriting: "handwriting",
  mono: "monospace",
  monoespacada: "monospace",
  monospace: "monospace",
};

/** "sim"/"true"/"1" → true, "nao"/"false"/"0" → false, anything else → not set. */
export function flag(value: string | null): boolean | undefined {
  const text = normalizeText(value?.trim() ?? "");
  if (["sim", "s", "true", "1"].includes(text)) return true;
  if (["nao", "n", "false", "0"].includes(text)) return false;
  return undefined;
}

/** A whole number, or not set: "x" never becomes NaN. */
export function int(value: string | null): number | undefined {
  const number = Number.parseInt(value ?? "", 10);
  return Number.isFinite(number) ? number : undefined;
}

/**
 * A list given as "lucide,tabler" or repeated (`params.getAll("conjuntos")`):
 * trimmed, lowercased, without blanks or repeats, at most `max` entries.
 */
export function listParam(value: unknown, max = 16): string[] {
  const parts = (Array.isArray(value) ? value : [value])
    .filter((part): part is string => typeof part === "string")
    .flatMap((part) => part.split(","))
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(parts)].slice(0, max);
}

function text(value: string | null): string | undefined {
  return value?.trim() || undefined;
}

/** "Monoespaçada", "mono" or "monospace" → "monospace"; unknown → undefined. */
export function fontCategoryFrom(value: string | null | undefined): FontCategory | undefined {
  return CATEGORIES[normalizeText(value?.trim() ?? "")];
}

export function fontQueryFrom(params: URLSearchParams): FontQuery {
  return {
    q: text(params.get("q")),
    category: fontCategoryFrom(params.get("categoria")),
    variable: flag(params.get("variavel")),
    subset: text(params.get("alfabeto"))?.toLowerCase(),
    limit: int(params.get("limite")),
  };
}

export function iconSetQueryFrom(params: URLSearchParams): IconSetQuery {
  return {
    q: text(params.get("q")),
    category: text(params.get("categoria")),
    grid: int(params.get("grade")),
    stroke: flag(params.get("traco")),
    palette: flag(params.get("colorido")),
    license: text(params.get("licenca")),
    limit: int(params.get("limite")),
  };
}
