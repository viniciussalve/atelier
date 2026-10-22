---
project_name: 'atelier'
user_name: 'User'
date: '2026-10-22'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 47
optimized_for_llm: true
---

# Project Context for AI Agents

_Implementation facts an agent needs before touching this codebase. The steering
layer is `AGENTS.md` plus `docs/steering/` — read those first and treat them as
binding. This file adds what they do not cover and never restates them._

---

## Technology Stack & Versions

- **Runtime/UI:** React 19.2, React DOM 19.2, TypeScript 5.7 (strict, `noEmit`)
- **Framework:** TanStack Start 1.168 + TanStack Router 1.170 (file routes), Nitro 3.0 beta (vercel preset), Vite 8.2
- **Styling:** Tailwind v4.3 via `@tailwindcss/vite` (CSS-first `@theme`, no JS config), `tailwind-merge` 3.5, `clsx` 2.1
- **Primitives:** Radix UI 1.x/2.x per component, `cmdk`, `vaul`, `sonner`, `recharts`, `react-resizable-panels`
- **State:** Zustand 5 (`persist` → localStorage); TanStack Query 5 for server data
- **Server/data:** better-auth ~1.6 (email+password, pglite dialect), Kysely 0.28, `@electric-sql/pglite` 0.5, `pg` 8.16, `jose` 6.2
- **Validation:** Zod 4.4 (v4 API, not v3 idioms)
- **Icons/fonts:** `@iconify/collections`, `lucide-react`
- **Tests/tooling:** Node built-in test runner (`node --test`), Playwright 1.62, ESLint 9 flat config, Prettier 3.4

## Critical Implementation Rules

### Language-Specific Rules

- Import through the `@/*` → `./src/*` alias. No `../../..` chains across areas.
- Relative imports **inside `src/lib/library/**` and `src/lib/ai/**` carry the explicit `.ts`/`.tsx` extension** (e.g. `from "./filters.ts"`). Tests use Node ESM resolution with the local TypeScript loader; it does not guess extensions or resolve `@/*` aliases, even when typecheck accepts them.
- In those same two trees, `@typescript-eslint/consistent-type-imports` is an **error** with `fixStyle: inline-type-imports` — use `import { type Foo } from ...`. The test loader preserves value imports (`verbatimModuleSyntax`), so importing a type-only export as a value throws at runtime.
- Domain shapes are literal unions, not enums: `CriterionId = FontCriterionId | IconCriterionId`, `Score = 1 | 2 | 3 | 4 | 5`, `Verdict = "" | "usar" | "revisar" | "evitar"`. Optional is modelled as `Partial<Record<Id, T>>` where a key exists only while it holds data — don't paper over it with defaults.
- `allowJs` + `checkJs` are on: `src/lib/db.ts` imports `scripts/migration-plan.mjs`, so JS scripts are typechecked. Change a script and its consumer together.
- `tsconfig.json` `exclude` lists platform glue that is not in this repo (multiplayer, auth middleware/use-current-user/verify, app-data index/readiness). Do not re-include them to make `typecheck` "cleaner" — they are stubs.

### Framework-Specific Rules

- Routes are files under `src/routes/**`; the router plugin regenerates `src/routeTree.gen.ts`. Add a route file, never edit the tree.
- Literal dots are escaped in filenames: `src/routes/llms[.]txt.ts`, `robots[.]txt.ts`. That is the routing convention here, not a typo.
- API routes use `createFileRoute("/api/x")({ server: { handlers: { GET: ({ request }) => ... } } })` and must answer **both** shapes through `src/lib/ai/respond.ts`: `json()` / `markdown()` selected by `wantsMarkdown(request)` (`?formato=md`). These endpoints are an agent-facing contract.
- `src/components/ui/**` holds Radix wrappers composed with `cn()` (`src/lib/utils.ts`). Reuse them; add a variant (`class-variance-authority`) rather than a second primitive.
- `src/components/library/**` is grouped by area — `workspace`, `sidebar`, `browser`, `specimen`, `inspector`, `evaluation`, `shared`. Cross-area hooks and helpers belong in `shared/`.
- Domain logic must stay React-free in `src/lib/library/*` (pure, tested). Components read it through the Zustand store (`store.ts`, `workspace.ts`); they do not own rules.
- Zustand state is persisted to localStorage. Changing the persisted shape requires work in `src/lib/library/migrate.ts` — a type change alone is a data-loss bug for returning users.
- Server-only modules are named `*.server.ts` (`catalog.server.ts`, `popup.server.ts`, auth helpers) and must not be imported by client components.
- `/auth/popup` is served by Vite middleware in `vite.config.ts`, not by a route. Creating `src/routes/auth/popup.tsx` breaks the OAuth popup.

### Testing Rules

