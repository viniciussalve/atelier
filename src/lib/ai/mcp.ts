/**
 * A stateless MCP server over Streamable HTTP, answering with plain JSON (no SSE).
 * Speaks the 2026-07-28 revision (no session: each request carries its protocol
 * version in `_meta`, and `server/discover` describes the server) and the 2025
 * revisions (an `initialize` handshake), which most clients still use. Tools only.
 */

export const MODERN_VERSION = "2026-07-28";
export const LEGACY_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];
export const SUPPORTED_VERSIONS = [MODERN_VERSION, ...LEGACY_VERSIONS];

const VERSION_META = "io.modelcontextprotocol/protocolVersion";

export type ToolResult = { text: string; structured?: Record<string, unknown>; isError?: boolean };

export type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  run: (args: Record<string, unknown>) => Promise<ToolResult>;
};

export type ServerInfo = {
  name: string;
  title: string;
  version: string;
  instructions: string;
  tools: Tool[];
};

/** `body` undefined means an empty response (202 to a notification). */
export type McpReply = { status: number; body?: unknown };

type Id = string | number | null;

const ERRORS = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  headerMismatch: -32020,
  unsupportedVersion: -32022,
};

function error(id: Id, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

export function parseError(): McpReply {
  return { status: 400, body: error(null, ERRORS.parse, "Parse error: o corpo não é JSON.") };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * One JSON-RPC message in, one reply out. `headerVersion` is the
 * MCP-Protocol-Version header, which must match the version in `_meta` when
 * both are present.
 */
export async function handleMcp(
  message: unknown,
  headerVersion: string | null,
  server: ServerInfo,
): Promise<McpReply> {
  if (!isRecord(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return { status: 400, body: error(null, ERRORS.invalidRequest, "Invalid Request") };
  }
  const method = message.method;
  const params = isRecord(message.params) ? message.params : {};
  // A notification (no id) needs no answer; this server has nothing to do with any.
  if (!("id" in message)) return { status: 202 };
  const id = (message.id ?? null) as Id;

  const meta = isRecord(params._meta) ? params._meta : {};
  const metaVersion =
    typeof meta[VERSION_META] === "string" ? (meta[VERSION_META] as string) : null;
  const modern = metaVersion !== null || method === "server/discover";

  if (metaVersion !== null) {
    if (headerVersion && headerVersion !== metaVersion) {
      return {
        status: 400,
        body: error(
          id,
          ERRORS.headerMismatch,
          `Header mismatch: MCP-Protocol-Version ${headerVersion} does not match ${metaVersion} in _meta`,
        ),
      };
    }
    if (metaVersion !== MODERN_VERSION) {
      return {
        status: 400,
        body: error(id, ERRORS.unsupportedVersion, "Unsupported protocol version", {
          supported: SUPPORTED_VERSIONS,
          requested: metaVersion,
        }),
      };
    }
  }

  const ok = (result: Record<string, unknown>): McpReply => ({
    status: 200,
    body: { jsonrpc: "2.0", id, result: modern ? { resultType: "complete", ...result } : result },
  });
  const serverInfo = { name: server.name, title: server.title, version: server.version };

  switch (method) {
    case "initialize": {
      const requested = params.protocolVersion;
      const version =
        typeof requested === "string" && LEGACY_VERSIONS.includes(requested)
          ? requested
          : LEGACY_VERSIONS[0];
      return ok({
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo,
        instructions: server.instructions,
      });
    }
    case "server/discover":
      return ok({
        supportedVersions: SUPPORTED_VERSIONS,
        capabilities: { tools: {} },
        _meta: { "io.modelcontextprotocol/serverInfo": serverInfo },
        instructions: server.instructions,
        ttlMs: 3_600_000,
        cacheScope: "public",
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({
        tools: server.tools.map(({ run: _run, ...tool }) => tool),
        ...(modern ? { ttlMs: 3_600_000, cacheScope: "public" } : {}),
      });
    case "tools/call": {
      const tool = server.tools.find((entry) => entry.name === params.name);
      if (!tool) {
        return {
          status: 200,
          body: error(id, ERRORS.invalidParams, `Unknown tool: ${String(params.name)}`),
        };
      }
      const args = isRecord(params.arguments) ? params.arguments : {};
      let result: ToolResult;
      try {
        result = await tool.run(args);
      } catch (problem) {
        result = {
          text: problem instanceof Error ? problem.message : String(problem),
          isError: true,
        };
      }
      return ok({
        content: [{ type: "text", text: result.text }],
        ...(result.structured ? { structuredContent: result.structured } : {}),
        isError: result.isError ?? false,
      });
    }
    default:
      return {
        status: modern ? 404 : 200,
        body: error(id, ERRORS.methodNotFound, `Method not found: ${method}`),
      };
  }
}
