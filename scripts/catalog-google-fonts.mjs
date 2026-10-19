#!/usr/bin/env node
/**
 * Builds the Google Fonts catalog the server searches (src/lib/ai/data/google-fonts.json)
 * from the data files of the `google-font-metadata` package (MIT), which mirrors the
 * official Developer API without needing an API key. Run it by hand to refresh:
 *
 *   node scripts/catalog-google-fonts.mjs            # downloads the package with npm pack
 *   node scripts/catalog-google-fonts.mjs <data-dir> # or reads an unpacked package/data
 *
 * The package is not a dependency: it weighs ~57 MB and only this script reads it.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../src/lib/ai/data/google-fonts.json");

const LICENSES = {
  "SIL Open Font License, 1.1": "OFL",
  "Apache License, Version 2.0": "Apache 2.0",
  "Ubuntu Font License, 1.0": "UFL",
};

function dataDir() {
  if (process.argv[2]) return { dir: resolve(process.argv[2]), cleanup: () => {} };
  const tmp = mkdtempSync(join(tmpdir(), "gfm-"));
  execFileSync("npm", ["pack", "google-font-metadata", "--silent"], { cwd: tmp, stdio: "pipe" });
  const tarball = execFileSync("sh", ["-c", "ls *.tgz"], { cwd: tmp }).toString().trim();
  execFileSync("tar", ["-xzf", tarball], { cwd: tmp });
  return { dir: join(tmp, "package", "data"), cleanup: () => rmSync(tmp, { recursive: true }) };
}

const read = (dir, name) => JSON.parse(readFileSync(join(dir, name), "utf8"));
const idOf = (family) => family.toLowerCase().replace(/\s+/g, "-");

const { dir, cleanup } = dataDir();
try {
  const api = read(dir, "api-response.json");
  const variable = new Map(read(dir, "variable-response.json").map((entry) => [entry.id, entry]));
  const licenses = read(dir, "licenses.json");

  const fonts = api.map((entry) => {
    const id = idOf(entry.family);
    const weights = new Set();
    let italic = false;
    for (const variant of entry.variants) {
      const match = /^(\d{3})?(regular|italic)?$/.exec(variant);
      if (!match) continue;
      weights.add(match[1] ? Number(match[1]) : 400);
      if (variant.endsWith("italic")) italic = true;
    }
    const axes = Object.entries(variable.get(id)?.axes ?? {})
      .filter(([tag]) => tag !== "ital")
      .map(([tag, axis]) => ({ tag, min: Number(axis.min), max: Number(axis.max) }));
    const license = licenses[id]?.license?.type ?? "";
    return {
      family: entry.family,
      category: entry.category,
      weights: [...weights].sort((a, b) => a - b),
      italic,
      axes,
      subsets: entry.subsets,
      license: LICENSES[license] ?? license,
      modified: entry.lastModified,
    };
  });

  writeFileSync(OUT, JSON.stringify(fonts) + "\n");
  console.log(`${fonts.length} famílias em ${OUT}`);
} finally {
  cleanup();
}
