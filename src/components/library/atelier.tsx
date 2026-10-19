import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/library/command-palette";
import { Inspector } from "@/components/library/inspector/inspector";
import { isMacPlatform, useMediaQuery } from "@/components/library/shared/use-media-query";
import { Sidebar } from "@/components/library/sidebar/sidebar";
import { Workspace } from "@/components/library/workspace/workspace";
import { TooltipProvider } from "@/components/ui/tooltip";
import { close, focusPaneAt, navigate, split } from "@/lib/library/commands";
import { matchShortcut, type Command } from "@/lib/library/shortcuts";
import { useLibrary } from "@/lib/library/store";
import { useWorkspace } from "@/lib/library/workspace";
import { assetIdOf } from "@/lib/library/workspace-model";

/** Widgets that use the arrow keys themselves. */
const ARROW_WIDGETS =
  "input, textarea, select, [contenteditable=true], [role=radiogroup], [role=tablist], [role=toolbar], [role=menu], [role=listbox], [role=slider], [role=separator], [role=group], [role=dialog]";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest("input, textarea, select, [contenteditable=true]");
}

function runShortcut(command: Command) {
  const state = useWorkspace.getState();
  const pane = state.panes[state.activePaneId];
  if (!pane) return;
  const assetId = assetIdOf(pane.active);
  switch (command.type) {
    case "splitRight":
      return split(pane.id, "right");
    case "splitDown":
      return split(pane.id, "bottom");
    case "closeTab":
      return close(pane.id, pane.active);
    case "focusPane":
      return focusPaneAt(command.index);
    case "prev":
    case "next":
      if (assetId) navigate(pane.id, assetId, command.type === "prev" ? -1 : 1);
      return;
  }
}

/**
 * The app shell: library sidebar, the workspace of panes, and the inspector.
 * Both stores live in localStorage, so nothing renders until they are read;
 * the server and the first client paint show the same empty frame.
 */
export function Atelier() {
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
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

  useEffect(() => {
    if (!ready) return;
    const mac = isMacPlatform();
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      const command = matchShortcut(event, mac);
      if (!command) return;
      if (command.type === "quickOpen") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      const target = event.target instanceof HTMLElement ? event.target : null;
      const arrows = command.type === "prev" || command.type === "next";
      if (arrows ? target?.closest(ARROW_WIDGETS) : isTyping(target)) return;
      event.preventDefault();
      runShortcut(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ready]);

  useEffect(() => {
    if (!navOpen) return;
    // A menu or dialog open inside the bar takes Escape first (Radix marks it as handled).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  if (!ready) return <ShellFrame />;

  const closeNav = () => setNavOpen(false);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-dvh overflow-hidden bg-bg text-fg">
        <Sidebar
          open={navOpen}
          onClose={closeNav}
          onNavigate={closeNav}
          onQuickOpen={() => {
            setNavOpen(false);
            setPaletteOpen(true);
          }}
        />
        {navOpen ? (
          // Clicking outside, Escape, or choosing a view or item closes it.
          <div
            aria-hidden
            className="fixed inset-0 z-20 bg-ink/70 min-[860px]:hidden"
            onClick={closeNav}
          />
        ) : null}
        {/* Under the drawer the page is out of reach, as behind a modal dialog. */}
        <main inert={navOpen && !wide} className="flex min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <Workspace onOpenNav={() => setNavOpen(true)} />
          </div>
          <Inspector />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
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
