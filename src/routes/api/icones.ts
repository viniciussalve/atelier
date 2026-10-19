import { createFileRoute } from "@tanstack/react-router";
import { searchIcons } from "@/lib/ai/catalog.server";
import { iconsMarkdown } from "@/lib/ai/format";
import { int, listParam } from "@/lib/ai/params";
import { json, markdown, wantsMarkdown } from "@/lib/ai/respond";

/** Icons by name across sets, from Iconify's search: ?q=&conjuntos=lucide,tabler&limite= */
export const Route = createFileRoute("/api/icones")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const q = params.get("q")?.trim() ?? "";
        if (!q) return json({ erro: "Passe o nome do ícone em ?q=." }, 400);
        const { icons, ok } = await searchIcons(q, {
          prefixes: listParam(params.getAll("conjuntos")),
          limit: int(params.get("limite")),
        });
        if (!ok) return json({ erro: "O Iconify não respondeu. Tente de novo." }, 502);
        // A live search: kept briefly by the client only, never by a shared cache.
        return wantsMarkdown(request)
          ? markdown(iconsMarkdown(q, icons), 200, "private")
          : json({ icones: icons }, 200, "private");
      },
    },
  },
});
