import { createFileRoute } from "@tanstack/react-router";
import { searchIconSets } from "@/lib/ai/catalog";
import { iconSets } from "@/lib/ai/catalog.server";
import { iconSetJson, iconSetLine, listMarkdown } from "@/lib/ai/format";
import { iconSetQueryFrom } from "@/lib/ai/params";
import { json, markdown, wantsMarkdown } from "@/lib/ai/respond";

/** Iconify icon sets: ?q=&categoria=&grade=&traco=&colorido=&licenca=&limite=&formato=md */
export const Route = createFileRoute("/api/conjuntos")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const sets = searchIconSets(
          iconSets(),
          iconSetQueryFrom(new URL(request.url).searchParams),
        );
        return wantsMarkdown(request)
          ? markdown(listMarkdown("Conjuntos de ícones do Iconify", sets.map(iconSetLine)))
          : json({ conjuntos: sets.map(iconSetJson) });
      },
    },
  },
});
