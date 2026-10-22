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

## Update 2026-10-21 — design-system page is now DRAFTED, not deferred

The live `/design-system` half of article 2164 left Goal A by token-budget split.
It is no longer loose deferred work: it lives as
`.a0proj/_bmad-output/implementation-artifacts/spec-atelier-design-system-page.md`
with `status: draft`, awaiting CHECKPOINT 1 approval.

Pick it up **before Goal B** (it gives B a live reference to build against) or
after, human's choice. This entry stays only to record that ordering choice is open.

## 2026-10-21 — B1 and B2 split out of Goal B (human decision, step-01)

Goal B was split at step-01. **B3 (visible interface reformulation)** proceeds now as
`spec-atelier-interface-reformulation.md`. The two below are follow-ups.

### B1 — View types as pane content (article 2165, binding (b))

**Why deferred:** the locked scope said "keep the shell, add view types", but
`src/lib/library/workspace-model.ts:49` defines
`TabKey = "collection" | \`asset:${id}\`` and `:118` validates with
`value === "collection" || /^asset:.+/`. A fourth kind cannot exist without editing
that file. "Keep the shell, add views" is structurally "keep the shell, edit the model".

**Scope when picked up:** minimal `TabKey` extension (new kind + validator + migration
tolerance in `migrateWorkspace`), no layout or `MAX_PANES` change. Then the four view
types from `docs/steering/vistas-de-trabalho.md` as pane content: diagram, stepped
walkthrough, before/after review, live design system.

### B2 — Process disclosure (article 2142, binding (c))

**Why deferred:** Atelier has no agent-run surface. `/api/parecidas` is a server/MCP
endpoint and no component renders suggestions; the only trace is
`import-dialog.tsx:148` ("Adicionar sugestões"). There is nothing to disclose.

**Scope when picked up:** only if Atelier starts rendering agent work. The rule in
`docs/steering/revelar-o-processo.md` stays as written, with a note added by B3 saying
it has no applicable surface today.

## 2026-10-22 — Diagram and stepped walkthrough deferred out of B1

Human decision at B1 step-01: ship only the two views Atelier has data for
(`antes e depois`, `sistema de design`). These two are deferred because
**sem dados no Atelier ainda**:

- **Diagrama** — there is no plan model, no agent output, nothing to draw. A pane
  would render invented boxes.
- **Passo a passo** — there are no stages to step through; it depends on the diagram.

**Resume when:** Atelier gains a plan/diagram model (e.g. an agent proposes a change
set). Both are already named in `docs/steering/vistas-de-trabalho.md`, which now marks
them as lacking data.

## 2026-10-22 — Test-runner timeout and cancellation policy

Deferred at step-04 of `spec-atelier-test-wiring.md`: a test holding an active
interval can keep a worker alive indefinitely and prevent the later group from
starting. This limitation also exists in the native baseline; the approved spec
sets no deadline. The new runner handles finite failing, crashing and cancelled
paths, but does not bound indefinitely live workers. No arbitrary timeout added.

**Follow-up:** agree on per-file/group deadlines, cancellation and worker cleanup,
then test bounded termination, retained diagnostics and subsequent-group execution
with live-handle fixtures before implementing that policy.
