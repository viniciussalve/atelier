---
title: 'Steering layer for Atelier agents'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '7f48e17'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing at the repository root tells an agent to reuse Atelier's tokens, and nothing fails when a component hardcodes a hex, a Tailwind palette colour or an arbitrary px. The design rules exist but live out of the way, so each agent invents its own.

**Approach:** Ship the steering layer, not the UI. A short English `AGENTS.md` at the root, five Portuguese rule files under `docs/steering/`, and a `ds:` check that fails the suite on hardcoded colour and px (with a small, deliberate allowlist). The live `/design-system` route was split out by human decision into `spec-atelier-design-system-page.md`.

## Boundaries & Constraints

**Always:** Every colour comes from `src/styles.css` `@theme`, by token name. Steering docs in Portuguese, `AGENTS.md` in English — never mix languages inside one file. Each rule file carries a "Regra" and a "Como verificar". Generated files (`docs/ds/**`, `src/routeTree.gen.ts`, `src/lib/ds/tokens.gen.ts`) are read-only to humans and agents alike.

**Ask First:** Any new entry in the check's allowlist; any change to what the check flags; any edit to `grounds.ts`, `face-icon.tsx` or `error-component.tsx` beyond allowlisting them.

**Never:** Fix components to satisfy the check — it reports, this spec does not touch the shell (that is Goal B). Hand-edit `docs/ds/tokens.md` or `routeTree.gen.ts`. Paste article prose into `AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | a `src/**/*.tsx` file using only token classes | no violation | N/A |
| HEX_LITERAL | `#93cfe4` in a class or inline style of an unlisted file | violation naming file and line | exit 1, list to stderr |
| PALETTE_COLOUR | `bg-zinc-900`, `text-red-500` | violation | exit 1 |
| ARBITRARY_PX | `w-[137px]` | violation | exit 1 |
| ALLOWLISTED | hex inside `shared/grounds.ts` | no violation | N/A |
| GENERATED | `routeTree.gen.ts`, `*.gen.ts` | skipped | N/A |

</frozen-after-approval>

## Code Map

- `src/styles.css` — the only token source: 21 colours, 2 fonts, 3 radii inside `@theme`
- `scripts/ds/tokens.mjs` — `lerTokensCss(css)` already parses `@theme`; reuse it, never re-parse
- `scripts/ds/gerar.mjs` — `gerarDocs()` builds a path→content map, `diferencas()` drives `--check`; extend it, don't fork it
- `scripts/ds/gerar.test.mjs` — style reference: `node:test`, `assert/strict`, tmpdir copy of the repo
- `scripts/ds/raiz.mjs` — exports `RAIZ`
- `scripts/ds/componentes.mjs` — `PASTAS` (`ui`, `library`) and `extrairComponentes`, which runs a full TS program; too heavy for a page render
- `package.json` — `ds:gerar`, `ds:check`, `ds:validar`, `ds:avaliar`; `test` runs `node --test 'scripts/**/*.test.mjs'`
- `src/routes/index.tsx` — minimal page route: `createFileRoute("/")({ component })`
- `.claude/skills/atelier-iteracao/references/design.md` — existing design rules; steering docs cite it rather than restate it
- `src/components/library/shared/grounds.ts` — 2 hex constants mirroring `fg`/`paper-fg` for Iconify SVGs
- `src/components/ui/face-icon.tsx` — `#fff`/`#000` as SVG mask paint
- `src/lib/error-component.tsx` — the only file using Tailwind palette utilities (7); it renders before the theme loads

## Tasks & Acceptance

