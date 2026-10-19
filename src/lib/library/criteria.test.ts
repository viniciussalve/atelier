import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  criteriaFor,
  criteriaForSection,
  evaluationStatus,
  formatScore,
  overallScore,
  roundedScore,
  scaleLabel,
  scoredCount,
} from "./criteria.ts";
import type { Asset, Scorecard } from "./types.ts";

type Evaluated = Pick<Asset, "kind" | "criteria" | "verdict">;

function font(criteria: Scorecard, verdict: Asset["verdict"] = ""): Evaluated {
  return { kind: "font", criteria, verdict };
}

const s = (value: 1 | 2 | 3 | 4 | 5 | null, note = "") => ({ value, note });

describe("criteriaFor", () => {
  it("keeps the existing font ids and adds cobertura for icons", () => {
    assert.deepEqual(
      criteriaFor("font").map((c) => c.id),
      ["leitura", "interface", "distincao", "tom"],
    );
    assert.deepEqual(
      criteriaFor("icon").map((c) => c.id),
      ["miudo", "consistencia", "componentes", "cobertura"],
    );
  });

  it("gives every criterion a hint and a weight", () => {
    const all = [...criteriaFor("font"), ...criteriaFor("icon")];
    assert.equal(all.length, 8);
    for (const def of all) {
      assert.ok(def.hint.length > 10, def.id);
      assert.ok([1, 2, 3].includes(def.weight), def.id);
    }
  });

  it("maps specimen sections back to their criteria", () => {
    assert.deepEqual(
      criteriaForSection("font", "criticos").map((c) => c.id),
      ["distincao"],
    );
    assert.deepEqual(
      criteriaForSection("icon", "amostras").map((c) => c.id),
      ["consistencia", "cobertura"],
    );
    assert.deepEqual(criteriaForSection("font", "amostras"), []);
  });
});

describe("overallScore", () => {
  it("is null when nothing is scored", () => {
    assert.equal(overallScore(font({})), null);
    assert.equal(overallScore(font({ leitura: s(null, "só uma nota") })), null);
  });

  it("weights each scored criterion", () => {
    // leitura ×3, interface ×3, distincao ×2, tom ×1
    const score = overallScore(
      font({ leitura: s(5), interface: s(5), distincao: s(5), tom: s(4) }),
    );
    assert.ok(score !== null);
    assert.equal(Math.round(score * 1000) / 1000, Math.round((44 / 9) * 1000) / 1000);
  });

  it("averages only the scored criteria", () => {
    assert.equal(overallScore(font({ leitura: s(4), tom: s(1) })), (12 + 1) / 4);
  });

  it("ignores criteria that belong to the other kind", () => {
    const stale = { leitura: s(2), miudo: s(5) } as Scorecard;
    assert.equal(overallScore(font(stale)), 2);
  });
});

describe("scoredCount", () => {
  it("counts scored criteria against the kind's total", () => {
    assert.deepEqual(scoredCount(font({ leitura: s(3), tom: s(null, "x") })), {
      scored: 1,
      total: 4,
    });
  });
});

describe("evaluationStatus", () => {
  it("is decided once there is a verdict", () => {
    assert.equal(evaluationStatus(font({}, "evitar")), "decidido");
  });

  it("is in progress with any score and no verdict", () => {
    assert.equal(evaluationStatus(font({ tom: s(2) })), "em-avaliacao");
  });

  it("does not count a note alone as progress", () => {
    assert.equal(evaluationStatus(font({ tom: s(null, "rever") })), "nao-avaliado");
  });
});

describe("formatScore", () => {
  it("uses one decimal with a comma", () => {
    assert.equal(formatScore(44 / 9), "4,9");
    assert.equal(formatScore(4), "4,0");
  });

  it("shows a dash for no score", () => {
    assert.equal(formatScore(null), "—");
  });
});

describe("roundedScore", () => {
  it("rounds half up to the nearest face", () => {
    assert.equal(roundedScore(3.4), 3);
    assert.equal(roundedScore(3.5), 4);
    assert.equal(roundedScore(44 / 9), 5);
  });

  it("stays inside the scale and keeps no score as null", () => {
    assert.equal(roundedScore(0.2), 1);
    assert.equal(roundedScore(7), 5);
    assert.equal(roundedScore(null), null);
  });
});

describe("scaleLabel", () => {
  it("names the rounded value with the face labels", () => {
    assert.equal(scaleLabel(1), "Muito ruim");
    assert.equal(scaleLabel(2), "Ruim");
    assert.equal(scaleLabel(3), "Ok");
    assert.equal(scaleLabel(4.4), "Bom");
    assert.equal(scaleLabel(4.6), "Ótimo");
    assert.equal(scaleLabel(null), "Sem nota");
  });
});
