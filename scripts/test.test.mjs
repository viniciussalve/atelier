import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

/** AC-01, AC-02, AC-03, AC-04: isolated fixture, never a recursive production run. */
function workspace(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), "atelier runner space "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ["scripts", "src", ".grok"]) mkdirSync(join(root, dir));
  put(root, "package.json", '{"type":"module"}');
  put(root, ".grok/app-env.json", '{"VITE_AUTH_ENABLED":"false"}');
  for (const name of ["test.mjs", "test-loader.mjs", "test-register.mjs"]) {
    const source = join(ROOT, "scripts", name);
    if (existsSync(source)) copyFileSync(source, join(root, "scripts", name));
  }
  symlinkSync(join(ROOT, "node_modules"), join(root, "node_modules"));
  for (const [name, source] of Object.entries(files)) put(root, name, source);
  return root;
}

/** AC-01, AC-02: fixtures stay outside production discovery and preserve spaces. */
function put(root, name, source) {
  mkdirSync(dirname(join(root, name)), { recursive: true });
  writeFileSync(join(root, name), source);
}

/** AC-01, AC-02: fresh runner children must not inherit node:test's worker context. */
function invoke(root, entry = "scripts/test.mjs", cwd = root, env = {}) {
  const childEnv = { ...process.env, ...env };
  delete childEnv.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, [join(root, entry)], {
    cwd,
    env: childEnv,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return { status: result.status, output: result.stdout + result.stderr };
}

/** AC-01, AC-03: named cases with assertions, not load-only sentinel output. */
function sentinel(name, pass = true) {
  return `import {test} from 'node:test'; import assert from 'node:assert/strict';\ntest('${name}',()=>assert.equal(${pass},true));\n`;
}

// AC-01: all four pass/fail combinations must execute both halves.
for (const [js, ts] of [
  [true, true],
  [false, true],
  [true, false],
  [false, false],
]) {
  test(`AC-01: MJS=${js}, TS=${ts}, both named outcomes survive`, (t) => {
    const root = workspace(t, {
      "scripts/root.test.mjs": sentinel("MJS sentinel", js),
      "src/root.test.ts": sentinel("TS sentinel", ts),
    });
    const result = invoke(root);
    assert.equal(result.status, js && ts ? 0 : 1, result.output);
    assert.match(result.output, /MJS sentinel/);
    assert.match(result.output, /TS sentinel/);
    assert.match(result.output, /MJS: discovered=1 evidenced=1/);
    assert.match(result.output, /TS: discovered=1 evidenced=1/);
  });
}

test("AC-02/03: recursive sorted discovery, root files, TSX, spaces and alternate cwd", async (t) => {
  const root = workspace(t, {
    "scripts/z.test.mjs": sentinel("root MJS"),
    "scripts/nested space/a.test.mjs": sentinel("nested MJS"),
    "src/root.test.ts": sentinel("root TS"),
    "src/new area/deep/a.test.ts": sentinel("nested TS"),
    "src/new area/deep/b.test.tsx": `import {test} from 'node:test'; import assert from 'node:assert/strict'; test('nested TSX',()=>assert.equal((<span>proof</span>).props.children,'proof'));`,
    "src/ignored.test.js": "throw new Error('wrong pattern');",
    "scripts/ignored.test.ts": "throw new Error('wrong scope');",
  });
  const result = invoke(root, "scripts/test.mjs", tmpdir());
  assert.equal(result.status, 0, result.output);
  for (const name of ["root MJS", "nested MJS", "root TS", "nested TS", "nested TSX"])
    assert.match(result.output, new RegExp(name));
  const { discoverTests } = await import("./test.mjs");
  const discovered = await discoverTests(root, "src", /\.test\.tsx?$/);
  assert.deepEqual(
    discovered.files,
    ["src/new area/deep/a.test.ts", "src/new area/deep/b.test.tsx", "src/root.test.ts"].map((p) =>
      join(root, p),
    ),
  );
});

// AC-01/02: an unavailable group cannot prevent the other group's real test.
for (const scope of ["scripts", "src"]) {
  for (const broken of ["empty", "not-directory"]) {
    test(`AC-01/02: ${scope} ${broken} is red and other group executes`, (t) => {
      const root = workspace(t, {
        "scripts/root.test.mjs": sentinel("MJS sentinel"),
        "src/root.test.ts": sentinel("TS sentinel"),
      });
      rmSync(join(root, scope, scope === "scripts" ? "root.test.mjs" : "root.test.ts"));
      // Keep the CLI under scripts; inject the discovery error in its child scope.
      if (broken === "not-directory") {
        put(
          root,
          "probe.mjs",
          `import {main} from ${JSON.stringify(new URL("./test.mjs", import.meta.url).href)}; import {renameSync,writeFileSync} from 'node:fs'; renameSync('${scope}','saved'); writeFileSync('${scope}','not a directory'); process.exitCode=await main({root:process.cwd()});`,
        );
      }
      const result = invoke(root, broken === "not-directory" ? "probe.mjs" : "scripts/test.mjs");
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, new RegExp(scope === "scripts" ? "TS sentinel" : "MJS sentinel"));
      assert.match(result.output, new RegExp(`${scope}.*(empty|ENOTDIR|discovery)`, "i"));
    });
  }
}

