/**
 * Similar and recommended items, shared by /api/parecidas and the MCP tools.
 * Catalogs and the coverage lookup (network) come in as dependencies.
 */
import { findFont, findIconSet, type CatalogFont, type CatalogIconSet } from "./catalog.ts";
import { fontJson, iconSetJson, matchLine } from "./format.ts";
import {
  fontSimilarity,
  iconSetSimilarity,
  recommend,
  similarFonts,
  similarIconSets,
  tasteOf,
  withCoverage,
  type Coverage,
  type Match,
} from "./similarity.ts";
import type { Snapshot } from "./snapshot.ts";

export type SuggestDeps = {
  fonts: CatalogFont[];
  sets: CatalogIconSet[];
  /** Which of `names` each set has; may answer for only some sets. */
  coverage: (prefixes: string[], names: string[]) => Promise<Record<string, Coverage>>;
};

export type Suggestion =
  | { ok: true; title: string; fonts: Match<CatalogFont>[]; sets: Match<CatalogIconSet>[] }
  | { ok: false; status: number; error: string };

const fail = (status: number, error: string): Suggestion => ({ ok: false, status, error });
const clamp = (limit: number | undefined) =>
  Math.min(30, Math.max(1, Math.floor(limit !== undefined && Number.isFinite(limit) ? limit : 10)));

export async function similarTo(
  query: { fonte?: string; conjunto?: string; amostras?: string[]; limite?: number },
  deps: SuggestDeps,
): Promise<Suggestion> {
  const limit = clamp(query.limite);
  if (query.fonte) {
    const target = findFont(deps.fonts, query.fonte);
    if (!target) return fail(404, `Não achei “${query.fonte}” no Google Fonts.`);
    const fonts = similarFonts(target, deps.fonts, { limit });
    return { ok: true, title: `Parecidas com ${target.family}`, fonts, sets: [] };
  }
  if (query.conjunto) {
    const target = findIconSet(deps.sets, query.conjunto);
    if (!target) return fail(404, `Não achei o conjunto “${query.conjunto}” no Iconify.`);
    let sets = similarIconSets(target, deps.sets, { limit });
    const names = (query.amostras ?? []).slice(0, 16);
    if (names.length) {
      sets = withCoverage(
        sets,
        await deps.coverage(
          sets.map((m) => m.item.prefix),
          names,
        ),
      );
    }
    return { ok: true, title: `Parecidos com ${target.name}`, fonts: [], sets };
  }
  return fail(400, "Diga a fonte (família do Google Fonts) ou o conjunto (prefixo do Iconify).");
}

const NOTHING_LIKED =
  "Ainda não há nada marcado Usar ou com carinha Bom ou melhor. Avalie alguns itens para ter recomendações.";

/** Why there is nothing to recommend: no liked items, or liked items the catalogs lack. */
function nothingToCompare(liked: string[], where: string): Suggestion {
  if (liked.length === 0) return fail(422, NOTHING_LIKED);
  return fail(
    422,
    `O que a pessoa marcou Usar ou com carinha Bom ou melhor (${liked.join(", ")}) não está no catálogo do ${where}, então não dá para comparar por semelhança. Busque por nome ou categoria.`,
  );
}

/** Catalog items for this library's taste, leaving out what it already has. */
export async function recommendFor(
  snapshot: Snapshot,
  kind: "fontes" | "icones",
  limite: number | undefined,
  deps: SuggestDeps,
): Promise<Suggestion> {
  const limit = clamp(limite);
  if (kind === "icones") {
    const taste = tasteOf(snapshot.icones);
    const pick = (keys: string[]) =>
      keys.map((key) => findIconSet(deps.sets, key)).filter((set) => set !== undefined);
    let sets = recommend(
      pick(taste.liked),
      pick(taste.disliked),
      deps.sets,
      iconSetSimilarity,
      (set) => set.prefix,
      {
        exclude: snapshot.icones.map((item) => item.k ?? item.n),
        limit,
        similarWord: "parecido com",
      },
    );
    if (sets.length === 0) return nothingToCompare(taste.liked, "Iconify");
    const liked = new Set(taste.liked);
    const names = [
      ...new Set(
        snapshot.icones
          .filter((item) => item.k && liked.has(item.k))
          .flatMap((item) => item.s ?? []),
      ),
    ].slice(0, 12);
    if (names.length) {
      sets = withCoverage(
        sets,
        await deps.coverage(
          sets.map((m) => m.item.prefix),
          names,
        ),
      );
    }
    return { ok: true, title: "Conjuntos recomendados para esta biblioteca", fonts: [], sets };
  }
  const taste = tasteOf(snapshot.fontes);
  const pick = (keys: string[]) =>
    keys.map((key) => findFont(deps.fonts, key)).filter((font) => font !== undefined);
  const fonts = recommend(
    pick(taste.liked),
    pick(taste.disliked),
    deps.fonts,
    fontSimilarity,
    (font) => font.family,
    { exclude: snapshot.fontes.map((item) => item.k ?? item.n), limit },
  );
  if (fonts.length === 0) return nothingToCompare(taste.liked, "Google Fonts");
  return { ok: true, title: "Fontes recomendadas para esta biblioteca", fonts, sets: [] };
}

export function suggestionMarkdown(s: Extract<Suggestion, { ok: true }>): string {
  const lines = [
    ...s.fonts.map((m) =>
      matchLine(`**${m.item.family}**`, m.score, m.reasons, fontJson(m.item).adicionar),
    ),
    ...s.sets.map((m) =>
      matchLine(
        `**${m.item.name}** (\`${m.item.prefix}\`)`,
        m.score,
        m.reasons,
        iconSetJson(m.item).adicionar,
      ),
    ),
  ];
  return `# ${s.title}\n\n${lines.join("\n") || "Nada encontrado."}\n`;
}

export function suggestionJson(s: Extract<Suggestion, { ok: true }>) {
  return {
    titulo: s.title,
    ...(s.fonts.length
      ? {
          parecidas: s.fonts.map((m) => ({
            ...fontJson(m.item),
            semelhanca: m.score,
            motivos: m.reasons,
          })),
        }
      : {}),
    ...(s.sets.length
      ? {
          parecidos: s.sets.map((m) => ({
            ...iconSetJson(m.item),
            semelhanca: m.score,
            motivos: m.reasons,
          })),
        }
      : {}),
  };
}
