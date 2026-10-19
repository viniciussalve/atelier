import { createFileRoute } from "@tanstack/react-router";
import { FONTS, coverageOf, iconSets, searchIcons } from "@/lib/ai/catalog.server";
import { handleMcp, parseError, type McpReply } from "@/lib/ai/mcp";
import { atelierServer } from "@/lib/ai/mcp-tools";
import { baseOf } from "@/lib/ai/respond";

// Public, read-only tools: any client may call them from a browser too.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers":
    "content-type, accept, authorization, mcp-protocol-version, mcp-method, mcp-name, mcp-session-id, last-event-id",
  "access-control-expose-headers": "mcp-protocol-version",
};

function send(reply: McpReply): Response {
  if (reply.body === undefined) return new Response(null, { status: reply.status, headers: CORS });
  return new Response(JSON.stringify(reply.body), {
    status: reply.status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

// No sessions and no server-to-client stream: GET and DELETE are not part of it.
const notAllowed = () =>
  new Response(
    "Este é o servidor MCP do Atelier (Streamable HTTP, sem sessão). Conecte um cliente MCP a este endereço; ele fala por POST. Guia: /llms.txt\n",
    {
      status: 405,
      headers: { ...CORS, allow: "POST, OPTIONS", "content-type": "text/plain; charset=utf-8" },
    },
  );

/** MCP endpoint: the searches, recommendations and add links as tools. */
export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let message: unknown;
        try {
          message = await request.json();
        } catch {
          return send(parseError());
        }
        const server = atelierServer({
          base: baseOf(request),
          fonts: FONTS,
          sets: iconSets(),
          coverage: coverageOf,
          searchIcons,
        });
        return send(await handleMcp(message, request.headers.get("mcp-protocol-version"), server));
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: notAllowed,
      DELETE: notAllowed,
    },
  },
});
