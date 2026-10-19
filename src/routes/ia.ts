import { createFileRoute } from "@tanstack/react-router";
import { guide, libraryBrief } from "@/lib/ai/brief";
import { baseOf, markdown } from "@/lib/ai/respond";
import { decodeSnapshot } from "@/lib/ai/snapshot";

// A person's library: never cached by a proxy nor indexed by a search engine.
const PRIVATE = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" };

/** The "Link para IA": the brief of the library carried in `?b=`, or the guide without it. */
export const Route = createFileRoute("/ia")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        // `p`: the preview port prefix, which the proxy strips; `baseOf` checks it.
        const base = baseOf(request, params.get("p"));
        const encoded = params.get("b");
        if (!encoded) return markdown(guide(base), 200, PRIVATE);
        const snapshot = await decodeSnapshot(encoded);
        if (!snapshot) {
          const note =
            "> O link desta biblioteca chegou cortado ou alterado. Peça para a pessoa copiar o “Link para IA” de novo.\n\n";
          return markdown(note + guide(base), 400, PRIVATE);
        }
        return markdown(libraryBrief(snapshot, base), 200, PRIVATE);
      },
    },
  },
});
