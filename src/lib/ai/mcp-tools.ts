/**
 * The Atelier's MCP tools: the same searches and recommendations as the HTTP
 * endpoints, plus reading a "Link para IA" and writing an add link. Catalogs and
 * network lookups come in as dependencies, so the tools are testable offline.
 */
import {
  addLink,
  formatAddList,
  kindFrom,
  parseAddList,
  resolveSpecs,
  type AddSpec,
} from "./additions.ts";
import { libraryBrief, scaleAndCriteria } from "./brief.ts";
import { searchFonts, searchIconSets } from "./catalog.ts";
import {
  fontJson,
  fontLine,
  iconSetJson,
  iconSetLine,
  iconsMarkdown,
  listMarkdown,
} from "./format.ts";
import type { ServerInfo, Tool, ToolResult } from "./mcp.ts";
import { flag, fontCategoryFrom, listParam } from "./params.ts";
import { decodeSnapshot, snapshotFromLink } from "./snapshot.ts";
import {
  recommendFor,
  similarTo,
  suggestionJson,
  suggestionMarkdown,
  type SuggestDeps,
  type Suggestion,
} from "./suggest.ts";
import { SCALE, criteriaFor } from "../library/criteria.ts";

export type ToolDeps = SuggestDeps & {
  /** The app's public origin, for the links the tools write. */
  base: string;
  searchIcons: (
    query: string,
    options: { prefixes?: string[]; limit?: number },
  ) => Promise<{ icons: string[]; ok: boolean }>;
};

const str = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
/** A finite number, or undefined: "dez" or "5x" must not become NaN and empty every list. */
const num = (value: unknown) => {
  const number = typeof value === "string" && value.trim() ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : undefined;
};
const bool = (value: unknown) =>
  typeof value === "boolean" ? value : typeof value === "string" ? flag(value) : undefined;
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const limit = (max: number) => ({ type: "integer", minimum: 1, maximum: max });
const LINK = {
  type: "string",
  description:
    "O “Link para IA” que a pessoa copiou no Atelier (https://…/ia?b=…), ou só o valor de b.",
};

function answer(result: Suggestion): ToolResult {
  if (!result.ok) return { text: result.error, isError: true };
  return { text: suggestionMarkdown(result), structured: suggestionJson(result) };
}

async function readLink(link: unknown) {
  const encoded = snapshotFromLink(str(link) ?? "");
  const snapshot = encoded ? await decodeSnapshot(encoded) : null;
  if (!snapshot) {
    throw new Error(
      "Não consegui ler o link: ele chegou cortado ou não é um “Link para IA”. Peça para a pessoa copiar de novo.",
    );
  }
  return snapshot;
}

