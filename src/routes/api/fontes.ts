import { createFileRoute } from "@tanstack/react-router";
import { searchFonts } from "@/lib/ai/catalog";
import { FONTS } from "@/lib/ai/catalog.server";
import { fontJson, fontLine, listMarkdown } from "@/lib/ai/format";
import { fontQueryFrom } from "@/lib/ai/params";
import { json, markdown, wantsMarkdown } from "@/lib/ai/respond";

/** Google Fonts families: ?q=&categoria=&variavel=&alfabeto=&limite=&formato=md */
export const Route = createFileRoute("/api/fontes")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const fonts = searchFonts(FONTS, fontQueryFrom(new URL(request.url).searchParams));
        return wantsMarkdown(request)
          ? markdown(listMarkdown("Fontes do Google Fonts", fonts.map(fontLine)))
          : json({ fontes: fonts.map(fontJson) });
      },
    },
  },
});
