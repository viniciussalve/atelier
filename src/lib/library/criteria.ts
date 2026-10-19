import type {
  Asset,
  CriterionDef,
  EvaluationStatus,
  Kind,
  Score,
  SpecimenSection,
  Verdict,
} from "./types.ts";

const FONT_CRITERIA: CriterionDef[] = [
  {
    id: "leitura",
    kind: "font",
    label: "Leitura",
    weight: 3,
    section: "leitura",
    hint: "Um parágrafo de três ou quatro frases a 16–18 px flui sem cansar? Observe o desenho de a, g e s, a entrelinha e o ritmo.",
  },
  {
    id: "interface",
    kind: "font",
    label: "Interface",
    weight: 3,
    section: "interface",
    hint: "Rótulos, botões e mensagens de 11 a 14 px continuam nítidos e compactos? Veja caixa alta curta, números e o peso médio.",
  },
  {
    id: "distincao",
    kind: "font",
    label: "Distinção",
    weight: 2,
    section: "criticos",
    hint: "I, l e 1; O e 0; rn e m; 5 e S; acentos como ã, õ e ç. Tudo precisa ser inconfundível.",
  },
  {
    id: "tom",
    kind: "font",
    label: "Tom",
    weight: 1,
    section: "titulo",
    hint: "A personalidade combina com o produto, sem ficar fria nem enfeitada demais?",
  },
];

const ICON_CRITERIA: CriterionDef[] = [
  {
    id: "miudo",
    kind: "icon",
    label: "A 16 px",
    weight: 3,
    section: "tamanhos",
    hint: "Em 16 e 20 px o traço não some e os detalhes não embolam?",
  },
  {
    id: "consistencia",
    kind: "icon",
    label: "Consistência",
    weight: 2,
    section: "amostras",
    hint: "Mesmo peso de traço, cantos, grade e proporção entre os ícones?",
  },
  {
    id: "componentes",
    kind: "icon",
    label: "Em componentes",
    weight: 2,
    section: "componentes",
    hint: "Funciona ao lado de texto em botões, listas e abas, alinhado à linha de base?",
  },
  {
    id: "cobertura",
    kind: "icon",
    label: "Cobertura",
    weight: 2,
    section: "amostras",
    hint: "Tem os ícones de que precisamos? Adicione nomes em Amostras e veja o que falta.",
  },
];

/** One face per level, from the carinhas set. */
export const SCALE: Record<Score, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Ok",
  4: "Bom",
  5: "Ótimo",
};

export const VERDICTS: { id: Exclude<Verdict, "">; label: string }[] = [
  { id: "usar", label: "Usar" },
  { id: "revisar", label: "Revisar" },
  { id: "evitar", label: "Evitar" },
];

export const VERDICT_LABEL: Record<Verdict, string> = {
  "": "Sem veredito",
  usar: "Usar",
  revisar: "Revisar",
  evitar: "Evitar",
};

export const STATUS_LABEL: Record<EvaluationStatus, string> = {
  "nao-avaliado": "Não avaliado",
  "em-avaliacao": "Em avaliação",
  decidido: "Decidido",
};

export function criteriaFor(kind: Kind): CriterionDef[] {
  return kind === "font" ? FONT_CRITERIA : ICON_CRITERIA;
}

export function criteriaForSection(kind: Kind, section: SpecimenSection): CriterionDef[] {
  return criteriaFor(kind).filter((def) => def.section === section);
}

export function isScore(value: unknown): value is Score {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

/** Weighted mean of the scored criteria of the asset's kind, or null when none is scored. */
export function overallScore(asset: Pick<Asset, "kind" | "criteria">): number | null {
  let total = 0;
  let weights = 0;
  for (const def of criteriaFor(asset.kind)) {
    const value = asset.criteria[def.id]?.value;
    if (!isScore(value)) continue;
    total += value * def.weight;
    weights += def.weight;
  }
  return weights ? total / weights : null;
}

export function scoredCount(asset: Pick<Asset, "kind" | "criteria">) {
  const defs = criteriaFor(asset.kind);
  const scored = defs.filter((def) => isScore(asset.criteria[def.id]?.value)).length;
  return { scored, total: defs.length };
}

export function evaluationStatus(
  asset: Pick<Asset, "kind" | "criteria" | "verdict">,
): EvaluationStatus {
  if (asset.verdict) return "decidido";
  return scoredCount(asset).scored > 0 ? "em-avaliacao" : "nao-avaliado";
}

export function formatScore(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** The face a mean shows: rounded half up and kept inside 1–5. */
export function roundedScore(value: number | null): Score | null {
  if (value === null) return null;
  return Math.min(5, Math.max(1, Math.round(value))) as Score;
}

export function scaleLabel(value: number | null): string {
  const rounded = roundedScore(value);
  return rounded === null ? "Sem nota" : SCALE[rounded];
}
