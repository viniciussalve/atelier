/** Catalog entries as JSON and Markdown for the AI-facing endpoints. */
import {
  fontStyleLabel,
  iconSetStyle,
  isVariable,
  type CatalogFont,
  type CatalogIconSet,
} from "./catalog.ts";
import { formatAddList, formatWeights } from "./additions.ts";

export function fontJson(font: CatalogFont) {
  return {
    ...font,
    estilo: fontStyleLabel(font.category),
    variavel: isVariable(font),
    adicionar: formatAddList([{ kind: "font", key: font.family }]),
  };
}

export function iconSetJson(set: CatalogIconSet) {
  return {
    ...set,
    estilo: iconSetStyle(set),
    adicionar: formatAddList([{ kind: "icon", key: set.prefix }]),
  };
}

export function fontLine(font: CatalogFont): string {
  const axes = font.axes.map((axis) => `${axis.tag} ${axis.min}–${axis.max}`).join(", ");
  const facts = [
    fontStyleLabel(font.category),
    axes ? `variável (${axes})` : "estática",
    `pesos ${formatWeights(font.weights)}`,
    font.italic ? "com itálico" : "sem itálico",
    font.license || "licença não informada",
  ];
  return `- **${font.family}**: ${facts.join(", ")}. Adicionar: \`${fontJson(font).adicionar}\``;
}

export function iconSetLine(set: CatalogIconSet): string {
  const facts = [
    `${set.total.toLocaleString("pt-BR")} ícones`,
    set.grid ? `grade ${set.grid}` : "grade mista",
    iconSetStyle(set).toLowerCase(),
    set.license || "licença não informada",
  ];
  const samples = set.samples.length ? ` Amostras: ${set.samples.join(", ")}.` : "";
  return `- **${set.name}** (\`${set.prefix}\`): ${facts.join(", ")}.${samples} Adicionar: \`${iconSetJson(set).adicionar}\``;
}

export function listMarkdown(title: string, lines: string[]): string {
  return `# ${title}\n\n${lines.length ? lines.join("\n") : "Nada encontrado."}\n`;
}
