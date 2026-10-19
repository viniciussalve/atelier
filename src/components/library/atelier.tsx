import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CommandPalette } from "@/components/library/command-palette";
import { ImportDialog, type ImportRequest } from "@/components/library/import-dialog";
import { useAiLink } from "@/components/library/shared/ai-link";
import { copyDialogOpen } from "@/components/library/shared/copy";
import { CopyLayer } from "@/components/library/shared/copy-layer";
import { Inspector } from "@/components/library/inspector/inspector";
import { useLibraryFonts } from "@/components/library/shared/use-font-links";
import { isMacPlatform, useMediaQuery } from "@/components/library/shared/use-media-query";
import { Sidebar } from "@/components/library/sidebar/sidebar";
import { Workspace } from "@/components/library/workspace/workspace";
import { TooltipProvider } from "@/components/ui/tooltip";
import { parseAddList } from "@/lib/ai/additions";
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

/** `?adicionar=fonte:Inter,icones:lucide&motivo=…`, the link an AI writes with its suggestions. */
function linkedSuggestions(): ImportRequest | null {
  // Read raw: the router's search parsing would turn a numeric `motivo` into a number.
  const params = new URLSearchParams(window.location.search);
  const specs = parseAddList(params.get("adicionar") ?? "");
  if (specs.length === 0) return null;
  return { mode: "link", specs, reason: params.get("motivo")?.trim() ?? "" };
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
  const [adding, setAdding] = useState<ImportRequest | null>(null);
  // Shortcuts would act on the page behind the add dialog.
  const modal = useRef(false);
  useEffect(() => {
    modal.current = adding !== null;
  }, [adding]);
  const wide = useMediaQuery("(min-width: 860px)");
  const routerNavigate = useNavigate();
  useLibraryFonts();
  const aiLink = useAiLink();

  useEffect(() => {
    let alive = true;
    void (async () => {
      await useLibrary.persist.rehydrate();
      await useWorkspace.persist.rehydrate();
      const ids = new Set(useLibrary.getState().assets.map((item) => item.id));
      useWorkspace.getState().reconcile(ids);
      if (!alive) return;
      setAdding(linkedSuggestions());
      setReady(true);
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

  // The link did its job once read: reloading should not ask again.
  useEffect(() => {
    if (ready && new URLSearchParams(window.location.search).has("adicionar")) {
      void routerNavigate({ to: "/", search: {}, replace: true });
    }
  }, [ready, routerNavigate]);

  useEffect(() => {
    if (!ready) return;
    const mac = isMacPlatform();
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || modal.current || copyDialogOpen()) return;
      const command = matchShortcut(event, mac);
      if (!command) return;
      if (command.type === "quickOpen") {
        event.preventDefault();
        // Like the bar's own ⌘K button: what the palette opens must not land under the drawer.
        setNavOpen(false);
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
          aiLink={aiLink}
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
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAddItems={() => setAdding({ mode: "search", kind: useLibrary.getState().kind })}
        aiLink={aiLink}
      />
      <CopyLayer />
      <ImportDialog request={adding} onClose={() => setAdding(null)} />
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
