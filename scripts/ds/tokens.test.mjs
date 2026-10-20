import assert from "node:assert/strict";
import { test } from "node:test";
import { lerTokens, lerTokensCss, lerTokensDtcg, tokensMd } from "./tokens.mjs";

const CSS = `@import "tailwindcss";

@theme {
  --color-bg: #0c0d10;
  /* Non-photo blue: the pencil designers mark proofs with. Focus, the active
     pane. \`proof-ink\` is the same mark on paper. */
  --color-proof: #93cfe4;
  --color-proof-ink: #2b7894;
  /* Verdicts: usar, revisar, evitar. */
  --color-good: #8fcf9f;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --radius-md: 10px;
}

@layer base {
  body {
    --not-a-token: 1px;
  }
}
`;

test("reads only the @theme block, in order, with group and value", () => {
  const tokens = lerTokensCss(CSS);
  assert.deepEqual(
    tokens.map((t) => [t.nome, t.grupo, t.valor]),
    [
      ["--color-bg", "color", "#0c0d10"],
      ["--color-proof", "color", "#93cfe4"],
      ["--color-proof-ink", "color", "#2b7894"],
      ["--color-good", "color", "#8fcf9f"],
      ["--font-mono", "font", '"IBM Plex Mono", ui-monospace, monospace'],
      ["--radius-md", "radius", "10px"],
    ],
  );
});

test("a comment notes the tokens below it until the next comment or group", () => {
  const nota = Object.fromEntries(lerTokensCss(CSS).map((t) => [t.nome, t.nota]));
  assert.equal(nota["--color-bg"], "");
  assert.match(nota["--color-proof"], /^Non-photo blue: .* the active pane\. `proof-ink`/);
  assert.equal(nota["--color-proof-ink"], nota["--color-proof"]);
  assert.equal(nota["--color-good"], "Verdicts: usar, revisar, evitar.");
  assert.equal(nota["--font-mono"], "");
});

test("names the Tailwind utility each token becomes", () => {
  const classe = Object.fromEntries(lerTokensCss(CSS).map((t) => [t.nome, t.classe]));
  assert.equal(classe["--color-proof"], "bg-proof, text-proof, border-proof");
  assert.equal(classe["--font-mono"], "font-mono");
  assert.equal(classe["--radius-md"], "rounded-md");
});

test("fails loudly when there is no @theme block", () => {
  assert.throws(() => lerTokensCss("body { color: red; }"), /@theme/);
});

test("reads DTCG JSON into the same names", () => {
  const dtcg = {
    color: {
      $type: "color",
      bg: { $value: "#0c0d10" },
      proof: { $value: "#93cfe4", $description: "Focus." },
    },
    radius: { md: { $value: "10px", $type: "dimension" } },
  };
  assert.deepEqual(
    lerTokensDtcg(JSON.stringify(dtcg)).map((t) => [t.nome, t.grupo, t.valor, t.nota]),
    [
      ["--color-bg", "color", "#0c0d10", ""],
      ["--color-proof", "color", "#93cfe4", "Focus."],
      ["--radius-md", "radius", "10px", ""],
    ],
  );
});

test("DTCG structured values become CSS", () => {
  const dtcg = {
    color: {
      proof: { $value: { colorSpace: "srgb", components: [0.6, 0.8, 0.9], hex: "#93cfe4" } },
    },
    radius: { md: { $value: { value: 10, unit: "px" } } },
    font: { sans: { $value: ["IBM Plex Sans", "sans-serif"] } },
  };
  assert.deepEqual(
    lerTokensDtcg(JSON.stringify(dtcg)).map((t) => t.valor),
    ["#93cfe4", "10px", '"IBM Plex Sans", sans-serif'],
  );
});

test("picks the reader by extension", () => {
  assert.equal(lerTokens("src/styles.css", CSS).length, 6);
  assert.equal(
    lerTokens("tokens.json", '{"color":{"bg":{"$value":"#000"}}}')[0].nome,
    "--color-bg",
  );
  assert.throws(() => lerTokens("tokens.yaml", ""), /formato/);
});

test("tokens.md lists every token under its group, with the source", () => {
  const md = tokensMd(lerTokensCss(CSS), "src/styles.css");
  assert.match(md, /^# Tokens do atelier\n/);
  assert.match(md, /Fonte: `src\/styles\.css`/);
  assert.match(md, /## Cores \(4\)/);
  assert.match(
    md,
    /\| `--color-good` \| `#8fcf9f` \| `bg-good, text-good, border-good` \| Verdicts: usar, revisar, evitar\. \|/,
  );
  assert.match(md, /## Raios \(1\)/);
  // Pipes inside a note would break the table.
  const piped = tokensMd([{ ...lerTokensCss(CSS)[0], nota: "a | b" }], "x.css");
  assert.match(piped, /a \\\| b/);
});
