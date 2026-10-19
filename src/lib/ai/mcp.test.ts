import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleMcp, MODERN_VERSION, SUPPORTED_VERSIONS, type ServerInfo } from "./mcp.ts";

const server: ServerInfo = {
  name: "atelier",
  title: "Atelier",
  version: "1.0.0",
  instructions: "Use as ferramentas.",
  tools: [
    {
      name: "eco",
      title: "Eco",
      description: "Devolve o texto.",
      inputSchema: { type: "object", properties: { texto: { type: "string" } } },
      run: async (args) => {
        if (args.texto === "falha") throw new Error("Não deu.");
        return { text: String(args.texto), structured: { texto: args.texto } };
      },
    },
  ],
};

const modernMeta = { _meta: { "io.modelcontextprotocol/protocolVersion": MODERN_VERSION } };
const call = (body: unknown, header: string | null = null) => handleMcp(body, header, server);
const result = (reply: { body?: unknown }) =>
  (reply.body as { result: Record<string, unknown> }).result;
const failure = (reply: { body?: unknown }) => (reply.body as { error: { code: number } }).error;

describe("handleMcp, 2025 clients", () => {
  it("initializes with the version the client asked for, when supported", async () => {
    const reply = await call({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "x", version: "1" },
      },
    });
    assert.equal(reply.status, 200);
    assert.deepEqual(result(reply), {
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "atelier", title: "Atelier", version: "1.0.0" },
      instructions: "Use as ferramentas.",
    });
  });

  it("does not offer 2025-03-26, whose clients may send batches", async () => {
    const reply = await call({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26" },
    });
    assert.equal(result(reply).protocolVersion, "2025-11-25");
    assert.equal(SUPPORTED_VERSIONS.includes("2025-03-26"), false);
  });

  it("offers its newest 2025 version for an unknown one", async () => {
    const reply = await call({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-01-01" },
    });
    assert.equal(result(reply).protocolVersion, "2025-11-25");
  });

  it("accepts notifications with an empty 202", async () => {
    assert.deepEqual(await call({ jsonrpc: "2.0", method: "notifications/initialized" }), {
      status: 202,
    });
  });

  it("lists tools without their code and calls them", async () => {
    const list = await call({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    assert.deepEqual(result(list), {
      tools: [
        {
          name: "eco",
          title: "Eco",
          description: "Devolve o texto.",
          inputSchema: { type: "object", properties: { texto: { type: "string" } } },
        },
      ],
    });
    const reply = await call({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "eco", arguments: { texto: "oi" } },
    });
    assert.deepEqual(result(reply), {
      content: [{ type: "text", text: "oi" }],
      structuredContent: { texto: "oi" },
      isError: false,
    });
  });

  it("turns a tool failure into an error result the model can read", async () => {
    const reply = await call({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "eco", arguments: { texto: "falha" } },
    });
    assert.deepEqual(result(reply), {
      content: [{ type: "text", text: "Não deu." }],
      isError: true,
    });
  });

  it("rejects unknown tools and methods, and malformed messages", async () => {
    const tool = await call({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "nada" },
    });
    assert.equal(failure(tool).code, -32602);
    const method = await call({ jsonrpc: "2.0", id: 6, method: "resources/list" });
    assert.equal(method.status, 200);
    assert.equal(failure(method).code, -32601);
    const bad = await call({ id: 7, method: "ping" });
    assert.equal(bad.status, 400);
    assert.equal(failure(bad).code, -32600);
    assert.equal((await call([{ jsonrpc: "2.0", id: 8, method: "ping" }])).status, 400);
  });
});

describe("handleMcp, 2026-07-28 clients", () => {
  it("describes the server on server/discover", async () => {
    const reply = await call(
      { jsonrpc: "2.0", id: "d", method: "server/discover", params: modernMeta },
      MODERN_VERSION,
    );
    const body = result(reply);
    assert.equal(body.resultType, "complete");
    assert.deepEqual(body.supportedVersions, SUPPORTED_VERSIONS);
    assert.deepEqual(body.capabilities, { tools: {} });
    assert.equal(body.cacheScope, "public");
  });

  it("marks results complete and lets tools/list be cached", async () => {
    const list = result(
      await call(
        { jsonrpc: "2.0", id: 1, method: "tools/list", params: modernMeta },
        MODERN_VERSION,
      ),
    );
    assert.equal(list.resultType, "complete");
    assert.equal(list.cacheScope, "public");
    const reply = result(
      await call(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "eco", arguments: { texto: "a" }, ...modernMeta },
        },
        MODERN_VERSION,
      ),
    );
    assert.equal(reply.resultType, "complete");
  });

  it("refuses a header that disagrees with _meta, and versions it does not speak", async () => {
    const mismatch = await call(
      { jsonrpc: "2.0", id: 1, method: "ping", params: modernMeta },
      "2025-11-25",
    );
    assert.equal(mismatch.status, 400);
    assert.equal(failure(mismatch).code, -32020);
    const old = await call({
      jsonrpc: "2.0",
      id: 2,
      method: "ping",
      params: { _meta: { "io.modelcontextprotocol/protocolVersion": "1900-01-01" } },
    });
    assert.equal(old.status, 400);
    assert.deepEqual((old.body as { error: { data: unknown } }).error.data, {
      supported: SUPPORTED_VERSIONS,
      requested: "1900-01-01",
    });
  });

  it("answers 404 for a method it does not have", async () => {
    const reply = await call(
      { jsonrpc: "2.0", id: 1, method: "prompts/list", params: modernMeta },
      MODERN_VERSION,
    );
    assert.equal(reply.status, 404);
    assert.equal(failure(reply).code, -32601);
  });
});
