import { createFileRoute } from "@tanstack/react-router";
import { guide } from "@/lib/ai/brief";
import { VARY_BASE, baseOf, markdown } from "@/lib/ai/respond";

/** llmstxt.org: what the Atelier is and how an AI can help, for any AI that looks. */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: ({ request }) => markdown(guide(baseOf(request)), 200, VARY_BASE),
    },
  },
});