// AC-02: node's file wrapper, empty suites, skips and TODOs are not ordinary tests.
for (const [kind, source] of [
  ["empty module", "export const loaded = true;"],
  ["empty suite", "import {describe} from 'node:test'; describe('empty',()=>{});"],
  ["skip only", "import {test} from 'node:test'; test.skip('skip',()=>{});"],
  ["TODO only", "import {test} from 'node:test'; test.todo('later');"],
  ["import failure", "import './missing.mjs';"],
  ["crash", "process.exit(7);"],
  ["cancellation", "import {test} from 'node:test'; test('cancelled',()=>new Promise(()=>{}));"],
]) {
  test(`AC-01/02: ${kind} fails completeness and names the file`, (t) => {
    const root = workspace(t, {
      "scripts/bad.test.mjs": source,
      "src/root.test.ts": sentinel("TS sentinel"),
    });
    const result = invoke(root);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /scripts\/bad\.test\.mjs/);
    assert.match(result.output, /incomplete/i);
    assert.match(result.output, /TS sentinel/);
    if (kind === "crash") assert.match(result.output, /7/); // AC-01: retain original exit diagnostics.
    if (kind === "import failure") assert.match(result.output, /missing\.mjs/); // AC-01: retain resolution failure.
    if (kind === "cancellation") assert.match(result.output, /cancelled=1/); // AC-02: cancellation is separate.
  });
}

test("AC-02: mixed real/skip/TODO reports separate counts and remains complete", (t) => {
  const root = workspace(t, {
    "scripts/mixed.test.mjs": sentinel("real") + "test.skip('skip',()=>{}); test.todo('later');",
    "src/root.test.ts": sentinel("TS sentinel"),
  });
  const result = invoke(root);
  assert.equal(result.status, 0, result.output);
  assert.match(
    result.output,
    /MJS: discovered=1 evidenced=1 passed=1 failed=0 skipped=1 todo=1 cancelled=0/,
  );
});

test("AC-01/02: passing test followed by asynchronous failure is not success", (t) => {
  const root = workspace(t, {
    "scripts/late.test.mjs":
      sentinel("first passes") + "setTimeout(()=>{throw new Error('late boom');},20);",
    "src/root.test.ts": sentinel("TS sentinel"),
  });
  const result = invoke(root);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /first passes/);
  assert.match(result.output, /late boom/);
  assert.match(result.output, /TS sentinel/);
});

test("AC-02: directory symlinks are not followed; matching file symlinks are diagnosed", (t) => {
  const root = workspace(t, {
    "scripts/root.test.mjs": sentinel("MJS sentinel"),
    "src/root.test.ts": sentinel("TS sentinel"),
    "outside/hidden.test.ts": "throw new Error('followed symlink');",
  });
  symlinkSync(join(root, "outside"), join(root, "src", "linked"));
  let result = invoke(root);
  assert.equal(result.status, 0, result.output);
  symlinkSync(join(root, "outside/hidden.test.ts"), join(root, "src", "linked.test.ts"));
  result = invoke(root);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /src\/linked\.test\.ts.*symlink/i);
  assert.match(result.output, /TS sentinel/);
});

test("AC-04: missing config prints guidance, preserves environment, creates nothing", (t) => {
  const root = workspace(t, {
    "scripts/root.test.mjs":
      sentinel("MJS sentinel") +
      "test('environment preserved',()=>assert.equal(process.env.VITE_AUTH_ENABLED,'explicit'));",
    "src/root.test.ts": sentinel("TS sentinel"),
  });
  rmSync(join(root, ".grok/app-env.json"));
  const result = invoke(root, "scripts/test.mjs", root, { VITE_AUTH_ENABLED: "explicit" });
  assert.equal(result.status, 0, result.output); // AC-04: guidance is not an invented test failure.
  assert.match(result.output, /\.claude\/skills\/atelier-iteracao\/scripts\/setup\.sh/);
  assert.match(result.output, /environment preserved/);
  assert.match(result.output, /TS sentinel/);
  assert.equal(existsSync(join(root, ".grok/app-env.json")), false);
});

// AC-02: alter the actual structured stream, not a list of discovered/loaded names.
for (const mutation of [
  "omit-file",
  "malformed-file",
  "omit-aggregate",
  "failed-aggregate",
  "duplicate-file",
]) {
  test(`AC-02: ${mutation} summary cannot produce success`, (t) => {
    const root = workspace(t, { "scripts/root.test.mjs": sentinel("real evidence") });
    put(
      root,
      "probe.mjs",
      `import {run} from 'node:test'; import {runGroup} from './scripts/test.mjs';
const files=[process.cwd()+'/scripts/root.test.mjs'];
async function* altered(options) { for await(const event of run(options)) {
  if(event.type==='test:summary') {
    if(${JSON.stringify(mutation)}==='omit-file' && event.data.file) continue;
    if(${JSON.stringify(mutation)}==='omit-aggregate' && !event.data.file) continue;
    if(${JSON.stringify(mutation)}==='malformed-file' && event.data.file) event.data.counts.passed='1';
    if(${JSON.stringify(mutation)}==='failed-aggregate' && !event.data.file) event.data.success=false;
    if(${JSON.stringify(mutation)}==='duplicate-file' && event.data.file) yield event;
  } yield event;
}}
process.exitCode=(await runGroup({root:process.cwd(),name:'MJS',files,errors:[],typescript:false},{runTests:altered})).ok ? 0 : 1;`,
    );
    const result = invoke(root, "probe.mjs");
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /incomplete|aggregate/i);
    if (mutation.includes("file")) assert.match(result.output, /scripts\/root\.test\.mjs/); // AC-02: actionable expected path.
  });
}
