---
title: 'Live design-system page for Atelier'
type: 'feature'
created: '2026-10-21'
baseline_commit: 'c414a77'
status: 'done'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `docs/ds/` is a snapshot written at generate time. An agent asked to add a button reads a file that may be hours stale, and a person cannot see the tokens rendered. Neither can check the other's work at a glance.

**Approach:** Generate `src/lib/ds/tokens.gen.ts` from the same `@theme` block as the site, and render it at `/design-system`: every token with its swatch, value and class, plus a gallery of real components. One live view that agents and people read together.

## Boundaries & Constraints

**Always:** `src/styles.css` stays the only token source — the page imports generated data and never re-declares a value. The page is presentational: it renders tokens and existing components, it does not become a component library of its own. Generated files stay read-only to humans and agents.

**Ask First:** Any change to what `gerar.mjs` emits beyond the new file; any new dependency.

**Never:** Hand-edit `tokens.gen.ts`, `routeTree.gen.ts` or `docs/ds/**`. Duplicate a token value in JSX. Refactor the shell or any component to make the page look better — that is Goal B.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|
| HAPPY_PATH | `/design-system` | every `@theme` token, grouped, with value and class | N/A |
| STALE | `@theme` changed, no regenerate | `npm test` fails on `docs/ds/` and `tokens.gen.ts` | exit 1, names both |
| NEW_TOKEN | a colour added to `@theme` | appears on the page after `ds:gerar`, no code edit | N/A |

</frozen-after-approval>

## Code Map

- `scripts/ds/tokens.mjs` — `lerTokensCss(css)` returns `{nome, grupo, valor, nota, classe}`; the page's data source
- `scripts/ds/gerar.mjs` — `gerarDocs()` path→content map; `diferencas()` drives `--check`; add the new file here so `--check` covers it
- `scripts/ds/gerar.test.mjs` — asserts `diferencas()` is empty; inherits coverage automatically
- `src/styles.css` — `@theme` with 21 colours, 2 fonts, 3 radii
- `src/routes/index.tsx` — route shape: `createFileRoute("/")({ component })`
- `src/components/ui/face-icon.tsx`, `segmented.tsx`, `icon-button.tsx` — real components for the gallery
- `eslint.config.mjs:17` — ignores generated files; `tokens.gen.ts` must be added
- `.prettierignore` — same, for `format`
- `docs/steering/sistema-de-design-como-direcao.md` — the rule this page serves

## Tasks & Acceptance

**Execution:**
    - [x] `scripts/ds/gerar.mjs` — emit `src/lib/ds/tokens.gen.ts` from `lerTokensCss` as a typed export (`Token[]`, `as const`) — one source for page and docs, and `--check` then guards the page
    - [x] `src/lib/ds/tokens.gen.ts` — generated only; no hand edits
    - [x] `eslint.config.mjs` — add the new file beside `src/routeTree.gen.ts` — generated code is not linted
    - [x] `.prettierignore` — same — formatting must not rewrite generated output
    - [x] `src/routes/design-system.tsx` — group tokens by `grupo`; colours as a swatch painted from the token class, with name, value and class text; fonts and radii as sample text; a gallery rendering `FaceIcon`, `Segmented` and `IconButton` — the live view
    - [x] `src/routeTree.gen.ts` — regenerate through the normal dev/build path; never hand-edited
    - [x] `AGENTS.md` — point the design-system rule at `/design-system` as the live reference — discovery

**Acceptance Criteria:**
- Given `src/styles.css` with 21 colours, when `/design-system` renders, then 21 colours appear, each painted by its own token class.
- Given a colour added to `@theme` and `npm run ds:gerar`, when the page reloads, then the new token appears with no code edit.
- Given `npm run ds:gerar -- --check` after a hand edit of `tokens.gen.ts`, then it fails naming that file.
- Given `npm test`, then `docs/ds/` and `tokens.gen.ts` are both in sync.
- Given the page, when `npm run ds:reuso` runs, then it passes — the page uses classes, not hex.

## Spec Change Log

**2026-10-21 — loopback avoided, Design Notes corrected (bad_spec)**

- **Triggering finding:** the human-requested canary — rename `--color-proof` to `--color-proof-x`, run `ds:gerar`, then `typecheck` — did **not** fail. The spec's Design Notes claimed a rename would "break the build". That claim was false, and it was written by me before measuring.
- **Amended (non-frozen section only):** Design Notes now state (a) swatches paint via `var(--token)` rather than the generated class, because Tailwind only emits statically detected classes; (b) what the guard actually catches — rename **without** regenerating fails `ds:gerar -- --check` and `npm test`, rename **with** regenerating correctly passes.
- **Known-bad state avoided:** a spec asserting a protection that does not exist. A future agent reading the old text would have trusted `typecheck` to catch a stale token page; it does not.
- **KEEP:** the generated `tokens.gen.ts` + `--check` coupling (it is the only real guard, proven to fail on a hand edit and on a stale rename); the `eslint`/`.prettierignore` entries; the no-literals-in-JSX rule.

## Design Notes

No value is written in the page: a swatch is painted with `var(--color-proof)`, never a literal, so the stylesheet stays the only place a colour exists. The value rides as a CSS variable rather than the generated Tailwind class because Tailwind only emits classes it finds statically in source; a class name built at render time from generated data may not exist in the built CSS, and the swatch would silently render empty. `docs/ds/tokens.md` keeps its Markdown table for reading; `tokens.gen.ts` exists for rendering. Both derive from the same `lerTokensCss` call, so they cannot disagree.

What the guard actually catches, measured rather than assumed: renaming a token in `@theme` **without** regenerating fails `ds:gerar -- --check` and `npm test`, naming both `docs/ds/tokens.md` and `src/lib/ds/tokens.gen.ts`, which is the stale case that would otherwise paint nothing. Renaming **and** regenerating correctly passes — that is a legitimate change, and the page follows the source. Type checking does not catch either case, so `--check` is the only honest guard.

`componentes.mjs` runs a full TypeScript program and is far too heavy to import from a route. The gallery therefore imports a fixed handful of `ui/*` components directly — chosen by hand, checked by the type checker.

## Verification

**Commands:**
- `npm run ds:gerar` — writes `docs/ds/` and `tokens.gen.ts`
- `npm run ds:gerar -- --check` — `em dia`
- `npm test` — all pass
- `npm run typecheck` — no errors
- `npm run lint` — clean, generated file ignored
- `npm run ds:reuso` — no violations

**Manual checks:**
- Open `/design-system`: every swatch matches the shell, and none is a copied literal.

## Suggested Review Order

**The generator, where truth is produced**

- Tokens become TypeScript beside the Markdown table, from one parse.
  [`tokens.mjs:94`](../../../scripts/ds/tokens.mjs#L94)

- The new file joins the generated map, so `--check` guards the page.
  [`gerar.mjs:34`](../../../scripts/ds/gerar.mjs#L34)

**The page, where truth is shown**

- Swatch painted by CSS variable: no literal can drift from the stylesheet.
  [`design-system.tsx:19`](../../../src/routes/design-system.tsx#L19)

- Real components in the gallery, not screenshots of them.
  [`design-system.tsx:98`](../../../src/routes/design-system.tsx#L98)

**Build hygiene**

- Generated TS is ignored by lint, or the two would fight.
  [`eslint.config.mjs:18`](../../../eslint.config.mjs#L18)

- Same for formatting.
  [`.prettierignore:2`](../../../.prettierignore#L2)

- The rule now points at the live view agents can inspect.
  [`AGENTS.md:16`](../../../AGENTS.md#L16)
