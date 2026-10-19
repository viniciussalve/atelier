export type Kind = "font" | "icon";

export type View =
  | { type: "all" }
  | { type: "recent" }
  | { type: "pending" }
  | { type: "uncategorized" }
  | { type: "untagged" }
  | { type: "folder"; id: string };

export type Folder = {
  id: string;
  name: string;
  kind: Kind;
  parentId: string | null;
};

export type Verdict = "" | "usar" | "revisar" | "evitar";
export type Score = 1 | 2 | 3 | 4 | 5;

export type FontCriterionId = "leitura" | "interface" | "distincao" | "tom";
export type IconCriterionId = "miudo" | "consistencia" | "componentes" | "cobertura";
export type CriterionId = FontCriterionId | IconCriterionId;

export type CriterionScore = { value: Score | null; note: string };
/** A key exists only while it holds a value or a non-empty note. */
export type Scorecard = Partial<Record<CriterionId, CriterionScore>>;

/** Specimen sections a criterion is judged against. */
export type SpecimenSection =
  "titulo" | "leitura" | "interface" | "criticos" | "amostras" | "tamanhos" | "componentes";

export type CriterionDef = {
  id: CriterionId;
  kind: Kind;
  label: string;
  /** What to look for while judging. */
  hint: string;
  weight: 1 | 2 | 3;
  section: SpecimenSection;
};

export type Asset = {
  id: string;
  kind: Kind;
  name: string;
  folderIds: string[];
  tags: string[];
  notes: string;
  url: string;
  verdict: Verdict;
  criteria: Scorecard;
  family: string;
  style: string;
  weights: string;
  format: string;
  sizeLabel: string;
  license: string;
  iconKey: string;
  samples: string[];
  createdAt: string;
  modifiedAt: string;
  importedAt: string;
  lastUsedAt: string | null;
};

export type EvaluationStatus = "nao-avaliado" | "em-avaliacao" | "decidido";

export type Filters = {
  /** "" stands for "Sem veredito". An empty list matches anything. */
  verdict: Verdict[];
  status: EvaluationStatus[];
  /** Hides unscored items when set. */
  minScore: Score | null;
  tags: string[];
  license: string[];
  style: string[];
  format: string[];
};
export type ListFacet = Exclude<keyof Filters, "minScore">;

export type SortKey = "name" | "score" | "modified" | "recent" | "verdict";
export type SortSpec = { key: SortKey; dir: "asc" | "desc" };
export type Display = "grid" | "list";

export type KindNav = {
  view: View;
  query: string;
  filters: Filters;
  sort: SortSpec;
  display: Display;
};

export type PreviewGround = "paper" | "mist" | "ink" | "navy" | "sand";

export type LibraryData = {
  kind: Kind;
  nav: Record<Kind, KindNav>;
  /** Explorer folders the user expanded; everything starts collapsed. */
  expanded: string[];
  folders: Folder[];
  assets: Asset[];
};
