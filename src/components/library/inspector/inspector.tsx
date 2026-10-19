import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { PanelRightClose } from "lucide-react";
import { Scorecard } from "@/components/library/evaluation/scorecard";
import { IconButton } from "@/components/ui/icon-button";
import { useSteadyWhilePressed } from "@/components/library/shared/use-steady-while-pressed";
import { useActiveAsset, useAsset } from "@/lib/library/hooks";
import { useWorkspace } from "@/lib/library/workspace";
import type { Asset } from "@/lib/library/types";
import { INSPECTOR_WIDTH } from "@/lib/library/workspace-model";
import { Details } from "./details";

/**
 * The evaluation and details of the item in the active pane. A column on wide
 * screens, a modal drawer on narrow ones; hidden while the collection is in front.
 */
export function Inspector() {
  const wide = useWorkspace((state) => state.canSplit);
  // As a column the inspector resizes the panes. A press that makes another pane
  // active would show or hide it under the pointer, and the click would miss.
  const asset = useAsset(useSteadyWhilePressed(useActiveAsset()?.id ?? null, wide));
  const open = useWorkspace((state) =>
    state.canSplit ? state.inspectorOpen : state.inspectorDrawer,
  );
  const setOpen = useWorkspace((state) => state.setInspector);
  // The button that opened the drawer lives elsewhere (it is no Dialog.Trigger), so
  // remember it to give focus back on close; Radix would otherwise leave it on the page.
  const opener = useRef<HTMLElement | null>(null);
  if (!asset || !open) return null;

  const label = `Inspetor de ${asset.name}`;
  if (wide) {
    return (
      <aside
        aria-label={label}
        style={{ width: INSPECTOR_WIDTH }}
        className="flex min-h-0 shrink-0 flex-col border-l border-border bg-surface"
      >
        <InspectorBody asset={asset} onClose={() => setOpen(false)} />
      </aside>
    );
  }

  // Over the app, it is a dialog: focus stays inside, the rest is hidden from
  // assistive technology, and Escape or a click outside closes it (a menu or
  // popover inside closes first).
  return (
    <Dialog.Root open onOpenChange={(next) => setOpen(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-ink/70" />
        <Dialog.Content
          asChild
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <aside
            aria-label={label}
            className="fixed inset-y-0 right-0 z-40 flex w-[min(22rem,100vw)] min-h-0 flex-col border-l border-border bg-surface outline-none"
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            <InspectorBody asset={asset} onClose={() => setOpen(false)} />
          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InspectorBody({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 items-center gap-2 border-b border-border pr-1 pl-4">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{asset.name}</p>
        <IconButton label="Fechar o inspetor" size="sm" onClick={onClose}>
          <PanelRightClose className="size-4" />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-4">
        <Scorecard key={`placar-${asset.id}`} asset={asset} />
        <Details key={`detalhes-${asset.id}`} asset={asset} />
      </div>
    </div>
  );
}
