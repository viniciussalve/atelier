import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeSnapshot,
  encodeSnapshot,
  fitSnapshot,
  snapshotOf,
  type Snapshot,
} from "./snapshot.ts";
import { defaultLibrary, makeAsset } from "../library/seed.ts";

const library = defaultLibrary();

describe("snapshotOf", () => {
  const snapshot = snapshotOf(library, "2026-10-19T12:00:00.000Z");
  const inter = snapshot.fontes.find((item) => item.n === "Inter");
  const lucide = snapshot.icones.find((item) => item.n === "Lucide");

  it("keeps what an AI needs to know about each item", () => {
    assert.deepEqual(inter, {
      n: "Inter",
      k: "Inter",
      v: "usar",
      g: 5,
      c: { leitura: 5, interface: 5, distincao: 5, tom: 4 },
      t: ["legível", "ui"],
      p: ["Sans serif / Interface"],
      l: "OFL",
      y: "Sans serif",
      w: "400–600",
      x: "Corpo de chat e labels. Distingue bem I, l e 1.",
    });
    assert.equal(lucide?.k, "lucide");
    assert.deepEqual(lucide?.s?.slice(0, 2), ["house", "search"]);
  });

  it("leaves out empty fields", () => {
    const roboto = snapshot.fontes.find((item) => item.n === "Roboto");
    assert.equal("v" in (roboto ?? {}), false);
    assert.equal("c" in (roboto ?? {}), false);
    assert.equal(snapshot.em, "2026-10-19T12:00:00.000Z");
  });
});

