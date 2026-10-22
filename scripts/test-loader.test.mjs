import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const REGISTER = new URL("./test-register.mjs", import.meta.url).href;

/** AC-03: exercise the installed hook in a fresh process without emitting JS. */
function execute(t, files, entry = "entry.test.ts") {
  const root = mkdtempSync(join(tmpdir(), "atelier loader space "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "package.json"), '{"type":"module"}');
  symlinkSync(join(ROOT, "node_modules"), join(root, "node_modules"));
  for (const [name, source] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), source);
  }
  const before = readdirSync(root, { recursive: true }).sort();
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(
    process.execPath,
    ["--enable-source-maps", "--import", REGISTER, "--test", join(root, entry)],
    {
      cwd: tmpdir(),
      env,
      encoding: "utf8",
      timeout: 20000,
      maxBuffer: 2 * 1024 * 1024,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.deepEqual(readdirSync(root, { recursive: true }).sort(), before); // AC-03: no emitted-JS tree.
  return { status: result.status, output: result.stdout + result.stderr };
}

// AC-03: explicit extensions and type-only imports retain the project's ESM contract.
test("AC-03: explicit TS imports execute real assertions", (t) => {
  const result = execute(t, {
    "value.ts": "export type Amount = number; export const value: Amount = 42;",
    "entry.test.ts":
      "import {test} from 'node:test'; import assert from 'node:assert/strict'; import {value, type Amount} from './value.ts'; const expected: Amount=42; test('typed assertion',()=>assert.equal(value,expected));",
  });
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /ok 1 - typed assertion/);
});

test("AC-03: TSX uses automatic React JSX runtime without a DOM", (t) => {
  const result = execute(
    t,
    {
      "entry.test.tsx":
        "import {test} from 'node:test'; import assert from 'node:assert/strict'; const node = <strong>proof</strong>; test('JSX assertion',()=>{assert.equal(node.type,'strong');assert.equal(node.props.children,'proof');});",
    },
    "entry.test.tsx",
  );
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /ok 1 - JSX assertion/);
});

test("AC-03: JS, builtins, packages, JSON and data URLs delegate to Node", (t) => {
  const result = execute(t, {
    "plain.mjs": "export const value=7;",
    "data.json": '{"value":7}',
    "entry.test.ts":
      "import {test} from 'node:test'; import assert from 'node:assert/strict'; import {value} from './plain.mjs'; import data from './data.json' with {type:'json'}; import {createElement} from 'react'; import remote from 'data:text/javascript,export default 7'; test('delegated assertion',()=>{assert.equal(value,data.value);assert.equal(remote,7);assert.equal(createElement('div').type,'div');});",
  });
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /ok 1 - delegated assertion/);
});

/** AC-03: short-circuited TS/TSX modules must not silently accept import attributes. */
for (const extension of ["ts", "tsx"]) {
  for (const attributes of ["type: 'json'", "unsupported: 'value'"]) {
    test(`AC-03: ${extension} rejects import attributes ${attributes}`, (t) => {
      const result = execute(t, {
        [`value.${extension}`]: "export const value = 42;",
        "entry.test.ts":
          `import {test} from 'node:test'; import assert from 'node:assert/strict'; import {value} from './value.${extension}' with {${attributes}}; test('must not execute',()=>assert.equal(value,42));`,
      });
      assert.equal(result.status, 1, result.output); // AC-03: reject before module execution.
      assert.match(result.output, /TypeError:.*Import attributes.*not supported.*value\.tsx?/);
      assert.match(result.output, attributes.startsWith("type") ? /"type":"json"/ : /"unsupported":"value"/);
      assert.doesNotMatch(result.output, /ok 1 - must not execute/);
    });
  }
}

// AC-01/03: syntax and resolution errors stay visible rather than becoming empty modules.
for (const [name, source, diagnostic] of [
  ["syntax", "const value: = 42;", /entry\.test\.ts[:(]1[:,]14.*TS1110.*Type expected/],
  ["missing import", "import './absent.ts';", /absent\.ts/],
  ["no speculative aliases", "import '@/missing.ts';", /Cannot find package '@\/missing.ts'/],
  ["no extension guessing", "import './value';", /Cannot find module '[^'\n]+\/value'/],
]) {
  test(`AC-01/03: ${name} is a visible failure`, (t) => {
    const result = execute(t, { "entry.test.ts": source, "value.ts": "export const value=42;" });
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, diagnostic);
  });
}

test("AC-03: source maps point runtime errors at original TS lines", (t) => {
  const result = execute(t, {
    "entry.test.ts":
      "import {test} from 'node:test';\ntype Removed = {value:number};\n\n\ntest('mapped assertion',()=>{\n  throw new Error('mapped failure');\n});\n",
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /mapped failure/);
  assert.match(result.output, /entry\.test\.ts:6:9/);
});

test("AC-03: semantic typechecking remains a separate command", (t) => {
  const result = execute(t, {
    "entry.test.ts":
      "import {test} from 'node:test'; import assert from 'node:assert/strict'; const value: number='runtime'; test('transpile only',()=>assert.equal(value,'runtime'));",
  });
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /ok 1 - transpile only/);
});
