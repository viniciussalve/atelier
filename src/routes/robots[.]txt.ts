import { createFileRoute } from "@tanstack/react-router";
import { robotsTxt } from "@/lib/ai/brief";
import { VARY_BASE, baseOf, markdown } from "@/lib/ai/respond";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => markdown(robotsTxt(baseOf(request)), 200, "public", VARY_BASE),
    },
  },
});