describe("encodeSnapshot and decodeSnapshot", () => {
  it("round-trips through a URL-safe string", async () => {
    const snapshot = snapshotOf(library, "2026-10-19T12:00:00.000Z");
    const encoded = await encodeSnapshot(snapshot);
    assert.match(encoded, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(await decodeSnapshot(encoded), snapshot);
  });

  it("returns null for anything that is not a snapshot", async () => {
    assert.equal(await decodeSnapshot("not-base64!"), null);
    assert.equal(await decodeSnapshot("AAAA"), null);
    assert.equal(await decodeSnapshot(""), null);
    const wrong = await encodeSnapshot({ v: 2 } as unknown as Snapshot);
    assert.equal(await decodeSnapshot(wrong), null);
  });
});

describe("decodeSnapshot with tampered fields", () => {
  const decoded = async (value: unknown) => decodeSnapshot(await encodeSnapshot(value as Snapshot));
  const base = { v: 1, em: "2026-10-19T12:00:00.000Z", fontes: [], icones: [] };
  const withFont = (item: unknown) => ({ ...base, fontes: [item] });

  it("accepts a snapshot with every field in its type", async () => {
    const full = withFont({
      n: "Inter",
      k: "Inter",
      v: "revisar",
      g: 3,
      c: { leitura: 1, tom: 5 },
      o: { leitura: "pequena demais" },
      t: ["ui"],
      p: ["Sans serif / Interface"],
      s: ["house"],
      l: "OFL",
      y: "Sans serif",
      w: "400–700",
      x: "Notas",
    });
    assert.deepEqual(await decoded({ ...full, resumido: true }), { ...full, resumido: true });
  });

  it("rejects a snapshot without its date", async () => {
    // /ia read snapshot.em.slice and answered 500.
    assert.equal(await decoded({ v: 1, fontes: [{ n: "x" }], icones: [] }), null);
    assert.equal(await decoded({ ...base, em: 20261019 }), null);
  });

  it("rejects a list field that is not a list of strings", async () => {
    // The brief called item.t.join.
    assert.equal(await decoded(withFont({ n: "x", t: "abc" })), null);
    assert.equal(await decoded(withFont({ n: "x", p: [1] })), null);
    assert.equal(await decoded(withFont({ n: "x", s: [null] })), null);
  });

  it("rejects a key that is not a string", async () => {
    // /api/parecidas called family.trim.
    assert.equal(await decoded(withFont({ n: "x", k: 5, v: "usar" })), null);
    assert.equal(await decoded(withFont({ n: "x", k: null })), null);
  });

  it("rejects verdicts and faces outside the scale", async () => {
    assert.equal(await decoded(withFont({ n: "x", v: "talvez" })), null);
    assert.equal(await decoded(withFont({ n: "x", v: "" })), null);
    for (const g of [0, 6, 2.5, "4", null]) {
      assert.equal(await decoded(withFont({ n: "x", g })), null, `g: ${String(g)}`);
    }
    assert.equal(await decoded(withFont({ n: "x", c: { leitura: 7 } })), null);
    assert.equal(await decoded(withFont({ n: "x", c: [4] })), null);
    assert.equal(await decoded(withFont({ n: "x", o: { leitura: 3 } })), null);
  });

  it("rejects other strings, items and lists of the wrong type", async () => {
    for (const key of ["n", "l", "y", "w", "x"]) {
      assert.equal(await decoded(withFont({ n: "x", [key]: 1 })), null, key);
    }
    assert.equal(await decoded(withFont(["x"])), null);
    assert.equal(await decoded({ ...base, icones: {} }), null);
    assert.equal(await decoded({ ...base, resumido: false }), null);
    assert.equal(await decoded([base]), null);
  });
});

describe("encodeSnapshot without CompressionStream", () => {
  const snapshot = snapshotOf(library, "2026-10-19T12:00:00.000Z");

  const withoutCompression = async <T>(run: () => Promise<T>): Promise<T> => {
    const original = globalThis.CompressionStream;
    // Safari < 16.4, Firefox < 113, Chrome < 103.
    Reflect.deleteProperty(globalThis, "CompressionStream");
    try {
      return await run();
    } finally {
      globalThis.CompressionStream = original;
    }
  };

  it("falls back to plain base64url behind a marker that decodes back", async () => {
    const plain = await withoutCompression(() => encodeSnapshot(snapshot));
    assert.match(plain, /^~[A-Za-z0-9_-]+$/);
    assert.deepEqual(await decodeSnapshot(plain), snapshot);
  });

  it("falls back when the format is not supported", async () => {
    const original = globalThis.CompressionStream;
    globalThis.CompressionStream = class {
      constructor() {
        throw new TypeError("Unsupported compression format: 'deflate-raw'");
      }
    } as unknown as typeof CompressionStream;
    try {
      assert.match(await encodeSnapshot(snapshot), /^~/);
    } finally {
      globalThis.CompressionStream = original;
    }
  });

  it("keeps compressed links as they were", async () => {
    assert.doesNotMatch(await encodeSnapshot(snapshot), /~/);
  });

  it("still fits the budget", async () => {
    const { encoded, trimmed } = await withoutCompression(() =>
      fitSnapshot(library, "2026-10-19T12:00:00.000Z", 3000),
    );
    assert.equal(trimmed, true);
    assert.ok(encoded.length <= 3000, `${encoded.length} chars`);
    assert.equal((await decodeSnapshot(encoded))?.resumido, true);
  });

  it("rejects a tampered plain snapshot", async () => {
    const tampered = `~${Buffer.from(JSON.stringify({ ...snapshot, em: 1 })).toString("base64url")}`;
    assert.equal(await decodeSnapshot(tampered), null);
    assert.equal(await decodeSnapshot("~"), null);
    assert.equal(await decodeSnapshot("~~abc"), null);
    assert.equal(await decodeSnapshot("~bm90IGpzb24"), null);
  });
});

describe("fitSnapshot", () => {
  it("fits the seed library whole, well under the budget", async () => {
    const { encoded, trimmed } = await fitSnapshot(library, "2026-10-19T12:00:00.000Z");
    assert.equal(trimmed, false);
    assert.ok(encoded.length < 2500, `${encoded.length} chars`);
  });

  it("drops notes, then unevaluated items, when the library is too big", async () => {
    const big = {
      ...library,
      assets: [
        ...library.assets,
        ...Array.from({ length: 300 }, (_, index) =>
          makeAsset({
            id: `extra-${index}`,
            kind: "font",
            name: `Família ${index} ${"x".repeat(index % 7)}`,
            folderIds: [],
            tags: [`tag-${index}`],
            notes: `Nota longa sobre a família ${index}, com detalhes que ocupam espaço.`,
          }),
        ),
      ],
    };
    const { encoded, trimmed } = await fitSnapshot(big, "2026-10-19T12:00:00.000Z", 3000);
    assert.equal(trimmed, true);
    assert.ok(encoded.length <= 3000, `${encoded.length} chars`);
    const snapshot = await decodeSnapshot(encoded);
    assert.equal(snapshot?.resumido, true);
    assert.ok(
      snapshot?.fontes.some((item) => item.n === "Inter"),
      "evaluated items stay",
    );
    assert.equal(
      snapshot?.fontes.some((item) => item.x),
      false,
      "notes go first",
    );
  });
});