- There is no Jest/Vitest. `npm test` invokes `scripts/test.mjs`: sorted recursive discovery of `scripts/**/*.test.mjs` and `src/**/*.test.ts`/`*.test.tsx`, including scope-root files, independent of cwd. Both process-isolated Node test groups run despite failures; directory symlinks are not followed and matching file symlinks are errors. TS workers preload `scripts/test-register.mjs` and transpile in memory with installed TypeScript (ES2022/ESNext/react-jsx, source maps), without native stripping. `npm run typecheck` remains separate; TSX support supplies no DOM/Vite emulation. Structured per-file summaries must prove an ordinary completed test and reconcile with the aggregate: empty, skip/TODO-only or missing/malformed evidence fails by path. This is execution evidence, not proof of assertion quality. Verified on this Debian Node 22.22.0 build without amaro, not a universal Node/CI guarantee.
- Tests are colocated as `*.test.ts` next to the module; shared builders live in `test-fixtures.ts` per tree.
- `npm test` also fails on a stale `docs/ds/` and on colour/measure violations — it is the design-system gate, not only unit tests.
- Local setup matters: missing `.grok/app-env.json` causes three real failures in `scripts/with-app-env.test.mjs`; never ignore them. The runner prints `.claude/skills/atelier-iteracao/scripts/setup.sh` guidance but does not run setup, create/reset config or override environment values. Review that script before use (it may install dependencies; obtain approval). Configured verification passed 119 MJS tests (85 existing + 34 runner/loader regressions) and 333 TS tests; counts are observations, not fixed runner thresholds.

### Code Quality & Style Rules

- Prettier: double quotes, semicolons, `trailingComma: all`, `printWidth: 100`.
- ESLint flat config: `no-explicit-any` off, unused args/vars warn with a `_` prefix escape, `react-refresh/only-export-components` warns.
- Comments explain **why** (see the annotations in `tsconfig.json` and `vite.config.ts`) — reproduce that density, not narration of what the code does.
- **UI copy is Portuguese (pt-BR).** Identifiers, types, comments and agent-facing artifacts (`AGENTS.md`, this file, `docs/ds/`, `llms.txt`) are English. Do not translate the interface.
- Files are kebab-case; exported hooks `use-*.ts`; components export named functions (no default exports).

### Development Workflow Rules

- `npm install --legacy-peer-deps` is mandatory (npm 9/10 crash on `edgesOut`). **No lockfile is tracked** — do not add one without asking.
- Dev server contract: `0.0.0.0:8080`, `strictPort`; preview `127.0.0.1:8081`. `startup.sh` reuses a live server on 8080. Do not change host/port.
- Platform glue stubs and a missing local app-env config can be prepared by `.claude/skills/atelier-iteracao/scripts/setup.sh` (with `scripts/browser-guard.mjs` guarding browser use). Setup is explicit and separate from tests; preserve existing config and obtain approval before dependency installation.
- `npm run build` = vite build **then** `npm run db:migrate`. Migrations are SQL under `migrations/<domain>/NNNN_name.sql`, globbed non-recursively per domain directory (`src/lib/db.ts`), so nesting a new subdirectory hides it.
- Nitro config must keep `serverDir: "./server"` — dropping it silently unwires the PWA middleware on deploy.
- Absolute links in AI-facing text derive from `PUBLIC_BASE_URL`, else the request. `X-Forwarded-*` are trusted only when well-formed; responses carry `Vary` so caches cannot cross origins.
- Commit messages are Portuguese and summary-style (see `git log`). Do not commit or push unless asked.

### Critical Don't-Miss Rules

- **Never hand-edit generated files:** `docs/ds/**`, `src/routeTree.gen.ts`, `src/lib/ds/tokens.gen.ts`. They are ESLint-ignored and test-checked; edit source then run `npm run ds:gerar`.
- **Never introduce a hex colour, a Tailwind palette colour, or an arbitrary measure.** Add a `@theme` token in `src/styles.css` instead. Exemptions are human decisions recorded in `scripts/ds/reuso.mjs` `PERMITIDOS`.
- **Never widen a design-system rule to make a violation pass.**
- Adding an asset is confirmation-gated: nothing enters the library without the user confirming, and AI suggestions arrive via the `/?adicionar=fonte:…,icones:…&motivo=…` link, tagged `ia` with the reason in the notes.
- The agent-facing surface (`/api/fontes|conjuntos|icones|adicionar|parecidas`, `/ia`, `/llms.txt`, `/robots.txt`, `/mcp`) is a published contract: keep JSON and Markdown, keep MCP tool parity with the REST searches.
- Do not create a `/auth/popup` route and do not move the popup out of `vite.config.ts` — middleware ordering is what keeps it ahead of the SPA fallback.
- Read `docs/steering/` before non-trivial UI work; when a rule needs to change, edit those files rather than diverging in code.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-10-22
