---
title: 'View types as pane content: before/after and live design system'
type: 'feature'
created: '2026-10-22'
status: 'done'
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Article 2165 says a view answers "how will this look?", but the shell has only two tab kinds — the collection and one asset. Comparison and the design system cannot be seen side by side with the thing being judged.

**Approach:** Two view kinds backed by data Atelier owns — **antes e depois** (one asset at two settings) and **sistema de design** (the live token page) — reachable from palette and pane menu. Diagram and walkthrough stay deferred: no data exists.

## Boundaries & Constraints

**Always:** `layout.ts`, `MAX_PANES` and split behaviour untouched. `ds:reuso` passes, allowlist still 8. Design-system body has one source shared by route and pane.

**Ask First:** A third view kind; any change to `DEFAULT_PANE_SETTINGS`; any new persisted field.

**Never:** Placeholder panes for diagram or walkthrough. Reset the workspace on an unknown kind. Hand-edit `docs/ds/**`, `routeTree.gen.ts`, `tokens.gen.ts`. Grow `PERMITIDOS`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|
| Antes e depois | font asset, fontSize 24 | two specimens: current settings and defaults | no asset → empty state naming the action |
| Sistema de design | any state | tokens + gallery inline in the pane | scrolls inside the pane |
| Stale tab | persisted `vista:diagrama` | tab dropped; pane falls back to `collection` | never fatal |
| Duplicate | view already in this pane | existing tab activated | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/library/workspace-model.ts` — `TabKey` (49), `isTabKey` (117), `sanitizeWorkspace` (652), `migrateWorkspace` (645)
- `src/lib/library/commands.ts` — `activate`/`pin`/`close` take `TabKey`; `openView` belongs here
- `src/components/library/workspace/pane.tsx` — render dispatch (96), `PaneMenu`
- `src/routes/design-system.tsx` — 138 lines; `DesignSystem` + `Gallery` are route-private
- `workspace-model.test.ts`, `migrate.test.ts` — existing coverage to extend

## Tasks & Acceptance

**Execution:**
- [ ] `workspace-model.ts` — add `type ViewKind = "antes-depois" | "sistema"`; extend `TabKey` with `` `vista:${ViewKind}` ``; add `viewKey(kind)`/`viewKindOf(key)` beside `assetKey`/`assetIdOf`; extend `isTabKey` to `/^vista:(antes-depois|sistema)$/` — nothing looser
- [ ] `workspace-model.ts` — no version bump: `TabKey` only accepts more values, so old data stays valid. Verify `sanitizeWorkspace` accepts the new kinds and still drops unknown ones
- [ ] `workspace-model.test.ts` — pin `isTabKey` accepts both kinds and rejects `vista:diagrama`/`vista:`; pin `sanitizeWorkspace` drops an unknown kind, keeps a pane whose other tabs survive, falls back to `collection` when the list empties
- [ ] `migrate.test.ts` — pin a v2 workspace containing a new kind opens intact, and one containing an unknown kind is tolerated
- [ ] `commands.ts` — `openView(paneId, kind)`: activate if the pane already has the tab, else `openTab`
- [ ] `views/design-system-view.tsx` — move `DesignSystem` body and `Gallery` here as `DesignSystemView`, **including its explanatory header**
- [ ] `routes/design-system.tsx` — thin route importing `DesignSystemView`; keeps only its page `<main>` padding
- [ ] `views/before-after-view.tsx` — left is the pane's current `settings`, right is `DEFAULT_PANE_SETTINGS`; each column headed with the size it shows; no asset open → empty state
- [ ] `pane.tsx` — dispatch `vista:*` to the views before the asset/collection fallback; add "Abrir vista" submenu to `PaneMenu`
- [ ] `command-palette.tsx` — two `Action` entries calling `openView` on the active pane
- [ ] `labels.ts` + `use-tab-label.ts` — label both kinds ("Antes e depois", "Sistema de design")
- [ ] `tab-strip.tsx` — kind as visible text via `min-[860px]:inline`, accessible-only below
- [ ] `docs/steering/vistas-de-trabalho.md` — keep the rule; mark diagram and walkthrough "ainda sem dados no Atelier"

**Acceptance Criteria:**
- Given a font asset open, when "Antes e depois" opens, then two specimens render — current and defaults — readable at 368×1000.
- Given any pane, when "Sistema de design" opens, then tokens and gallery render inside it, from the same component the route uses.
- Given persisted `vista:diagrama`, when the app loads, then that tab is dropped and the pane still shows `collection`.
- Given `ds:reuso`, then it passes with 8 files allowed.
- Given `npm test`, then only the 3 known `with-app-env` failures appear.

## Design Notes

**Which two settings?** Current `PaneSettings` versus `DEFAULT_PANE_SETTINGS`. Deterministic, no new persisted field, and it answers the real question. "Last pinned state" would need a second stored settings object — new state for a speculative feature.

**Why the header moves:** if the pane showed only the token list, route and pane could drift. One component ships the explanation wherever the tokens go.

## Verification

`npm test` (3 known failures), `typecheck`, `lint`, `ds:reuso` (8), `ds:gerar -- --check`.

Manual, 368×1000 and 1024×768, screenshot of each view: open an asset, open each view from the palette, confirm `scrollWidth === clientWidth`. If the server will not start, report **visual verification not performed**.


## Spec Change Log

### 2026-10-22 — defect found by the DOM proof, fixed

- **Triggering evidence:** the browser round-trip printed the tab as
  `"Antes e depoisAntes e depois"`. The kind chip and the tab label are the same
  words for a view tab, so the strip repeated itself.
- **Amended:** `tab-strip.tsx` renders the kind chip only when it differs from the
  label. No frozen criterion changed; AC-1 (a tab names its view) is met once, not twice.
- **Known-bad state avoided:** a four-kind strip where two of four tabs stutter.

### 2026-10-22 — verification method

`npm test` runs the `.mjs` suite first with `&&`; those 3 failures short-circuit, so
`src/lib/library/*.test.ts` **never executes** in this container — and the bundled
Node lacks TypeScript support (`ERR_NO_TYPESCRIPT`). The TS suites were therefore
run through the project's own `typescript` compiler into a temp dir and executed
with `node --test`: **70 tests, 70 pass**. Report this limitation; do not claim
`npm test` covered the TypeScript files.
