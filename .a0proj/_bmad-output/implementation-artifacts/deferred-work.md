# Deferred work

## 2026-10-21 — Atelier interface reformulation (Goal B of the LukeW steering intent)

Deferred from `spec-atelier-steering-layer.md` at step-01 multi-goal split. Human decision: **[S] Split — Goal A first**.

**Source:** five LukeW articles, downloaded to `/tmp/lukew/` — `2165-many-agents-many-views.md`, `2142-showing-the-work-of-agents-in-ui.md`, `2164-design-systems-for-ai-agents.md`, `2153-collaborative-steering.md`, `2146-consistent-character-maker-update.md`. Origin tweet: https://x.com/lukew/status/2112610747792662815

**Scope locked by the human — do not re-litigate when planning B:**

- **Boundary (b):** app shell — `src/components/library/atelier.tsx`, `sidebar/sidebar.tsx`, `workspace/*` (`workspace.tsx`, `pane.tsx`, `tab-strip.tsx`), `inspector/inspector.tsx` — plus `browser/collection.tsx` and `command-palette.tsx`.
- **Excluded:** specimen pages (`font-specimen`, `icon-specimen`, `face-icon`) and `docs/ds/componentes/*`. Rewriting specimens is a separate project and would double the diff.
- **Article 2165 binding = (a):** keep the fixed shell (`w-64` sidebar with `<860px` drawer, `react-resizable-panels` split tree, fixed `INSPECTOR_WIDTH` right column). Add **view types** as pane content: diagram, stepped walkthrough, before/after visual review, live design system. **No** rewrite of `src/lib/library/workspace-model.ts`, no changes to its migrations or `MAX_PANES`.

**Coupling note:** plan B only after Goal A merges, so the B spec cites `AGENTS.md` and `docs/steering/*` instead of re-deriving the rules. Article 2146's lesson applies directly — the guardrails shipped in A get exactly one tightening pass driven by B's real usage, then they stop being hypotheses.

**Known context for B:** the shell today is `docs/steering/`-less and `AGENTS.md`-less; Goal A creates both. `npm test` already fails when `docs/ds/` falls behind the code, so any B work touching tokens must run `npm run ds:gerar`.