export function atelierTools(deps: ToolDeps): Tool[] {
  return [
    {
      name: "buscar_fontes",
      title: "Buscar fontes no Google Fonts",
      description:
        "Busca famílias do Google Fonts por nome e filtros. Cada resultado traz o trecho fonte:<família> para link_para_adicionar.",
      inputSchema: {
        type: "object",
        properties: {
          consulta: { type: "string", description: "Parte do nome da família, ex.: inter." },
          categoria: {
            type: "string",
            enum: ["sans-serif", "serif", "display", "handwriting", "monospace"],
          },
          variavel: { type: "boolean", description: "Só fontes variáveis (eixo de peso)." },
          alfabeto: { type: "string", description: "Ex.: latin-ext, vietnamese, cyrillic." },
          limite: { ...limit(50), default: 20 },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY,
      run: async (args) => {
        const fonts = searchFonts(deps.fonts, {
          q: str(args.consulta),
          category: fontCategoryFrom(str(args.categoria)),
          variable: bool(args.variavel),
          subset: str(args.alfabeto)?.toLowerCase(),
          limit: num(args.limite),
        });
        return {
          text: listMarkdown("Fontes do Google Fonts", fonts.map(fontLine)),
          structured: { fontes: fonts.map(fontJson) },
        };
      },
    },
    {
      name: "buscar_conjuntos",
      title: "Buscar conjuntos de ícones no Iconify",
      description:
        "Busca conjuntos do Iconify por nome, prefixo e filtros (grade, traço, cor, licença). Cada resultado traz o trecho icones:<prefixo> para link_para_adicionar.",
      inputSchema: {
        type: "object",
        properties: {
          consulta: { type: "string", description: "Parte do nome ou do prefixo, ex.: line." },
          categoria: { type: "string", description: "Categoria do Iconify, ex.: UI 24px." },
          grade: { type: "integer", description: "Grade em px: 16, 20, 24, 32…" },
          traco: { type: "boolean", description: "Só conjuntos desenhados com traço." },
          colorido: {
            type: "boolean",
            description: "true: só coloridos; false: só monocromáticos.",
          },
          licenca: { type: "string", description: "Ex.: mit, apache, cc0." },
          limite: { ...limit(50), default: 20 },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY,
      run: async (args) => {
        const sets = searchIconSets(deps.sets, {
          q: str(args.consulta),
          category: str(args.categoria),
          grid: num(args.grade),
          stroke: bool(args.traco),
          palette: bool(args.colorido),
          license: str(args.licenca),
          limit: num(args.limite),
        });
        return {
          text: listMarkdown("Conjuntos de ícones do Iconify", sets.map(iconSetLine)),
          structured: { conjuntos: sets.map(iconSetJson) },
        };
      },
    },
    {
      name: "buscar_icones",
      title: "Buscar ícones por nome",
      description:
        "Procura ícones por nome em todos os conjuntos do Iconify, ou só em alguns. Responde nomes como lucide:house.",
      inputSchema: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome ou palavra, ex.: settings." },
          conjuntos: { type: "array", items: { type: "string" }, description: "Prefixos." },
          limite: { ...limit(200), default: 64 },
        },
        required: ["nome"],
        additionalProperties: false,
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
      run: async (args) => {
        const query = str(args.nome);
        if (!query) return { text: "Diga o nome do ícone.", isError: true };
        const { icons, ok } = await deps.searchIcons(query, {
          prefixes: listParam(args.conjuntos),
          limit: num(args.limite),
        });
        if (!ok) return { text: "O Iconify não respondeu. Tente de novo.", isError: true };
        return { text: iconsMarkdown(query, icons), structured: { icones: icons } };
      },
    },
    {
      name: "parecidas",
      title: "Itens parecidos",
      description:
        "Fontes parecidas com uma família, ou conjuntos parecidos com um prefixo, pelos metadados do catálogo. Para conjuntos, passe as amostras para conferir quantas o conjunto tem.",
      inputSchema: {
        type: "object",
        properties: {
          fonte: { type: "string", description: "Família do Google Fonts." },
          conjunto: { type: "string", description: "Prefixo do Iconify." },
          amostras: { type: "array", items: { type: "string" }, description: "Nomes de ícones." },
          limite: { ...limit(30), default: 10 },
        },
        additionalProperties: false,
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
      run: async (args) =>
        answer(
          await similarTo(
            {
              fonte: str(args.fonte),
              conjunto: str(args.conjunto),
              amostras: listParam(args.amostras),
              limite: num(args.limite),
            },
            deps,
          ),
        ),
    },
    {
      name: "recomendar",
      title: "Recomendar para a biblioteca",
      description:
        "Recomenda fontes ou conjuntos que a pessoa ainda não tem, perto do que ela marcou Usar ou avaliou como Bom ou Ótimo e longe do que marcou Evitar.",
      inputSchema: {
        type: "object",
        properties: {
          link: LINK,
          tipo: { type: "string", enum: ["fontes", "icones"] },
          limite: { ...limit(30), default: 10 },
        },
        required: ["link", "tipo"],
        additionalProperties: false,
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
      run: async (args) =>
        answer(
          await recommendFor(
            await readLink(args.link),
            args.tipo === "icones" ? "icones" : "fontes",
            num(args.limite),
            deps,
          ),
        ),
    },
    {
      name: "ler_biblioteca",
      title: "Ler a biblioteca da pessoa",
      description:
        "Lê o “Link para IA” e devolve a biblioteca: fontes e conjuntos com carinhas por critério, veredito, notas, tags e pastas.",
      inputSchema: {
        type: "object",
        properties: { link: LINK },
        required: ["link"],
        additionalProperties: false,
      },
      annotations: READ_ONLY,
      run: async (args) => ({ text: libraryBrief(await readLink(args.link), deps.base) }),
    },
    {
      name: "link_para_adicionar",
      title: "Link para adicionar sugestões",
      description:
        "Escreve o link que abre o Atelier com as sugestões prontas para adicionar. A pessoa confere e confirma; nada entra sozinho. Termine a resposta com este link.",
      inputSchema: {
        type: "object",
        properties: {
          itens: {
            type: "array",
            maxItems: 20,
            items: {
              type: "object",
              properties: {
                tipo: { type: "string", enum: ["fonte", "icones"] },
                nome: {
                  type: "string",
                  description: "Família do Google Fonts ou prefixo do Iconify.",
                },
              },
              required: ["tipo", "nome"],
            },
          },
          motivo: { type: "string", description: "Uma frase que a pessoa vê ao abrir." },
        },
        required: ["itens"],
        additionalProperties: false,
      },
      annotations: READ_ONLY,
      run: async (args) => {
        const asked: unknown[] = Array.isArray(args.itens) ? args.itens : [];
        const skipped: string[] = [];
        const wanted: AddSpec[] = asked.flatMap((entry): AddSpec[] => {
          // "fonte:Inter" as a plain string, as in the link itself.
          if (typeof entry === "string") return parseAddList(entry);
          if (!entry || typeof entry !== "object") return [];
          const item = entry as { tipo?: unknown; nome?: unknown };
          const key = str(item.nome);
          if (!key) return [];
          const kind = kindFrom(item.tipo);
          if (!kind) {
            skipped.push(
              `- O tipo “${String(item.tipo)}” não é fonte nem ícones; “${key}” ficou de fora.`,
            );
            return [];
          }
          return [{ kind, key }];
        });
        const specs = parseAddList(formatAddList(wanted));
        const { missing } = resolveSpecs(specs, { fonts: deps.fonts, sets: deps.sets }, "");
        // An unknown prefix fails for sure; an unknown family may still be on Google Fonts.
        const kept = specs.filter((spec) => spec.kind === "font" || !missing.includes(spec));
        if (kept.length === 0) {
          const why = skipped.length ? `\n\n${skipped.join("\n")}` : "";
          return {
            text: `Nenhum item válido. Use famílias do Google Fonts e prefixos do Iconify.${why}`,
            isError: true,
          };
        }
        const link = addLink(deps.base, kept, str(args.motivo));
        const notes = [
          ...skipped,
          ...missing.map((spec) =>
            spec.kind === "font"
              ? `- “${spec.key}” não está no catálogo embutido; o Atelier confere no Google Fonts ao abrir.`
              : `- O conjunto “${spec.key}” não existe no Iconify e ficou de fora.`,
          ),
        ];
        return {
          text: `Link para a pessoa abrir e confirmar:\n\n${link}\n${notes.length ? `\n${notes.join("\n")}\n` : ""}`,
          structured: { link, itens: formatAddList(kept).split(","), avisos: notes },
        };
      },
    },
    {
      name: "escala_e_criterios",
      title: "Escala e critérios",
      description: "A escala de carinhas e os critérios de avaliação, com peso e o que observar.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: READ_ONLY,
      run: async () => ({
        text: scaleAndCriteria(),
        structured: {
          escala: SCALE,
          criterios: (["font", "icon"] as const).flatMap((kind) =>
            criteriaFor(kind).map(({ id, kind: tipo, label, weight, hint }) => ({
              id,
              tipo: tipo === "font" ? "fonte" : "icones",
              nome: label,
              peso: weight,
              observar: hint,
            })),
          ),
        },
      }),
    },
  ];
}

export const INSTRUCTIONS =
  "O Atelier avalia fontes do Google Fonts e conjuntos de ícones do Iconify com carinhas (de Muito ruim a Ótimo) por critério e um veredito (Usar, Revisar, Evitar). A biblioteca da pessoa fica no navegador dela: peça o “Link para IA” (fica no topo da barra lateral) e use ler_biblioteca e recomendar. Para sugerir itens, explique o motivo de cada um e termine com o link de link_para_adicionar; a pessoa confirma antes de entrar qualquer coisa. Não invente avaliações.";

export function atelierServer(deps: ToolDeps): ServerInfo {
  return {
    name: "atelier",
    title: "Atelier",
    version: "1.0.0",
    instructions: INSTRUCTIONS,
    tools: atelierTools(deps),
  };
}
