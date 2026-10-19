import { createFileRoute } from "@tanstack/react-router";
import { formatAddList, parseAddList } from "@/lib/ai/additions";
import { resolveAdditions } from "@/lib/ai/catalog.server";
import { json } from "@/lib/ai/respond";

/**
 * The items of an `adicionar` list, ready to add: ?itens=fonte:Inter,icones:lucide.
 * The app calls it to fill the add dialog; the library itself lives in the browser.
 */
export const Route = createFileRoute("/api/adicionar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const specs = parseAddList(new URL(request.url).searchParams.get("itens") ?? "");
        const { assets, missing } = await resolveAdditions(specs, new Date().toISOString());
        // "Not found" may be Google Fonts timing out: trying again must ask again.
        return json(
          {
            itens: assets,
            naoEncontrados: missing.map((spec) => formatAddList([spec])),
          },
          200,
          "none",
        );
      },
    },
  },
});
