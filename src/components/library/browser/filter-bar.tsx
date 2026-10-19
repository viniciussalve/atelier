import { useId, useMemo } from "react";
import { ChevronDown, ListFilter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STATUS_LABEL, VERDICT_LABEL } from "@/lib/library/criteria";
import {
  FACETS_BY_KIND,
  activeFilterCount,
  facetCounts,
  matchesQuery,
  scopeToView,
  type FacetOption,
} from "@/lib/library/filters";
import { useLibrary } from "@/lib/library/store";
import type { EvaluationStatus, Kind, ListFacet, Score, Verdict } from "@/lib/library/types";
import { cn } from "@/lib/utils";

const FACET_LABEL: Record<ListFacet, string> = {
  verdict: "Veredito",
  status: "Status",
  tags: "Tags",
  license: "Licença",
  style: "Estilo",
  format: "Formato",
};

const MIN_SCORES: { value: Score | null; label: string }[] = [
  { value: null, label: "Qualquer nota" },
  { value: 2, label: "2 ou mais" },
  { value: 3, label: "3 ou mais" },
  { value: 4, label: "4 ou mais" },
  { value: 5, label: "Só 5" },
];

function optionLabel(facet: ListFacet, value: string) {
  if (facet === "verdict") return VERDICT_LABEL[value as Verdict];
  if (facet === "status") return STATUS_LABEL[value as EvaluationStatus];
  return value;
}

/** Facet popovers, the active filters as chips, and a way to clear them. */
export function FilterBar({ kind }: { kind: Kind }) {
  const nav = useLibrary((state) => state.nav[kind]);
  const assets = useLibrary((state) => state.assets);
  const folders = useLibrary((state) => state.folders);
  const toggleFilter = useLibrary((state) => state.toggleFilter);
  const setMinScore = useLibrary((state) => state.setMinScore);
  const clearFilters = useLibrary((state) => state.clearFilters);
  const facets = FACETS_BY_KIND[kind];
  const { filters } = nav;

  const options = useMemo(() => {
    const base = scopeToView(assets, folders, kind, nav.view).filter((item) =>
      matchesQuery(item, folders, nav.query),
    );
    return facetCounts(base, filters, facets);
  }, [assets, folders, kind, nav.view, nav.query, filters, facets]);

  const active = activeFilterCount(filters);
  const toggle = (facet: ListFacet, value: string) => toggleFilter(kind, facet, value);

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
      <div className="hidden flex-wrap items-center gap-1.5 @2xl:flex">
        {facets.map((facet) => (
          <Popover key={facet}>
            <FacetTrigger label={FACET_LABEL[facet]} count={filters[facet].length} />
            <PopoverContent className="w-60 p-1">
              <FacetOptions
                facet={facet}
                options={options[facet]}
                selected={filters[facet]}
                onToggle={toggle}
              />
            </PopoverContent>
          </Popover>
        ))}
        <Popover>
          <FacetTrigger label="Nota mínima" count={filters.minScore === null ? 0 : 1} />
          <PopoverContent className="w-48 p-1">
            <MinScoreOptions
              value={filters.minScore}
              onChange={(value) => setMinScore(kind, value)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Popover>
        <PopoverTrigger className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-sm text-muted hover:text-fg data-[state=open]:border-proof/60 data-[state=open]:text-fg @2xl:hidden">
          <ListFilter className="size-3.5" />
          Filtros
          {active ? <span className="text-xs text-proof tabular-nums">{active}</span> : null}
        </PopoverTrigger>
        <PopoverContent className="max-h-[70vh] w-64 overflow-y-auto p-1">
          {facets.map((facet) =>
            options[facet].length ? (
              <section key={facet} className="pb-1">
                <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                  {FACET_LABEL[facet]}
                </p>
                <FacetOptions
                  facet={facet}
                  options={options[facet]}
                  selected={filters[facet]}
                  onToggle={toggle}
                />
              </section>
            ) : null,
          )}
          <section>
            <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted">Nota mínima</p>
            <MinScoreOptions
              value={filters.minScore}
              onChange={(value) => setMinScore(kind, value)}
            />
          </section>
        </PopoverContent>
      </Popover>

      {facets.flatMap((facet) =>
        filters[facet].map((value) => (
          <Chip
            key={`${facet}:${value}`}
            facet={FACET_LABEL[facet]}
            label={optionLabel(facet, value)}
            onRemove={() => toggle(facet, value)}
          />
        )),
      )}
      {filters.minScore !== null ? (
        <Chip
          facet="Nota"
          label={MIN_SCORES.find((entry) => entry.value === filters.minScore)?.label ?? ""}
          onRemove={() => setMinScore(kind, null)}
        />
      ) : null}
      {active ? (
        <button
          type="button"
          onClick={() => clearFilters(kind)}
          className="h-7 rounded-md px-2 text-sm text-muted hover:text-fg"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}

function FacetTrigger({ label, count }: { label: string; count: number }) {
  return (
    <PopoverTrigger
      className={cn(
        "flex h-7 items-center gap-1 rounded-md border px-2 text-sm transition-colors data-[state=open]:border-proof/60 data-[state=open]:text-fg",
        count ? "border-proof/40 text-fg" : "border-border text-muted hover:text-fg",
      )}
    >
      {label}
      {count ? <span className="text-xs text-proof tabular-nums">{count}</span> : null}
      <ChevronDown className="size-3.5 opacity-60" />
    </PopoverTrigger>
  );
}

function FacetOptions({
  facet,
  options,
  selected,
  onToggle,
}: {
  facet: ListFacet;
  options: FacetOption[];
  selected: string[];
  onToggle: (facet: ListFacet, value: string) => void;
}) {
  if (!options.length)
    return <p className="px-2 py-2 text-sm text-muted">Nada para filtrar aqui.</p>;
  return (
    <ul>
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <li key={option.value || "none"}>
            <label
              className={cn(
                "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-surface",
                !checked && option.count === 0 && "text-subtle",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(facet, option.value)}
                className="size-3.5 accent-proof"
              />
              <span className="min-w-0 flex-1 truncate">{optionLabel(facet, option.value)}</span>
              <span className="text-xs text-subtle tabular-nums">{option.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function MinScoreOptions({
  value,
  onChange,
}: {
  value: Score | null;
  onChange: (value: Score | null) => void;
}) {
  const name = useId();
  return (
    <ul role="radiogroup" aria-label="Nota mínima">
      {MIN_SCORES.map((entry) => (
        <li key={entry.label}>
          <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-surface">
            <input
              type="radio"
              name={name}
              checked={value === entry.value}
              onChange={() => onChange(entry.value)}
              className="size-3.5 accent-proof"
            />
            {entry.label}
          </label>
        </li>
      ))}
    </ul>
  );
}

function Chip({ facet, label, onRemove }: { facet: string; label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-proof/10 pr-1 pl-2 text-sm">
      <span className="text-muted">{facet}</span>
      <span>{label}</span>
      <button
        type="button"
        aria-label={`Remover filtro ${facet}: ${label}`}
        onClick={onRemove}
        className="grid size-5 place-items-center rounded text-muted hover:bg-proof/20 hover:text-fg"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
