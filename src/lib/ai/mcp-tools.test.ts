import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { iconSetsFrom } from "./catalog.ts";
import { handleMcp } from "./mcp.ts";
import { atelierServer } from "./mcp-tools.ts";
import { encodeSnapshot, snapshotOf } from "./snapshot.ts";
import { FONTS, ICON_INFO } from "./test-fixtures.ts";
import { defaultLibrary } from "../library/seed.ts";

const server = atelierServer({
  base: "https://atelier.app",
  fonts: FONTS,
  sets: iconSetsFrom(ICON_INFO),
  coverage: async () => ({}),
  searchIcons: async (query) => ({ icons: [`lucide:${query}`], ok: true }),
});

async function callTool(name: string, args: Record<string, unknown>) {
  const reply = await handleMcp(
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } },
    null,
    server,
  );
  return (
    reply.body as {
      result: {
        content: { text: string }[];
        isError: boolean;
        structuredContent?: Record<string, unknown>;
      };
    }
  ).result;
}

describe("atelier MCP tools", () => {
  it("lists every tool with a schema", async () => {
    const reply = await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, null, server);
    const tools = (
      reply.body as { result: { tools: { name: string; inputSchema: { type: string } }[] } }
    ).result.tools;
    assert.deepEqual(
      tools.map((tool) => tool.name),
      [
        "buscar_fontes",
        "buscar_conjuntos",
        "buscar_icones",
        "parecidas",
        "recomendar",
        "ler_biblioteca",
        "link_para_adicionar",
        "escala_e_criterios",
      ],
    );
    assert.ok(tools.every((tool) => tool.inputSchema.type === "object"));
  });

  it("searches fonts with Portuguese or English categories", async () => {
    const result = await callTool("buscar_fontes", { categoria: "monoespaçada" });
    assert.match(result.content[0].text, /\*\*Space Mono\*\*/);
    const english = await callTool("buscar_fontes", { categoria: "serif", limite: "5" });
    assert.match(english.content[0].text, /\*\*Playfair Display\*\*/);
  });

  it("searches icon sets and icons", async () => {
    const sets = await callTool("buscar_conjuntos", { grade: 24, traco: true });
    assert.match(sets.content[0].text, /`lucide`/);
    const icons = await callTool("buscar_icones", { nome: "house" });
    assert.match(icons.content[0].text, /`lucide:house`/);
    assert.equal((await callTool("buscar_icones", {})).isError, true);
  });

  it("reads a Link para IA and recommends from it", async () => {
    const encoded = await encodeSnapshot(snapshotOf(defaultLibrary(), "2026-10-19T12:00:00.000Z"));
    const link = `https://atelier.app/ia?b=${encoded}`;
    const read = await callTool("ler_biblioteca", { link });
    assert.match(read.content[0].text, /- \*\*Inter\*\*: Usar; nota geral Ótimo/);
    const recs = await callTool("recomendar", { link, tipo: "fontes", limite: 2 });
    assert.equal(recs.isError, false);
    assert.match(recs.content[0].text, /^# Fontes recomendadas para esta biblioteca/);
    const broken = await callTool("ler_biblioteca", { link: "https://atelier.app/ia?b=cortado" });
    assert.equal(broken.isError, true);
    assert.match(broken.content[0].text, /copiar de novo/);
  });

  it("writes the add link and warns about what does not exist", async () => {
    const result = await callTool("link_para_adicionar", {
      itens: [
        { tipo: "fonte", nome: "Inter Tight" },
        { tipo: "icones", nome: "lucide" },
        { tipo: "icones", nome: "nao-existe" },
        { tipo: "fonte", nome: "Fonte Nova" },
      ],
      motivo: "Parecidas com a Inter",
    });
    assert.equal(
      result.structuredContent?.link,
      "https://atelier.app/?adicionar=fonte:Inter%20Tight,icones:lucide,fonte:Fonte%20Nova&motivo=Parecidas%20com%20a%20Inter",
    );
    assert.match(result.content[0].text, /O conjunto “nao-existe” não existe no Iconify/);
    assert.match(result.content[0].text, /“Fonte Nova” não está no catálogo embutido/);
    const none = await callTool("link_para_adicionar", {
      itens: [{ tipo: "icones", nome: "x y" }],
    });
    assert.equal(none.isError, true);
  });

  it("explains the scale and criteria", async () => {
    const result = await callTool("escala_e_criterios", {});
    assert.match(result.content[0].text, /1 Muito ruim, 2 Ruim, 3 Ok, 4 Bom, 5 Ótimo/);
    assert.equal((result.structuredContent?.criterios as unknown[]).length, 8);
  });
});
