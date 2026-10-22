---
title: 'Reliable test discovery and execution'
type: 'bugfix'
created: '2026-10-22'
status: 'done'
baseline_commit: '2f21603c3232e3af152c63d68e48b80f1b654996'
approval: '2026-10-22 — human K/A; ready-for-dev approved, implementation started; frozen intent locked'
context:
  - '/a0/usr/projects/atelier/AGENTS.md'
  - '/a0/usr/projects/atelier/.a0proj/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `npm test` short-circuits before TypeScript, enumerates brittle paths, and requests stripping unavailable in this container's Node build.

**Approach:** One runner recursively discovers both groups, attempts both despite failures, executes TS/TSX through existing TypeScript, and rejects incomplete execution evidence. These are coupled parts of one trustworthy test command.

## Boundaries & Constraints

**Always:** Discover `scripts/**/*.test.mjs` and `src/**/*.test.ts`/`*.test.tsx`, including root-level matches. Report failures, skips and TODOs honestly. Preserve existing tests, DS gates and eight allowlist entries. Missing app-env remains red with setup guidance; never auto-run setup. Keep the existing `.grok/app-env.json` intact.

**Ask First:** New dependencies, Node replacement, changes to existing tests, discovery exclusions or environment policy.

**Never:** Suppress failures; count discovered/loaded paths as executed tests; alter UI/auth behavior; hand-edit generated files; install, commit or push. Do not infer CI behavior from container evidence.

## I/O & Edge-Case Matrix

| State | Expected behavior | Failure handling |
|---|---|---|
| Both groups pass | Report both; exit 0 | Require completeness too |
| Either/both fail | Attempt both; exit nonzero | Preserve both diagnostics |
| Empty group/discovery error | Attempt other group | Name missing/unreadable scope |
| Empty module/suite or skip/TODO-only file | No proven completed ordinary test | Fail completeness, name file |
| Import error, crash, cancellation | Preserve original failure | Incomplete summaries also fail |
| Missing app-env | Run both; show setup hint | No skip, config creation or reset |

</frozen-after-approval>

## Code Map

