import { createFileRoute } from "@tanstack/react-router";
import { FONTS, coverageOf, iconSets } from "@/lib/ai/catalog.server";
import { int, listParam } from "@/lib/ai/params";
import { json, markdown, wantsMarkdown } from "@/lib/ai/respond";
import { decodeSnapshot } from "@/lib/ai/snapshot";
import {
  recommendFor,
  similarTo,
  suggestionJson,
  suggestionMarkdown,
  type Suggestion,
} from "@/lib/ai/suggest";

const USAGE =
  "Passe ?fonte=<família>, ?conjunto=<prefixo> (com &amostras=home,search, se quiser) ou ?b=<retrato do link da pessoa>&tipo=fontes|icones.";

/** Similar fonts or icon sets, by catalog metadata (and sample coverage for icons). */
export const Route = createFileRoute("/api/parecidas")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const deps = { fonts: FONTS, sets: iconSets(), coverage: coverageOf };
        const limite = int(params.get("limite"));
        let result: Suggestion;
        const encoded = params.get("b");
        const amostras = listParam(params.getAll("amostras"));
        if (params.get("fonte") || params.get("conjunto")) {
          result = await similarTo(
            {
              fonte: params.get("fonte") ?? undefined,
              conjunto: params.get("conjunto") ?? undefined,
              amostras,
              limite,
            },
            deps,
          );
        } else if (encoded) {
          const snapshot = await decodeSnapshot(encoded);
          if (!snapshot) return json({ erro: "O retrato chegou cortado ou alterado." }, 400);
          const tipo = params.get("tipo") === "icones" ? "icones" : "fontes";
          result = await recommendFor(snapshot, tipo, limite, deps);
        } else {
          return json({ erro: USAGE }, 400);
        }
        if (!result.ok) return json({ erro: result.error }, result.status);
        // Recommendations from someone's library, or with a live coverage check, are
        // kept by the client only; plain catalog similarity may be shared.
        const caching = encoded || amostras.length ? "private" : "public";
        return wantsMarkdown(request)
          ? markdown(suggestionMarkdown(result), 200, caching)
          : json(suggestionJson(result), 200, caching);
      },
    },
  },
});
