import { createFileRoute } from "@tanstack/react-router";
import { findFont, findIconSet, type CatalogFont, type CatalogIconSet } from "@/lib/ai/catalog";
import { FONTS, coverageOf, iconSets } from "@/lib/ai/catalog.server";
import { fontJson, iconSetJson, matchLine } from "@/lib/ai/format";
import { int } from "@/lib/ai/params";
import { json, markdown, wantsMarkdown } from "@/lib/ai/respond";
import {
  fontSimilarity,
  iconSetSimilarity,
  recommend,
  similarFonts,
  similarIconSets,
  tasteOf,
  withCoverage,
  type Match,
} from "@/lib/ai/similarity";
import { decodeSnapshot } from "@/lib/ai/snapshot";

const USAGE =
  "Passe ?fonte=<família>, ?conjunto=<prefixo> (com &amostras=home,search, se quiser) ou ?b=<retrato do link da pessoa>&tipo=fontes|icones.";

function fontsAnswer(request: Request, title: string, matches: Match<CatalogFont>[]) {
  return wantsMarkdown(request)
    ? markdown(
        `# ${title}\n\n${matches
          .map((m) =>
            matchLine(`**${m.item.family}**`, m.score, m.reasons, fontJson(m.item).adicionar),
          )
          .join("\n")}\n`,
      )
    : json({
        titulo: title,
        parecidas: matches.map((m) => ({
          ...fontJson(m.item),
          semelhanca: m.score,
          motivos: m.reasons,
        })),
      });
}

function setsAnswer(request: Request, title: string, matches: Match<CatalogIconSet>[]) {
  return wantsMarkdown(request)
    ? markdown(
        `# ${title}\n\n${matches
          .map((m) =>
            matchLine(
              `**${m.item.name}** (\`${m.item.prefix}\`)`,
              m.score,
              m.reasons,
              iconSetJson(m.item).adicionar,
            ),
          )
          .join("\n")}\n`,
      )
    : json({
        titulo: title,
        parecidos: matches.map((m) => ({
          ...iconSetJson(m.item),
          semelhanca: m.score,
          motivos: m.reasons,
        })),
      });
}

const namesFrom = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 16);

/** Similar fonts or icon sets, by catalog metadata (and sample coverage for icons). */
export const Route = createFileRoute("/api/parecidas")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const limit = Math.min(30, Math.max(1, int(params.get("limite")) ?? 10));

        const family = params.get("fonte");
        if (family) {
          const target = findFont(FONTS, family);
          if (!target) return json({ erro: `Não achei “${family}” no Google Fonts.` }, 404);
          return fontsAnswer(
            request,
            `Parecidas com ${target.family}`,
            similarFonts(target, FONTS, { limit }),
          );
        }

        const prefix = params.get("conjunto");
        if (prefix) {
          const sets = iconSets();
          const target = findIconSet(sets, prefix);
          if (!target) return json({ erro: `Não achei o conjunto “${prefix}” no Iconify.` }, 404);
          let matches = similarIconSets(target, sets, { limit });
          const names = namesFrom(params.get("amostras"));
          if (names.length) {
            matches = withCoverage(
              matches,
              await coverageOf(
                matches.map((m) => m.item.prefix),
                names,
              ),
            );
          }
          return setsAnswer(request, `Parecidos com ${target.name}`, matches);
        }

        const encoded = params.get("b");
        if (encoded) {
          const snapshot = await decodeSnapshot(encoded);
          if (!snapshot) return json({ erro: "O retrato chegou cortado ou alterado." }, 400);
          const empty =
            "Ainda não há nada marcado Usar ou com carinha Bom ou melhor. Avalie alguns itens para ter recomendações.";
          if (params.get("tipo") === "icones") {
            const sets = iconSets();
            const taste = tasteOf(snapshot.icones);
            const pick = (keys: string[]) =>
              keys.map((key) => findIconSet(sets, key)).filter((set) => set !== undefined);
            let matches = recommend(
              pick(taste.liked),
              pick(taste.disliked),
              sets,
              iconSetSimilarity,
              (set) => set.prefix,
              {
                exclude: snapshot.icones.map((item) => item.k ?? item.n),
                limit,
                similarWord: "parecido com",
              },
            );
            if (matches.length === 0) return json({ erro: empty }, 422);
            const liked = new Set(taste.liked);
            const names = [
              ...new Set(
                snapshot.icones
                  .filter((item) => item.k && liked.has(item.k))
                  .flatMap((item) => item.s ?? []),
              ),
            ].slice(0, 12);
            if (names.length) {
              matches = withCoverage(
                matches,
                await coverageOf(
                  matches.map((m) => m.item.prefix),
                  names,
                ),
              );
            }
            return setsAnswer(request, "Conjuntos recomendados para esta biblioteca", matches);
          }
          const taste = tasteOf(snapshot.fontes);
          const pick = (keys: string[]) =>
            keys.map((key) => findFont(FONTS, key)).filter((font) => font !== undefined);
          const matches = recommend(
            pick(taste.liked),
            pick(taste.disliked),
            FONTS,
            fontSimilarity,
            (font) => font.family,
            {
              exclude: snapshot.fontes.map((item) => item.k ?? item.n),
              limit,
            },
          );
          if (matches.length === 0) return json({ erro: empty }, 422);
          return fontsAnswer(request, "Fontes recomendadas para esta biblioteca", matches);
        }

        return json({ erro: USAGE }, 400);
      },
    },
  },
});