**Execution:**
- [x] `docs/steering/contexto-compartilhado.md` — steering is team-owned and project-level; an agent edits the shared context instead of inventing a point of view — article 2153; include the three places context hides today (agent md, skills, memory)
- [x] `docs/steering/revelar-o-processo.md` — agent work shows as one line, expandable to detail; process is the progress indicator, never a bare spinner — article 2142
- [x] `docs/steering/vistas-de-trabalho.md` — views are pane content and the shell stays fixed; name the four view types for Goal B (diagram, stepped walkthrough, before/after review, live design system) — article 2165
- [x] `docs/steering/sistema-de-design-como-direcao.md` — reuse tokens and existing components; `docs/ds/` is the reference; no new hex or px — article 2164
- [x] `docs/steering/ciclos-de-verificacao.md` — a cheap structural check beats per-item visual review; tighten guardrails from real usage, starting broad — article 2146
- [x] `AGENTS.md` — root, English, 49 lines: reuse tokens, read `docs/steering/` in filename order, run the `ds:` commands, generated files are read-only — operational only
- [x] `scripts/ds/reuso.mjs` — export `violacoes(raiz)` and `PERMITIDOS` (path to written reason); scan `src/**/*.ts` and `*.tsx`, skip `*.gen.ts` and `routeTree.gen.ts`, flag hex, palette colour with shade, and `[...px]` — the enforcement
- [x] `scripts/ds/reuso.test.mjs` — one test per matrix row plus "the repository is clean" — same shape as `gerar.test.mjs`
- [x] `package.json` — add `"ds:reuso"` for manual runs; the existing `test` glob already picks the new test up
- [x] `AGENTS.md` — link each steering file and the `ds:` commands — discovery

**Acceptance Criteria:**
- Given a clean tree, when `npm test`, then every test passes, including the new `reuso` test.
- Given `#93cfe4` pasted into `src/components/library/inspector/inspector.tsx`, when `npm test`, then it fails naming that file and line.
- Given `bg-zinc-900` or `w-[137px]` in any `src` component, when `npm test`, then it fails on each.
- Given only `AGENTS.md`, when an agent reads it, then it knows to reuse tokens and can find the verification commands without opening an article.
- Given `docs/steering/` read in order, when finished, then all five cite a LukeW article and each states a check a person can perform.

## Design Notes

The check reports; it does not fix. Five hardcoded hex and 17 arbitrary px values already exist in `src`, and three files get a written allowlist rather than a refactor, because refactoring them is shell work belonging to Goal B. `error-component.tsx` is allowlisted for a real reason: it renders when the theme may not have loaded, so palette utilities are the correct choice there.

## Verification

**Commands:**
- `npm test` — all pass
- `npm run typecheck` — no errors
- `npm run lint` — clean
- `npm run ds:gerar -- --check` — reports `docs/ds/ em dia`
- `npm run ds:validar` — unchanged, exit 0
- `npm run ds:reuso` — reports no violations

- Read `AGENTS.md` cold: under two minutes to know where the rules are and how to verify.

## Suggested Review Order

**The rule, and why it is enforceable**

- Start at the allowlist: every entry is a written debt someone chose to tolerate.
  [`reuso.mjs:25`](../../../scripts/ds/reuso.mjs#L25)

- Three patterns, nothing else: hex, palette colour with shade, arbitrary px.
  [`reuso.mjs:44`](../../../scripts/ds/reuso.mjs#L44)

- Walk `src/`, skip generated files, report file + line instead of fixing.
  [`reuso.mjs:100`](../../../scripts/ds/reuso.mjs#L100)

**The steering layer agents read**

- The operational entry point: tokens, reading order, commands, read-only files.
  [`AGENTS.md:1`](../../../AGENTS.md#L1)

- The design rule that names both the reference and the failing command.
  [`sistema-de-design-como-direcao.md:1`](../../../docs/steering/sistema-de-design-como-direcao.md#L1)

- Where shared context lives, and the three places it currently hides.
  [`contexto-compartilhado.md:1`](../../../docs/steering/contexto-compartilhado.md#L1)

**Peripherals**

- One test per matrix row, plus the repository-is-clean assertion.
  [`reuso.test.mjs:21`](../../../scripts/ds/reuso.test.mjs#L21)

- One added script; the test glob already picks the new test up.
  [`package.json:25`](../../../package.json#L25)
