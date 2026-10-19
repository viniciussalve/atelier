import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { ScoreBadge, StatusText, VerdictBadge } from "@/components/library/evaluation/badges";
import { withVerdict } from "@/components/library/evaluation/tones";
import { SetGlyphs } from "@/components/library/icons";
import { formatDate } from "@/lib/library/format";
import type { Asset, SortKey, SortSpec } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import type { CardHandlers } from "./asset-card";

const LIGHT_INK = "#eceef2"; // --color-fg

/** The collection as rows, for scanning many items at once. Columns drop as the pane narrows. */
export function AssetTable({
  list,
  sort,
  sortLocked,
  onSort,
  selected,
  onSelect,
  handlersFor,
}: {
  list: Asset[];
  sort: SortSpec;
  sortLocked: boolean;
  onSort: (key: SortKey) => void;
  selected: Set<string>;
  onSelect: (id: string) => void;
  handlersFor: (asset: Asset) => CardHandlers;
}) {
  const header = (key: SortKey | null, label: string, className?: string) => {
    // In Recentes the rows follow recent use, not the saved sort: no column claims the order.
    const current = !sortLocked && key && sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={current ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
        className={cn("h-9 px-3 text-left text-xs font-medium text-muted", className)}
      >
        {key && !sortLocked ? (
          <button
            type="button"
            onClick={() => onSort(key)}
            className="inline-flex items-center gap-1 hover:text-fg"
          >
            {label}
            {current ? (
              sort.dir === "asc" ? (
                <ArrowUp className="size-3 text-proof" />
              ) : (
                <ArrowDown className="size-3 text-proof" />
              )
            ) : null}
          </button>
        ) : (
          label
        )}
      </th>
    );
  };

  return (
    <table className="w-full border-separate border-spacing-0 text-sm">
      <thead className="sticky top-0 z-10 bg-bg">
        <tr className="[&>th]:border-b [&>th]:border-border">
          <th scope="col" className="w-10">
            <span className="sr-only">Selecionar</span>
          </th>
          {header("name", "Nome", "w-[40%] min-w-44")}
          {header("verdict", "Veredito", "hidden @md:table-cell")}
          {header("score", "Nota")}
          {header(null, "Status", "hidden @3xl:table-cell")}
          {header(null, "Estilo", "hidden @2xl:table-cell")}
          {header(null, "Licença", "hidden @xl:table-cell")}
          {header(null, "Tags", "hidden @4xl:table-cell")}
          {header("modified", "Modificado", "hidden @5xl:table-cell")}
        </tr>
      </thead>
      <tbody>
        {list.map((item) => {
          const handlers = handlersFor(item);
          const isSelected = selected.has(item.id);
          return (
            <tr
              key={item.id}
              className={cn(
                "group [&>td]:border-b [&>td]:border-border/60",
                isSelected ? "bg-proof/5" : "hover:bg-surface",
              )}
            >
              <td className="px-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Selecionar ${item.name} para comparar`}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "grid size-5 place-items-center rounded border",
                    isSelected
                      ? "border-proof bg-proof text-proof-fg"
                      : "border-border text-transparent hover:text-muted",
                  )}
                >
                  <Check className="size-3" />
                </button>
              </td>
              <td className="max-w-0 px-3 py-1.5">
                <button
                  type="button"
                  draggable
                  onDragStart={handlers.onDragStart}
                  onDragEnd={handlers.onDragEnd}
                  onClick={handlers.onOpen}
                  onDoubleClick={handlers.onPin}
                  aria-label={withVerdict(item.name, item.verdict)}
                  className="flex w-full min-w-0 items-center gap-3 text-left"
                >
                  {item.kind === "font" ? (
                    <span
                      className="w-10 shrink-0 text-lg leading-none"
                      style={{ fontFamily: item.family }}
                    >
                      Aa
                    </span>
                  ) : (
                    <span className="flex w-10 shrink-0 gap-0.5">
                      {item.samples.slice(0, 2).map((name) => (
                        <SetGlyphs
                          key={name}
                          prefix={item.iconKey}
                          names={[name]}
                          size={16}
                          color={LIGHT_INK}
                        />
                      ))}
                    </span>
                  )}
                  <span
                    className="truncate"
                    style={item.kind === "font" ? { fontFamily: item.family } : undefined}
                  >
                    {item.name}
                  </span>
                </button>
              </td>
              <td className="hidden px-3 @md:table-cell">
                <VerdictBadge verdict={item.verdict} />
              </td>
              <td className="px-3 whitespace-nowrap">
                <ScoreBadge asset={item} />
              </td>
              <td className="hidden px-3 whitespace-nowrap @3xl:table-cell">
                <StatusText asset={item} />
              </td>
              <td className="hidden px-3 text-xs whitespace-nowrap text-muted @2xl:table-cell">
                {item.style || "—"}
              </td>
              <td className="hidden px-3 text-xs whitespace-nowrap text-muted @xl:table-cell">
                {item.license || "—"}
              </td>
              <td className="hidden max-w-40 truncate px-3 text-xs text-muted @4xl:table-cell">
                {item.tags.join(", ") || "—"}
              </td>
              <td className="hidden px-3 text-xs whitespace-nowrap text-muted tabular-nums @5xl:table-cell">
                {formatDate(item.modifiedAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
