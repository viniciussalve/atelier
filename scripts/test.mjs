import { existsSync, realpathSync } from "node:fs";
import { lstat, readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { run } from "node:test";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const REGISTER = new URL("./test-register.mjs", import.meta.url).href;

/** AC-02: stable recursive discovery rooted at the repository, never at the caller's cwd. */
export async function discoverTests(root, scope, pattern) {
  const files = [];
  const errors = [];
  /** AC-01/02: a bad subtree is diagnosed without discarding its readable siblings. */
  async function visit(directory) {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isSymbolicLink()) {
          // AC-02: never follow directory links; matching file/dangling links are visible errors.
          if (pattern.test(entry.name)) {
            const target = await stat(path).catch(() => null);
            if (!target?.isDirectory())
              errors.push(`${relative(root, path)}: matching test symlink is not supported`);
          }
        } else if (entry.isDirectory()) {
          await visit(path);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          // AC-02: root-level matches and new nested tests share one rule.
          files.push(path);
        }
      }
    } catch (error) {
      // AC-01/02: report unreadable/missing scopes and continue the other group.
      errors.push(`${relative(root, directory)}: discovery failed: ${error.message}`);
    }
  }
  const directory = resolve(root, scope);
  try {
    if ((await lstat(directory)).isSymbolicLink()) {
      // AC-02: a symlinked scope must not bypass the no-directory-symlink policy.
      errors.push(`${scope}: discovery scope is a symlink`);
    } else {
      await visit(directory);
    }
  } catch (error) {
    errors.push(`${scope}: discovery failed: ${error.message}`); // AC-01/02: absent scope.
  }
  if (!files.length) errors.push(`${scope}: empty test group`); // AC-01/02: never auto-discover defaults.
  return { files: files.sort(), errors };
}

/** AC-01: readable structured outcomes retain original errors, stdout, stderr and locations. */
function printEvent(event, root, write) {
  const { type, data } = event;
  if (type === "test:stdout" || type === "test:stderr") {
    write(data.message); // AC-01/03: preserve loader and import diagnostics.
  } else if (type === "test:pass" || type === "test:fail") {
    const location = data.file
      ? `${relative(root, data.file)}:${data.line ?? 1}:${data.column ?? 1}`
      : "";
    const directive = data.skip ? " SKIP" : data.todo ? " TODO" : "";
    write(`${type === "test:pass" ? "ok" : "not ok"} ${data.name}${directive} (${location})\n`);
    if (data.details?.error) write(`${inspect(data.details.error, { depth: 8, colors: false })}\n`); // AC-01: failure details.
  } else if (type === "test:diagnostic") {
    write(`# ${data.message}\n`); // AC-01: late asynchronous failures are diagnostics too.
  }
}

/**
 * AC-01/03: process-isolated groups, hooks only for TS, with a test-stream injection seam.
 * AC-02: summaries are collected from node:test, not from file discovery/load events.
 */
