# Atelier — instructions for agents

Atelier is a board for judging design artifacts. Read `README.md` for what the app
does. This file is the steering layer: what to do before writing UI code.

## Reuse the design system

- Every colour comes from the `@theme` block in `src/styles.css`, by token name.
  Use `bg-surface`, `text-muted`, `border-border`, `text-proof`. Never a hex.
- Never a Tailwind palette colour (`bg-zinc-900`, `text-red-500`) and never an
  arbitrary measure (`w-[137px]`). Use the scale, or add a token.
- Reuse the component that already exists. Add a variant to it instead of writing
  a second component.
- `docs/ds/tokens.md` and `docs/ds/componentes/*.md` are generated from the code.
  Read them; never edit them. Change the code, then run `npm run ds:gerar`.
- `/design-system` is the same system rendered live: every token with its swatch,
  value and class, plus real components. Read it when you need to see a token,
  not just its name. It is generated from `src/styles.css`; it cannot go stale.
- Finer visual rules (layout, copy, accessibility) live in
  `.claude/skills/atelier-iteracao/references/design.md`.

## Read the steering rules

In this order, before non-trivial UI work:

1. `docs/steering/contexto-compartilhado.md` — where shared context lives
2. `docs/steering/revelar-o-processo.md` — how agent work is shown
3. `docs/steering/vistas-de-trabalho.md` — views vs. chat, and the fixed shell
4. `docs/steering/sistema-de-design-como-direcao.md` — the design system as direction
5. `docs/steering/ciclos-de-verificacao.md` — cheap checks over manual review

When a rule needs to change, edit these files. That is the point of them.

## Verify

- `npm test` — `scripts/test.mjs` recursively discovers MJS tests under `scripts/`
  and TS/TSX tests under `src/`, including root-level matches. It attempts both
  groups, checks per-file execution summaries, and fails on incomplete evidence,
  stale `docs/ds/`, or invented colours. TS is transpiled in memory using the
  installed TypeScript compiler, not native Node stripping; typecheck is separate.
  Directory symlinks are not followed; matching file symlinks are diagnosed.
  Empty or skip/TODO-only files do not satisfy the execution-evidence guard.
  This guard does not prove assertion quality; TSX support does not supply a DOM.
- Missing `.grok/app-env.json` is a real setup failure, not ignorable baseline
  noise. Review `.claude/skills/atelier-iteracao/scripts/setup.sh` for explicit
  setup (it may install dependencies; obtain approval). Tests never run setup,
  create/reset config, or override caller environment values. Preserve existing
  local config. Runtime verification and limitations live in
  `.a0proj/_bmad-output/project-context.md`; do not infer CI compatibility.
- `npm run typecheck` and `npm run lint` — clean before you finish.
- `npm run ds:gerar` — regenerate `docs/ds/` after touching tokens or components.
- `npm run ds:gerar -- --check` — what CI runs; writes nothing.
- `npm run ds:reuso` — the colour and measure rule on its own.
- `npm run ds:validar` — the interface-spec contract.

## Generated files are read-only

`docs/ds/**`, `src/routeTree.gen.ts` and `*.gen.ts` are produced by tooling. Edit
the source, then regenerate. A hand edit is lost on the next run.

## Adding an exemption

`scripts/ds/reuso.mjs` holds `PERMITIDOS`: file path to a written reason. Adding an
entry hides real debt, so it needs a human decision. Never widen a rule to make a
violation pass.
