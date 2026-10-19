/**
 * What an AI reads: the general guide (/llms.txt), the brief of one library
 * (/ia?b=…, or copied as text) and robots.txt. Plain Markdown, in Portuguese,
 * with every URL absolute so it works pasted anywhere.
 */
import { SCALE, VERDICT_LABEL, criteriaFor } from "../library/criteria.ts";
import type { Kind, Score } from "../library/types.ts";
import { addLink } from "./additions.ts";
import type { SnapItem, Snapshot } from "./snapshot.ts";

const KIND_TITLE: Record<Kind, string> = { font: "Fontes", icon: "Conjuntos de ícones" };

function scaleSection(): string {
  const levels = ([1, 2, 3, 4, 5] as Score[]).map((level) => `${level} ${SCALE[level]}`).join(", ");
  return [
    "## Escala",
    "",
    `Cada critério recebe uma carinha: ${levels}. A nota geral é a média ponderada pelos pesos, mostrada como a carinha mais próxima. O veredito, decisão final da pessoa, é Usar, Revisar ou Evitar.`,
  ].join("\n");
}

function criteriaSection(): string {
  const lines = ["## Critérios"];
  for (const kind of ["font", "icon"] as Kind[]) {
    lines.push("", `### ${KIND_TITLE[kind]}`, "");
    for (const def of criteriaFor(kind)) {
      lines.push(`- ${def.label} (\`${def.id}\`, peso ${def.weight}): ${def.hint}`);
    }
  }
  return lines.join("\n");
}

function answerSection(base: string): string {
  const example = addLink(
    base,
    [
      { kind: "font", key: "Inter Tight" },
      { kind: "icon", key: "mingcute" },
    ],
    "Parecidas com a Inter e o Lucide",
  );
  return [
    "## Como responder",
    "",
    "- A avaliação é da pessoa: não invente carinhas nem vereditos.",
    "- Sugira de 3 a 8 itens. Para cada um, uma frase com o motivo ligada ao que ela já avaliou, por exemplo: “como a Inter, que ela marcou Usar, mas com mais pesos leves”.",
    "- Use só nomes que existem: famílias do Google Fonts e prefixos do Iconify. Com acesso à web, confira nos endpoints abaixo.",
    "- Feche com um link que abre o Atelier com as sugestões prontas para adicionar. Ela confirma antes de entrar qualquer coisa:",
    "",
    `  ${example}`,
    "",
    "  `adicionar` leva até 20 itens separados por vírgula, cada um `fonte:<família>` ou `icones:<prefixo>`. `motivo` é opcional e aparece para a pessoa. Espaços viram `%20`.",
  ].join("\n");
}

/** The scale and every criterion, as in the guide. */
export function scaleAndCriteria(): string {
  return `${scaleSection()}\n\n${criteriaSection()}\n`;
}

function mcpSection(base: string): string {
  return [
    "## MCP",
    "",
    `As mesmas buscas existem como ferramentas MCP em ${base}/mcp (Streamable HTTP, sem login). No Claude, em Configurações › Conectores › Adicionar conector personalizado; no ChatGPT, nos conectores do modo de desenvolvedor; em clientes como Cursor ou Claude Code, como servidor HTTP. Ferramentas: buscar_fontes, buscar_conjuntos, buscar_icones, parecidas, recomendar, ler_biblioteca, link_para_adicionar e escala_e_criterios.`,
  ].join("\n");
}

function endpointsSection(base: string): string {
  return [
    "## Endpoints (GET, sem chave)",
    "",
    "Respondem JSON; acrescente `&formato=md` para Markdown. Cada item traz o trecho `fonte:…` ou `icones:…` para o link.",
    "",
    `- Fontes do Google Fonts: ${base}/api/fontes?q=inter&categoria=sans&variavel=sim&alfabeto=vietnamese&limite=20`,
    `  - \`categoria\`: sans, serif, display, manuscrita, mono.`,
    `- Conjuntos do Iconify: ${base}/api/conjuntos?q=line&grade=24&traco=sim&colorido=nao&licenca=mit`,
    `- Ícones por nome em vários conjuntos: ${base}/api/icones?q=settings&conjuntos=lucide,tabler`,
    `- Itens parecidos: ${base}/api/parecidas?fonte=Inter ou ?conjunto=lucide. Com o retrato da pessoa (o valor de \`b\` do link dela): ?b=…&tipo=fontes ou &tipo=icones.`,
  ].join("\n");
}

