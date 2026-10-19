import { useEffect, useState } from "react";
import { Inspector } from "@/components/library/inspector/inspector";
import { useMediaQuery } from "@/components/library/shared/use-media-query";
import { Sidebar } from "@/components/library/sidebar/sidebar";
import { Workspace } from "@/components/library/workspace/workspace";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLibrary } from "@/lib/library/store";
import { useWorkspace } from "@/lib/library/workspace";

/**
 * The app shell: library sidebar, the workspace of panes, and the inspector.
 * Both stores live in localStorage, so nothing renders until they are read;
 * the server and the first client paint show the same empty frame.
 */
export function Atelier() {
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const wide = useMediaQuery("(min-width: 860px)");

  useEffect(() => {
    let alive = true;
    void (async () => {
      await useLibrary.persist.rehydrate();
      await useWorkspace.persist.rehydrate();
      const ids = new Set(useLibrary.getState().assets.map((item) => item.id));
      useWorkspace.getState().reconcile(ids);
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Only after rehydrating: any write before that would persist the defaults
  // over the saved workspace.
  useEffect(() => {
    if (ready) useWorkspace.getState().setCanSplit(wide);
  }, [ready, wide]);

  if (!ready) return <ShellFrame />;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-dvh overflow-hidden bg-bg text-fg">
        <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
        {navOpen ? (
          <button
            type="button"
            aria-label="Fechar a barra"
            className="fixed inset-0 z-20 bg-ink/70 min-[860px]:hidden"
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        <main className="flex min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <Workspace onOpenNav={() => setNavOpen(true)} />
          </div>
          <Inspector />
        </main>
      </div>
    </TooltipProvider>
  );
}

function ShellFrame() {
  return (
    <div className="flex h-dvh bg-bg" aria-busy="true">
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface min-[860px]:block" />
      <div className="flex-1">
        <div className="h-9 border-b border-border bg-surface" />
      </div>
    </div>
  );
}
