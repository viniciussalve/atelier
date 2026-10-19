import { createFileRoute } from "@tanstack/react-router";
import { searchIcons } from "@/lib/ai/catalog.server";
import { int } from "@/lib/ai/params";
import { json, markdown, wantsMarkdown } from "@/lib/ai/respond";

/** Icons by name across sets, from Iconify's search: ?q=&conjuntos=lucide,tabler&limite= */
export const Route = createFileRoute("/api/icones")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const q = params.get("q")?.trim() ?? "";
        if (!q) return json({ erro: "Passe o nome do ícone em ?q=." }, 400);
        const prefixes = (params.get("conjuntos") ?? "")
          .split(",")
          .map((prefix) => prefix.trim().toLowerCase())
          .filter(Boolean);
        const { icons, ok } = await searchIcons(q, { prefixes, limit: int(params.get("limite")) });
        if (!ok) return json({ erro: "O Iconify não respondeu. Tente de novo." }, 502);
        return wantsMarkdown(request)
          ? markdown(
              `# Ícones para “${q}”\n\n${icons.map((icon) => `- \`${icon}\``).join("\n") || "Nada encontrado."}\n`,
            )
          : json({ icones: icons });
      },
    },
  },
});