- `package.json`: current `&&` chain; `typescript` already installed.
- `scripts/with-app-env.mjs`: root resolution and `.grok/app-env.json` contract; tests depend on local setup.
- `scripts/ds/{gerar,reuso}.test.mjs`: existing freshness/token gates.
- `tsconfig.json`: ES2022, ESNext, react-jsx; typecheck remains separate.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/test.test.mjs`: first add temporary-workspace regressions for the matrix, nested discovery, paths with spaces, alternate cwd, and omission of an expected execution summary. Spawn fresh runner children without inherited `NODE_TEST_CONTEXT`; never recursively run the production suite inside itself.
- [x] `scripts/test-loader.test.mjs`: first cover explicit TS imports, TSX JSX execution, delegated JS/packages/JSON, syntax/import errors and source diagnostics. Fixtures live outside production discovery and are cleaned up.
- [x] `scripts/test-loader.mjs`, `scripts/test-register.mjs`: register local ESM hooks with `node:module.register` via `--import`; transpile TS/TSX in memory using installed TypeScript, ES2022/ESNext/react-jsx and source maps. Surface syntax errors; delegate other URLs. Preserve explicit extensions; no speculative alias resolver or DOM/Vite emulation.
- [x] `scripts/test.mjs`: sorted recursive discovery from repository root, independent of cwd. Do not follow directory symlinks; diagnose matching file symlinks rather than silently omitting them. Attempt both groups with process-isolated `node:test.run`, loading hooks only for TS. Consume structured events, retain readable output, set union exit status after both attempts. Missing config prints the setup-script path without changing environment values.
- [x] `scripts/test.mjs`: reconcile discovered entries with per-file `test:summary` evidence and final aggregate success. Require at least one ordinary completed test per file; fail missing/malformed evidence. Print discovered, evidenced, passed, failed, skipped and TODO counts separately. Pin event semantics in regressions, including mixed real/skipped tests and a failure after a passing test.
- [x] `package.json`: replace only `test` with `node scripts/test.mjs`.
- [x] `.a0proj/_bmad-output/project-context.md`, `AGENTS.md`: correct test execution/setup guidance after verification; remove “noise” and native-stripping claims. Record limits, not universal Node/CI claims; preserve unrelated rules.

**Acceptance Criteria:**
- **AC-01:** Given each pass/fail combination, when the runner finishes, then named sentinel tests from both halves have outcomes and exit is zero only for two complete successes.
- **AC-02:** Given new nested TS and TSX tests outside old globs, when `npm test` runs, then their named cases execute without package edits; an expected file lacking execution evidence fails by path.
- **AC-03:** Given this Node without amaro, when TS/TSX tests run, then real assertions execute without installation or emitted-JS directories; typecheck remains independent.
- **AC-04:** Given an isolated checkout missing app-env, when testing, then the same three environment failures remain, TS still executes, setup guidance prints, and no config is created.
- **AC-05:** Given stale DS output or an invented colour, when `npm test` runs, then it fails without skipping TS; after restoring sources it passes when the environment is configured, with eight exemptions unchanged.

## Spec Change Log

- 2026-10-22: Step-03 implementation complete; all seven execution tasks checked. Added verification below without changing approved intent. At the step-03 handoff, frontmatter was left `in-progress` for parent-owned step-04/05; neither review nor presentation workflow had been started at that point. The parent subsequently advanced the spec to `in-review`.

## Design Notes

Inspected baseline: HEAD `2f21603`; 10 MJS files and 30 TS files. Debian Node 22.22.0 reports `node_use_amaro=false`; the prior loader probe passed 333 TS tests. The historical 85/82/3 was MJS-only with missing local config, not an acceptable failure allowance.

Node can synthesize a passing result for an empty file. Per-file summaries plus ordinary test counts are stronger evidence, not proof of assertion quality. Skip/TODO-only files deliberately fail this completeness policy; report that reason distinctly. Do not promise a false-positive-free guard. TSX support means JSX transpilation, not browser support.

## Verification

Run new tests first, then `npm test`, `npm run typecheck`, `npm run lint`, `npm run ds:gerar -- --check`, `npm run ds:reuso`; record actual counts and exits.

Use isolated temporary checkout copies for negative full-command probes: omit app-env there only; change a theme source without regenerating to create stale output; add a scratch source with an invented colour. Never hand-edit generated artifacts. Assert TS sentinels still execute in each failure run; restore copied sources and rerun. Original app-env hash must remain unchanged. Clean fixtures/processes; no dependency installation. Reconcile old 85 MJS + 333 TS with new test counts rather than hardcoding a total.

### Step-03 results — 2026-10-22

Runtime: Debian Node `v22.22.0`, `node_use_amaro=false`; existing local TypeScript only. No installation, setup execution, commit, push, UI change, generated hand edit, allowlist growth, state-file change or sidecar change.

#### Sequential TDD and integration evidence

Counts below are passed/total, not discovered filenames. Expected RED was intermediate evidence, never final completion.

| Stage | Command/check | Exit | Result |
|---|---|---:|---|
| Baseline | `npm test` | 1 | MJS 85/85; native-stripping TS workers 0/30, all fail because amaro is absent (not 30 executed domain tests) |
| Task 1 RED | `node --test scripts/test.test.mjs` | 1 | 0/25 before runner implementation |
| Task 1 full | `npm test` | 1 | MJS 85/110; old `&&` chain prevents TS |
| Task 2 RED | loader tests, then strengthened diagnostics assertions | 1 | Initially 2/9 could pass on incidental missing-file diagnostics; tightened assertions yield 0/9, eliminating those false positives |
| Task 2 full | `npm test` | 1 | MJS 87/119 at the initial loader-test checkpoint; old chain prevents TS |
| Task 3 GREEN | loader tests / existing TS via register | 0 / 0 | 9/9 loader regressions; 333/333 existing TS cases |
| Task 3 full | `npm test` | 1 | MJS 94/119; runner not implemented yet, old chain prevents TS |
| Task 4 partial | runner tests / new runner | 1 / 1 | 13/25 runner cases; MJS 107/119 and TS 333/333; completeness still RED pending task 5 |
| Task 4 full | `npm test` | 1 | MJS 107/119; old package chain still prevents TS |
| Task 5 GREEN | runner tests / new runner | 0 / 0 | 25/25 runner cases; MJS 119/119 and TS 333/333 |
| Task 5 full | `npm test` | 1 | MJS 119/119; old package entry still launches 30 failing native-stripping workers |
| Task 6 wired | `npm test` | 0 | MJS 119/119; TS 333/333 |
| Task 7 final | `npm test` after documentation updates | 0 | MJS 119/119; TS 333/333 |

Final summaries: MJS discovered=12, evidenced=12, passed=119; TS discovered=30, evidenced=30, passed=333. Both report failed=0, skipped=0, todo=0, cancelled=0. Reconciliation: 85 preserved MJS cases + 25 runner + 9 loader = 119; all 333 existing TS cases remain. No fixed expected total is embedded in the runner.

#### Negative full-command proofs (isolated copies only)

Each row used full `npm test` in a copied checkout with existing dependencies available, not a recursively nested production run. The original config was never removed or edited. Every negative run emitted named TS outcomes and the complete 30-file/333-case TS summary.

| Copied-checkout mutation | Exit | MJS passed/failed | TS passed/failed | Restore and rerun |
|---|---:|---:|---:|---|
| Omit copied `.grok/app-env.json` | 1 | 116/3 | 333/0 | Restore copied config: exit 0, MJS 119/0, TS 333/0 |
| Change `src/styles.css` theme source without regeneration | 1 | 117/2 | 333/0 | Restore source: exit 0, MJS 119/0, TS 333/0 |
| Add scratch source containing `bg-red-500` | 1 | 118/1 | 333/0 | Remove scratch: exit 0, MJS 119/0, TS 333/0 |

Missing-config failures are exactly the existing cases at `scripts/with-app-env.test.mjs:62`, `:76`, `:116`: template ships auth off; wrapped command applies app env; CLI runs through symlink. Setup guidance printed and no config was created. The stale-source failures were the freshness check and changed/leftover-page check at `scripts/ds/gerar.test.mjs:8` and `:12`. The invented-colour failure was the existing repository-token test at `scripts/ds/reuso.test.mjs:21`, which reported `bg-red-500`. No generated output was hand-edited for these probes.

#### Other verification

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, zero errors; one existing unused-`relative` warning at `scripts/ds/componentes.mjs:7:25`. That file is unchanged.
- `npm run ds:gerar -- --check`: exit 0; 42 generated files current.
- `npm run ds:reuso`: exit 0; eight exemptions unchanged.
- Bare `npm run ds:validar`: exit 2 (requires spec arguments, not a validation failure). Correct invocation `npm run ds:validar -- docs/ds/exemplos/*.json`: exit 0; all three examples valid.
- `git diff --check`: exit 0. Baseline diff for existing tests, `src/`, `docs/ds/`, and `scripts/ds/`: empty, exit 0.
- HEAD remains `2f21603c3232e3af152c63d68e48b80f1b654996`.
- Original `.grok/app-env.json` SHA-256 remains `4ecd4c43f97c92389a1fd774ca2cf94296c9e49208a3f43162988936685dadae`.
- Frozen block SHA-256 before/after: `0992c366c6379f46ed86c232863f7d08577cd892f601b73b2a1bb988ed4f792b` (entire tagged block with its original newlines).

#### AC traceability and corner cases

| AC | Implementation | Evidence |
|---|---|---|
| AC-01 | `scripts/test.mjs:55`, `:76`, `:186` | `scripts/test.test.mjs:62` all four pass/fail combinations, both named outcomes; `:107` empty/error scopes; `:132` import/crash/cancellation; `:171` post-pass async failure |
| AC-02 | `scripts/test.mjs:11`, `:98`, `:122`, `:173` | `scripts/test.test.mjs:83` root/nested TS/TSX, spaces, alternate cwd and sorted discovery; `:132` empty module/suite, skip/TODO-only; `:158` mixed real/skip/TODO; `:184` directory/file symlinks; `:216` omitted/malformed/duplicate per-file and omitted/failed aggregate summaries |
| AC-03 | `scripts/test-loader.mjs:5`, `scripts/test-register.mjs:3`, `scripts/test.mjs:91` | `scripts/test-loader.test.mjs:12` no emitted files; `:43` explicit typed imports; `:53` JSX; `:66` JS/builtin/package/JSON/data delegation; `:77` syntax, missing import, no alias/extension guessing; `:91` original TS source locations; `:101` transpilation is not typechecking |
| AC-04 | `scripts/test.mjs:186` | `scripts/test.test.mjs:200` explicit environment preserved, setup hint, no created config; full copied-checkout proof above retains exactly three real failures |
| AC-05 | `package.json:19`, `scripts/test.mjs:195` | Existing DS tests unchanged; both full negative proofs above retain TS execution and restore green; exemption count remains eight |

Functions carry AC docstrings and acceptance-related branches carry inline AC comments. The guard consumes actual process-isolated `node:test` per-file summaries, validates counter shape, requires an ordinary completed case per file, reconciles aggregate counters and retains failure status. It does not count discovery/load events as execution. Cancellation is reported separately. Discovery-error regression uses a non-directory scope for deterministic behavior under root; filesystem permission-denied behavior was not separately forced. Tested Node event semantics are local to this build, not a CI/version compatibility promise. This guard cannot establish assertion quality. No browser/DOM/Vite emulation, alias resolver, extension guessing or semantic typechecking is claimed. No build was run because it also invokes database migration and is outside this test-wiring change.

#### Exact implementation change set and cleanup

Modified: `package.json:19`; `AGENTS.md:36`; `.a0proj/_bmad-output/project-context.md:37` (also testing/setup guidance at `:57`, `:60`, `:74`); this spec's non-frozen execution/change-log/verification sections. Added: `scripts/test.mjs:1`, `scripts/test-register.mjs:1`, `scripts/test-loader.mjs:1`, `scripts/test.test.mjs:1`, `scripts/test-loader.test.mjs:1`. Existing test files are untouched; all new regressions live in the two specified test files. Pre-existing untracked `.a0proj` internals are not part of this change set.

Temporary copied checkouts, event probes and runner/loader fixtures were removed; no owned runner processes remain. Temporary verification logs are summarized here and removed at handoff. No separate report artifact is created. Parent owns step-04 review and step-05; implementation completion does not claim those gates passed.

### Step-04 classification and accepted fixes — 2026-10-22

- **PATCH — AC-03:** `shortCircuit` bypassed native import-attribute validation. `scripts/test-loader.mjs:17–22` now rejects nonempty TS/TSX import attributes before reading/transpiling, with a TypeError naming the attributes and source path. Non-TS delegation and attribute-free imports are unchanged. Four regressions were added only to the new `scripts/test-loader.test.mjs:77–92`: TS and TSX, each with `type: 'json'` and an unknown attribute. AC docstring and inline comments identify the contract.
- **PATCH — historical wording:** change-log line 69 now explicitly describes the step-03 handoff rather than claiming the current status remains `in-progress`. Current status remains `in-review`.
- **DEFER — indefinitely live workers:** an active interval can prevent completion and the later group from starting, as in the native baseline. Finite failing/crashing/cancelled paths are handled; indefinitely live workers are not bounded. No deadline was approved and no arbitrary timeout was added. Follow-up policy is recorded in `deferred-work.md:71–81`.
- **REJECT — CommonJS TS expansion:** outside the approved ESNext module target/current-project contract; loader scope is unchanged.

#### Patch verification

TDD RED: `node --test scripts/test-loader.test.mjs` exited **1**, with **13 tests, 9 pass, 4 fail**; all four attribute cases failed on `0 !== 1`, proving previously accepted imports rather than setup failures. After the six-line loader guard, `node --test scripts/test-loader.test.mjs scripts/test.test.mjs` exited **0**, with **38 tests, 38 pass, 0 fail**, including all four named attribute cases.

Full `npm test` exited **0**:

```text
MJS: discovered=12 evidenced=12 passed=123 failed=0 skipped=0 todo=0 cancelled=0
TS: discovered=30 evidenced=30 passed=333 failed=0 skipped=0 todo=0 cancelled=0
```

Reconciliation: 85 preserved MJS + 25 runner + 13 loader = 123. `npm run typecheck`, `npm run lint`, `npm run ds:gerar -- --check`, `npm run ds:reuso`, and `git diff --check` each exited **0**. Lint retained only the existing `scripts/ds/componentes.mjs:7:25` unused-`relative` warning (0 errors, 1 warning). DS output: `docs/ds/ em dia (42 arquivos).`; reuse output: `Nenhuma cor ou medida inventada em src/ (8 arquivos permitidos com motivo).`

Updated AC-03 traceability: loader validation `scripts/test-loader.mjs:17–22`; new regression matrix `scripts/test-loader.test.mjs:77–92`; existing syntax/import cases now `:94–106`, source-map case `:108`, separate-typecheck case `:118`. Earlier step-03 line references and counts describe that historical checkpoint. AC-01/02 runner regressions remain green; AC-04/05 negative full-command proofs remain the step-03 evidence and were not repeated for this attribute-only patch.

Preservation: app-env SHA-256 remains `4ecd4c43f97c92389a1fd774ca2cf94296c9e49208a3f43162988936685dadae`; frozen-block SHA-256 remains `0992c366c6379f46ed86c232863f7d08577cd892f601b73b2a1bb988ed4f792b`. Baseline diff of existing tests, UI/generated source and DS files is empty (exit 0). Exact patch change set: `scripts/test-loader.mjs`, `scripts/test-loader.test.mjs`, this spec's non-frozen sections, and `deferred-work.md`. No installs, commits, state/sidecar changes, CommonJS expansion or runner timeout changes. Temporary verification backups/logs and test fixtures are removed at handoff; no owned test processes remain. Step-05 was left to the parent at that handoff.

## Suggested Review Order

**Execution and evidence**

- Run both groups and combine outcomes without the old short circuit.
  [`test.mjs:187`](../../../scripts/test.mjs#L187)
- Discover recursively without silently following directory symlinks.
  [`test.mjs:12`](../../../scripts/test.mjs#L12)
- Require per-file execution summaries, ordinary completed tests, and aggregate consistency.
  [`test.mjs:98`](../../../scripts/test.mjs#L98)

**TypeScript boundary**

- Transpile in memory; reject unsupported attributes and preserve useful source diagnostics.
  [`test-loader.mjs:10`](../../../scripts/test-loader.mjs#L10)
- Register hooks only for TypeScript workers.
  [`test-register.mjs:3`](../../../scripts/test-register.mjs#L3)

**Regression coverage and operating guidance**

- Exercise failure combinations, discovery boundaries, and missing execution evidence.
  [`test.test.mjs:62`](../../../scripts/test.test.mjs#L62)
- Prove typed imports, JSX execution, attribute rejection, and source maps.
  [`test-loader.test.mjs:43`](../../../scripts/test-loader.test.mjs#L43)
- Replace only the test entry point.
  [`package.json:19`](../../../package.json#L19)
- State setup requirements without hiding environment failures.
  [`AGENTS.md:36`](../../../AGENTS.md#L36)
- Correct runtime facts without extrapolating container results to CI.
  [`project-context.md:57`](../project-context.md#L57)
- Track the unbounded-worker limitation separately; no arbitrary deadline was introduced.
  [`deferred-work.md:71`](deferred-work.md#L71)

Step-05 completed without commit/push or editor launch, respecting explicit authorization boundaries. Parent retains state reconciliation; Persona BMad Master (Orchestrator) and state file were not changed.