export async function runGroup(
  { root, name, files, errors, typescript },
  { runTests = run, write = (text) => process.stdout.write(text) } = {},
) {
  const problems = [...errors];
  const summaries = new Map();
  const expected = new Set(files);
  let aggregate;
  let observedFailure = false;
  if (files.length) {
    try {
      const events = runTests({
        files,
        isolation: "process",
        concurrency: 2,
        execArgv: typescript ? ["--enable-source-maps", "--import", REGISTER] : [],
      });
      for await (const event of events) {
        printEvent(event, root, write);
        if (event.type === "test:fail" && !event.data.todo && !event.data.skip) {
          observedFailure = true; // AC-01: never lose a real failure to a later success summary.
        }
        if (event.type === "test:summary") {
          if (typeof event.data.file === "string") {
            const file = resolve(event.data.file);
            if (!expected.has(file) || summaries.has(file)) {
              // AC-02: duplicate/unexpected evidence cannot stand in for another file.
              problems.push(
                `${relative(root, file)}: incomplete evidence (duplicate or unexpected summary)`,
              );
            }
            summaries.set(file, event.data);
          } else if (event.data.file !== undefined || aggregate) {
            problems.push(
              `${name}: incomplete aggregate evidence (malformed or duplicate summary)`,
            ); // AC-02.
          } else {
            aggregate = event.data;
          }
        }
      }
    } catch (error) {
      // AC-01: a stream/launch failure must not prevent the other group.
      problems.push(`${name}: test runner failed: ${inspect(error)}`);
    }
  }
  let evidenced = 0;
  const totals = Object.fromEntries(COUNT_KEYS.map((key) => [key, 0]));
  for (const file of files) {
    const summary = summaries.get(file);
    if (!validSummary(summary)) {
      // AC-02: loaded/discovered filenames and synthetic file passes are not evidence.
      problems.push(
        `${relative(root, file)}: incomplete evidence (missing or malformed test:summary)`,
      );
    } else {
      for (const key of COUNT_KEYS) totals[key] += summary.counts[key];
      if (summary.counts.passed + summary.counts.failed === 0) {
        // AC-02: suites, skips, TODOs and cancellations do not prove an ordinary completed test.
        problems.push(`${relative(root, file)}: incomplete evidence (no ordinary completed test)`);
      } else {
        evidenced++;
      }
      if (!summary.success) observedFailure = true; // AC-01: retain per-file failure status.
    }
  }
  if (!validSummary(aggregate)) {
    problems.push(`${name}: incomplete aggregate evidence (missing or malformed test:summary)`); // AC-02.
  } else {
    if (!aggregate.success) problems.push(`${name}: aggregate reports failure`); // AC-01: includes post-test crashes.
    if (COUNT_KEYS.some((key) => totals[key] !== aggregate.counts[key])) {
      problems.push(
        `${name}: incomplete aggregate evidence (counts differ from per-file summaries)`,
      ); // AC-02.
    }
  }
  const counts = validSummary(aggregate) ? aggregate.counts : undefined;
  write(
    `${name}: discovered=${files.length} evidenced=${evidenced} passed=${counts?.passed ?? "unknown"} failed=${counts?.failed ?? "unknown"} skipped=${counts?.skipped ?? "unknown"} todo=${counts?.todo ?? "unknown"} cancelled=${counts?.cancelled ?? "unknown"}\n`,
  );
  for (const problem of problems) write(`${problem}\n`);
  // AC-01/02: success needs both honest outcomes and complete execution evidence.
  return { ok: problems.length === 0 && !observedFailure && aggregate?.success === true };
}

const COUNT_KEYS = [
  "tests",
  "passed",
  "failed",
  "cancelled",
  "skipped",
  "todo",
  "suites",
  "topLevel",
];

/** AC-02: pin Node's structured summary shape; reject coercible or inconsistent counters. */
function validSummary(summary) {
  if (typeof summary?.success !== "boolean" || !summary.counts) return false; // AC-02: absent evidence.
  const counts = summary.counts;
  if (!COUNT_KEYS.every((key) => Number.isSafeInteger(counts[key]) && counts[key] >= 0))
    return false; // AC-02: malformed evidence.
  if (
    counts.tests !==
    counts.passed + counts.failed + counts.cancelled + counts.skipped + counts.todo
  )
    return false; // AC-02: inconsistent counts.
  return !summary.success || (counts.failed === 0 && counts.cancelled === 0);
}

/** AC-01/02/04/05: attempt both groups, leave environment/config untouched and retain DS gates. */
export async function main({ root = ROOT } = {}) {
  if (!existsSync(join(root, ".grok/app-env.json"))) {
    // AC-04: guidance only; never run setup, create config, or override caller values.
    console.error(
      "Missing .grok/app-env.json; review .claude/skills/atelier-iteracao/scripts/setup.sh for local setup. Tests will still run; environment failures are not ignored.",
    );
  }
  let ok = true;
  for (const group of [
    { name: "MJS", scope: "scripts", pattern: /\.test\.mjs$/, typescript: false },
    { name: "TS", scope: "src", pattern: /\.test\.tsx?$/, typescript: true },
  ]) {
    const discovery = await discoverTests(root, group.scope, group.pattern);
    const result = await runGroup({ root, ...group, ...discovery });
    if (!result.ok) ok = false; // AC-01/05: no short circuit even after a DS/environment failure.
  }
  return ok ? 0 : 1;
}

/** AC-02: imports are inert, including fixture imports used to inspect real event streams. */
function isMain() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isMain()) process.exitCode = await main();
