import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { flag, fontQueryFrom, iconSetQueryFrom } from "./params.ts";

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