/** /llms.txt: what the Atelier is and how an AI can help, without anyone's library. */
export function guide(base: string): string {
  return [
    "# Atelier",
    "",
    "> Ferramenta para avaliar fontes do Google Fonts e conjuntos de ícones do Iconify antes de usá-los num produto. Cada critério recebe uma carinha (de Muito ruim a Ótimo), com pesos, e cada item recebe um veredito.",
    "",
    "A biblioteca de cada pessoa fica só no navegador dela. Para ver o que ela avaliou, peça o “Link para IA”, que fica no topo da barra lateral do Atelier: ele abre um resumo da biblioteca, no mesmo formato deste texto.",
    "",
    answerSection(base),
    "",
    endpointsSection(base),
    "",
    mcpSection(base),
    "",
    scaleSection(),
    "",
    criteriaSection(),
    "",
  ].join("\n");
}

function scoreLine(item: SnapItem, kind: Kind): string {
  const parts: string[] = [];
  for (const def of criteriaFor(kind)) {
    const level = item.c?.[def.id];
    const note = item.o?.[def.id];
    if (!level && !note) continue;
    parts.push(`${def.label} ${level ? SCALE[level] : "sem carinha"}${note ? ` (“${note}”)` : ""}`);
  }
  return parts.join(", ");
}

function itemLine(item: SnapItem, kind: Kind): string {
  const head = kind === "icon" && item.k ? `**${item.n}** (\`${item.k}\`)` : `**${item.n}**`;
  const facts: string[] = [];
  if (kind === "font" && item.k && item.k !== item.n) facts.push(`família ${item.k}`);
  facts.push(item.v ? VERDICT_LABEL[item.v] : "sem veredito");
  if (item.g) facts.push(`nota geral ${SCALE[item.g]}`);
  const scores = scoreLine(item, kind);
  if (scores) facts.push(scores);
  else if (!item.v) facts.push("ainda não avaliado");
  if (item.y) facts.push(`estilo ${item.y}`);
  if (item.w) facts.push(`pesos ${item.w}`);
  if (item.l) facts.push(`licença ${item.l}`);
  if (item.t?.length) facts.push(`tags ${item.t.join(", ")}`);
  if (item.p?.length) facts.push(`pastas ${item.p.join("; ")}`);
  if (item.s?.length) facts.push(`amostras ${item.s.join(", ")}`);
  const notes = item.x ? ` Notas: “${item.x}”` : "";
  return `- ${head}: ${facts.join("; ")}.${notes}`;
}

function librarySection(kind: Kind, items: SnapItem[]): string {
  const title = `## ${KIND_TITLE[kind]} na biblioteca (${items.length})`;
  if (items.length === 0) return `${title}\n\nNenhum.`;
  // Decided and evaluated items first: they say the most about the person's taste.
  const weight = (item: SnapItem) => (item.v ? 0 : item.c ? 1 : 2);
  const ordered = [...items].sort((a, b) => weight(a) - weight(b));
  return [title, "", ...ordered.map((item) => itemLine(item, kind))].join("\n");
}

/** The brief of one library: what an AI reads at /ia?b=… or gets pasted as text. */
export function libraryBrief(snapshot: Snapshot, base: string): string {
  const date = snapshot.em.slice(0, 10).split("-").reverse().join("/");
  return [
    "# Biblioteca do Atelier",
    "",
    `> Retrato da biblioteca de uma pessoa no Atelier, de ${date}: as fontes e os conjuntos de ícones que ela avalia, com carinhas por critério e veredito. Ajude com buscas, recomendações por semelhança e sugestões de itens novos.`,
    snapshot.resumido
      ? "\nA biblioteca é grande e este retrato saiu resumido: faltam notas ou itens sem avaliação."
      : "",
    "",
    answerSection(base),
    "",
    librarySection("font", snapshot.fontes),
    "",
    librarySection("icon", snapshot.icones),
    "",
    scaleSection(),
    "",
    criteriaSection(),
    "",
    endpointsSection(base),
    "",
    mcpSection(base),
    "",
    `Guia geral do Atelier: ${base}/llms.txt`,
    "",
  ].join("\n");
}

/** robots.txt: everything is open; instructions live in /llms.txt, not here. */
export function robotsTxt(base: string): string {
  return [`# Atelier. Instruções para IAs: ${base}/llms.txt`, "User-agent: *", "Allow: /", ""].join(
    "\n",
  );
}
