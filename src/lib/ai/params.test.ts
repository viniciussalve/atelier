import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { flag, fontQueryFrom, iconSetQueryFrom, int, listParam } from "./params.ts";

describe("flag", () => {
  it("reads yes and no in Portuguese and English", () => {
    assert.equal(flag("sim"), true);
    assert.equal(flag("Não"), false);
    assert.equal(flag("true"), true);
    assert.equal(flag("talvez"), undefined);
    assert.equal(flag(null), undefined);
  });
});

describe("fontQueryFrom", () => {
  it("maps Portuguese categories and flags", () => {
    const query = fontQueryFrom(
      new URLSearchParams("q=inter&categoria=Monoespaçada&variavel=sim&alfabeto=Cyrillic&limite=5"),
    );
    assert.deepEqual(query, {
      q: "inter",
      category: "monospace",
      variable: true,
      subset: "cyrillic",
      limit: 5,
    });
  });

  it("leaves unknown values unset", () => {
    assert.deepEqual(fontQueryFrom(new URLSearchParams("categoria=gótica&limite=x")), {
      q: undefined,
      category: undefined,
      variable: undefined,
      subset: undefined,
      limit: undefined,
    });
  });
});

describe("iconSetQueryFrom", () => {
  it("reads grid, stroke, color and license", () => {
    assert.deepEqual(
      iconSetQueryFrom(new URLSearchParams("q=home&grade=24&traco=sim&colorido=nao&licenca=MIT")),
      {
        q: "home",
        category: undefined,
        grid: 24,
        stroke: true,
        palette: false,
        license: "MIT",
        limit: undefined,
      },
    );
  });
});

describe("int", () => {
  it("reads a whole number and leaves anything else unset, never NaN", () => {
    assert.equal(int("12"), 12);
    assert.equal(int(" 7 "), 7);
    assert.equal(int("x"), undefined);
    assert.equal(int(""), undefined);
    assert.equal(int("Infinity"), undefined);
    assert.equal(int(null), undefined);
  });
});

describe("listParam", () => {
  it("splits on commas, trims, lowercases and drops blanks", () => {
    assert.deepEqual(listParam(" Lucide, tabler ,,MDI "), ["lucide", "tabler", "mdi"]);
  });

  it("reads a repeated parameter, with commas inside each value", () => {
    assert.deepEqual(listParam(["lucide,tabler", "mdi"]), ["lucide", "tabler", "mdi"]);
  });

  it("keeps the first of repeated entries and caps the list", () => {
    assert.deepEqual(listParam("a,b,A,c"), ["a", "b", "c"]);
    assert.deepEqual(listParam("a,b,c", 2), ["a", "b"]);
    assert.equal(listParam(Array.from({ length: 20 }, (_, i) => `s${i}`)).length, 16);
  });

  it("ignores what is not text", () => {
    assert.deepEqual(listParam(null), []);
    assert.deepEqual(listParam(undefined), []);
    assert.deepEqual(listParam(42), []);
    assert.deepEqual(listParam(["mdi", 3, null]), ["mdi"]);
  });
});
