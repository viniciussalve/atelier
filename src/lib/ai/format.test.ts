import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { iconSetsFrom } from "./catalog.ts";
import { fontJson, fontLine, iconSetLine, listMarkdown } from "./format.ts";
import { FONTS, ICON_INFO } from "./test-fixtures.ts";

describe("catalog Markdown", () => {
  it("describes a font with what to paste in the add link", () => {
    assert.equal(
      fontLine(FONTS[1]),
      "- **Inter Tight**: Sans serif, variável (wght 100–900), pesos 100–900, sem itálico, OFL. Adicionar: `fonte:Inter Tight`",
    );
    assert.equal(fontJson(FONTS[2]).adicionar, "fonte:Ubuntu");
  });

  it("describes an icon set with count, grid, style and samples", () => {
    const lucide = iconSetsFrom(ICON_INFO).find((set) => set.prefix === "lucide")!;
    assert.equal(
      iconSetLine(lucide),
      "- **Lucide** (`lucide`): 1.891 ícones, grade 24, contorno, ISC. Amostras: circle-check, award, house. Adicionar: `icones:lucide`",
    );
  });

  it("says when nothing matched", () => {
    assert.equal(listMarkdown("Fontes", []), "# Fontes\n\nNada encontrado.\n");
  });
});
