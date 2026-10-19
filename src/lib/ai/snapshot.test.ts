import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeSnapshot,
  encodeSnapshot,
  fitSnapshot,
  snapshotFromLink,
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

describe("snapshotFromLink", () => {
  it("takes the b value from a link, a pasted line or the bare value", () => {
    assert.equal(snapshotFromLink("https://atelier.app/ia?b=abc_-1"), "abc_-1");
    assert.equal(snapshotFromLink("  abc_-1 "), "abc_-1");
    assert.equal(snapshotFromLink("veja atelier.app/ia?b=xyz9 e me diga"), "xyz9");
    assert.equal(snapshotFromLink("https://atelier.app/ia"), "");
  });
});
