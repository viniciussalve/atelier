import { Search } from "lucide-react";
import { SetGlyphs } from "@/components/library/icons";
import { VerdictBadge } from "@/components/library/evaluation/badges";
import { PAPER_INK } from "@/components/library/shared/grounds";
import { itemCount, viewTitle } from "@/components/library/shared/labels";
import { openItem } from "@/lib/library/commands";
import { useCollection } from "@/lib/library/hooks";
import { useLibrary } from "@/lib/library/store";
import { useWorkspace } from "@/lib/library/workspace";

export function Collection({ paneId }: { paneId: string }) {
  const kind = useLibrary((state) => state.kind);
  const nav = useLibrary((state) => state.nav[state.kind]);
  const folders = useLibrary((state) => state.folders);
  const setQuery = useLibrary((state) => state.setQuery);
  const setDrag = useWorkspace((state) => state.setDrag);
  const { list, total } = useCollection(kind);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium">{viewTitle(nav.view, folders, kind)}</h1>
          <p className="text-xs text-muted tabular-nums">
            {list.length === total ? itemCount(total, kind) : `${list.length} de ${total}`}
          </p>
        </div>
        <label className="ml-auto flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-surface px-2 focus-within:border-proof/60">
          <Search className="size-3.5 text-subtle" />
          <input
            value={nav.query}
            onChange={(event) => setQuery(kind, event.target.value)}
            placeholder="Nome, tag, nota ou pasta"
            aria-label="Buscar na coleção"
            className="w-full bg-transparent text-sm outline-none placeholder:text-subtle"
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {list.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-sm font-medium">Nada nesta vista</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Troque de vista na barra ou limpe a busca.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
            {list.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/asset-id", item.id);
                  setDrag({ type: "asset", assetId: item.id });
                }}
                onDragEnd={() => setDrag(null)}
                onClick={(event) =>
                  openItem(item.id, event.metaKey || event.ctrlKey ? "side" : "preview", paneId)
                }
                onDoubleClick={() => openItem(item.id, "pin", paneId)}
                className="overflow-hidden rounded-lg border border-border bg-surface text-left hover:border-muted"
              >
                <div
                  className={
                    "grid h-28 place-items-center " +
                    (item.kind === "font" ? "bg-elevated" : "bg-paper")
                  }
                >
                  {item.kind === "font" ? (
                    <span className="text-3xl font-medium" style={{ fontFamily: item.family }}>
                      Aa
                    </span>
                  ) : (
                    <SetGlyphs
                      prefix={item.iconKey}
                      names={item.samples.slice(0, 4)}
                      size={22}
                      color={PAPER_INK}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</p>
                  <VerdictBadge verdict={item.verdict} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
