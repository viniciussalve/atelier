import { PanelRightClose } from "lucide-react";
import { Scorecard } from "@/components/library/evaluation/scorecard";
import { IconButton } from "@/components/ui/icon-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveAsset } from "@/lib/library/hooks";
import { useWorkspace, type InspectorTab } from "@/lib/library/workspace";
import { cn } from "@/lib/utils";
import { Details } from "./details";

/**
 * The evaluation and details of the item in the active pane. A column on wide
 * screens, a drawer on narrow ones; hidden while the collection is in front.
 */
export function Inspector() {
  const asset = useActiveAsset();
  const wide = useWorkspace((state) => state.canSplit);
  const open = useWorkspace((state) =>
    state.canSplit ? state.inspectorOpen : state.inspectorDrawer,
  );
  const tab = useWorkspace((state) => state.inspectorTab);
  const setTab = useWorkspace((state) => state.setInspectorTab);
  const setOpen = useWorkspace((state) => state.setInspector);
  if (!asset || !open) return null;

  return (
    <>
      {!wide ? (
        <button
          type="button"
          aria-label="Fechar o inspetor"
          className="fixed inset-0 z-30 bg-ink/70"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        aria-label={`Inspetor de ${asset.name}`}
        className={cn(
          "flex min-h-0 flex-col border-l border-border bg-surface",
          wide ? "w-80 shrink-0" : "fixed inset-y-0 right-0 z-40 w-[min(22rem,100vw)]",
        )}
      >
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as InspectorTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-center gap-2 border-b border-border pr-1 pl-3">
            <TabsList aria-label="Seções do inspetor">
              <TabsTrigger value="avaliacao">Avaliação</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            </TabsList>
            <IconButton
              label="Fechar o inspetor"
              size="sm"
              className="ml-auto"
              onClick={() => setOpen(false)}
            >
              <PanelRightClose className="size-4" />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <p className="mb-4 truncate text-sm text-muted">{asset.name}</p>
            <TabsContent value="avaliacao">
              <Scorecard asset={asset} />
            </TabsContent>
            <TabsContent value="detalhes">
              <Details asset={asset} />
            </TabsContent>
          </div>
        </Tabs>
      </aside>
    </>
  );
}
