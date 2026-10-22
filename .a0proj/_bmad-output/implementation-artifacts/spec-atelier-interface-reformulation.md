---
title: 'Reformulate the Atelier interface on the steering rules'
type: 'feature'
created: '2026-10-21'
status: 'ready-for-dev'
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The steering rules shipped, but the interface does not yet look or speak like them: the shell never says "view", headers and empty states are unremarkable, and the allowlist still carries four debts inside files this work touches anyway.

**Approach:** A visible reformulation of shell, collection and palette — clearer hierarchy, a tab strip that speaks in views, better headers and empty states — plus paying down the four in-scope `PERMITIDOS` entries and deleting them. Structure stays: no `workspace-model.ts` change.

## Boundaries & Constraints

**Always:** Keep the fixed shell — `w-64` sidebar with `<860px` drawer, the `react-resizable-panels` tree, `INSPECTOR_WIDTH` column. Both viewports are part of the interface and must be verified. Every colour by `@theme` token name. `npm run ds:reuso` passes with four fewer allowlist entries.

**Ask First:** Any new token in `@theme`; any change to the `860px` breakpoint; any edit to `workspace-model.ts`.

**Never:** Edit `workspace-model.ts`, `MAX_PANES` or migrations. Widen `reuso.mjs` or touch the seven non-debt allowlist entries. Touch specimens or `docs/ds/componentes/*`. Commit the `/design-system` page.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|
| WIDE | viewport 1024x768 | sidebar as column, inspector as column, tab strip names a view | N/A |
| NARROW | viewport 368x640 | sidebar as drawer, inspector as modal, no horizontal overflow | N/A |
| EMPTY | a view with no items | empty state says what to do, in the new voice | N/A |
| PALETTE | `Cmd/Ctrl+K` | grouped commands, readable at 368px | N/A |

</frozen-after-approval>

## Code Map

- `src/components/library/atelier.tsx` — shell grid, drawer overlay, palette mounting; `min-[860px]:` variants live here
- `src/components/library/sidebar/sidebar.tsx` — 254 lines; `sidebar.tsx:111` carries `text-[15px]` (debt)
- `src/components/library/workspace/tab-strip.tsx` — renders tabs via `useTabLabel`; the place views get named
- `src/components/library/workspace/pane.tsx` — `PaneView`, `PaneMenu`, `PaneSwitcher`; header band per pane
- `src/components/library/browser/collection.tsx` — `collection.tsx:96-110` header band, view title, counts, `EmptyState` at 335
- `src/components/library/command-palette.tsx` — cmdk groups, `heading` class at 43, dialog at 124
- `src/components/library/import-dialog.tsx` — `312` carries `text-[15px]` (debt)
- `src/components/library/icons.tsx` — `23` carries `rounded-[3px]` and `text-[9px]` (debt)
- `src/components/library/browser/asset-card.tsx` — `11` local `#eceef2`; `shared/grounds.ts` already exports `CHROME_INK` for exactly this
- `scripts/ds/reuso.mjs` — `PERMITIDOS` entries to delete
- `docs/steering/revelar-o-processo.md` — gets the honest "no agent surface yet" note
- `docs/steering/vistas-de-trabalho.md` — the four view names this shell must echo

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/library/browser/asset-card.tsx` — import `CHROME_INK` from `shared/grounds.ts`, delete the local hex — pays the one in-scope hex
- [ ] `src/components/library/sidebar/sidebar.tsx` — `text-[15px]` to a scale class — pays debt
- [ ] `src/components/library/import-dialog.tsx` — `text-[15px]` to a scale class — pays debt
- [ ] `src/components/library/icons.tsx` — `rounded-[3px]`/`text-[9px]` to scale classes — pays debt
- [ ] `scripts/ds/reuso.mjs` — delete those four `PERMITIDOS` entries — debt paid must stop being allowlisted
- [ ] `src/components/library/workspace/tab-strip.tsx` and `pane.tsx` — name the two kinds as views (Coleção / item) in tab labels and the pane switcher, so the shell speaks in views — 2165(a)
- [ ] `src/components/library/browser/collection.tsx` — reformulate the header band and `EmptyState`: clearer title, count, and an action — visible change
- [ ] `src/components/library/atelier.tsx` — reformulate shell spacing and the narrow drawer framing — visible change at both viewports
- [ ] `src/components/library/command-palette.tsx` — reformulate grouping and row density so it reads at 368px — visible change
- [ ] `docs/steering/revelar-o-processo.md` — add the note that Atelier has no agent-run surface yet — 2142(c)
- [ ] `src/styles.css` + `npm run ds:gerar` — only if a token is genuinely missing; regenerate after

**Acceptance Criteria:**
- Given 1024x768, when the app loads, then sidebar and inspector are columns and the tab strip names a view.
- Given 368x640, when the app loads, then the sidebar is a drawer, the inspector is a modal, and `document.documentElement.scrollWidth === clientWidth`.
- Given an empty view, when it renders, then an action is offered, not just a message.
- Given `npm run ds:reuso`, then it passes and reports 8 permitted files, not 12.
- Given `npm test`, then counts match the pre-existing baseline (85/82/3) and no new failure appears.

## Design Notes

Visible does not mean new tokens. The reformulation reuses the existing scale: `paper`/`mist`/`sand` for grounds, `proof` for state, `elevated` for hover. A new token would need a human decision, and the palette already covers what this pass needs.

The tab strip naming is the whole of 2165(a): no fourth `TabKey`, no model change. It is honest framing, not a new capability, and the follow-up spec (B1) is where real view types land.

`CHROME_INK` already exists for the icon-SVG case, so `asset-card.tsx` imports it instead of redeclaring `#eceef2`. That removes a hex without adding an exemption.

## Verification

**Commands:**
- `npm run ds:reuso` — passes, 8 files permitted
- `npm test` — 85/82/3, the same three pre-existing failures
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 errors
- `npm run ds:gerar -- --check` — `em dia`

**Manual checks — two viewports, with screenshots:**
- Start the dev server with `.claude/skills/atelier-iteracao/scripts/server.sh start 8080`.
- Playwright is installed (`node_modules/.bin/playwright`). Capture `/` at **1024x768** and at **368x640**, plus the drawer open at 368 wide and the palette open at 368 wide.
- At 368: no horizontal scroll; drawer overlays; inspector opens as a modal.
- At 1024: both columns visible; tab strip label reads as a view.
- If the server cannot start in this container, say so in the report and mark visual verification **not performed** rather than claiming it.
