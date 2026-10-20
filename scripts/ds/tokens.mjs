// Reads the design tokens from their single source. Today that is the
// `@theme` block of src/styles.css; if the tokens move to DTCG JSON, only the
// reader changes and tokens.md keeps its format.

/** @typedef {{ nome: string, grupo: string, valor: string, nota: string, classe: string }} Token */

const GRUPOS = { color: "Cores", font: "Fontes", radius: "Raios" };

/** Tailwind v4 turns each theme variable into utilities named after it. */
function classeDe(nome) {
  const [, grupo, resto] = /^--([a-z]+)-(.+)$/.exec(nome) ?? [];
  if (grupo === "color") return `bg-${resto}, text-${resto}, border-${resto}`;
  if (grupo === "font") return `font-${resto}`;
  if (grupo === "radius") return `rounded-${resto}`;
  return "";
}

function token(nome, valor, nota) {
  return { nome, grupo: nome.slice(2).split("-")[0], valor, nota, classe: classeDe(nome) };
}

/**
 * Tokens of the `@theme` block, in source order. A comment notes the tokens
 * right below it, until the next comment or the next group.
 * @param {string} css
 * @returns {Token[]}
 */
export function lerTokensCss(css) {
  const bloco = /@theme\s*\{([\s\S]*?)\n\}/.exec(css);
  if (!bloco) throw new Error("Nenhum bloco @theme na fonte de tokens.");
  const tokens = [];
  let nota = "";
  let grupoDaNota = "";
  const partes = bloco[1].matchAll(/\/\*([\s\S]*?)\*\/|(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/g);
  for (const [, comentario, nome, valor] of partes) {
    if (comentario !== undefined) {
      nota = comentario.replace(/\s+/g, " ").trim();
      grupoDaNota = "";
      continue;
    }
    const novo = token(nome, valor.trim(), nota);
    if (nota && grupoDaNota && grupoDaNota !== novo.grupo) {
      nota = "";
      novo.nota = "";
    }
    grupoDaNota = novo.grupo;
    tokens.push(novo);
  }
  return tokens;
}

/** A DTCG `$value` as CSS: dimensions and colors may be objects, families lists. */
function valorDtcg(valor) {
  if (typeof valor !== "object" || valor === null) return String(valor);
  if (Array.isArray(valor)) return valor.map((v) => (/\s/.test(v) ? `"${v}"` : v)).join(", ");
  if ("value" in valor && "unit" in valor) return `${valor.value}${valor.unit}`;
  if (typeof valor.hex === "string") return valor.hex;
  return JSON.stringify(valor);
}

/**
 * DTCG JSON: the key path becomes the name, `--group-name`.
 * @param {string} texto
 * @returns {Token[]}
 */
export function lerTokensDtcg(texto) {
  const tokens = [];
  const visitar = (no, caminho) => {
    if (!no || typeof no !== "object") return;
    if ("$value" in no) {
      tokens.push(token(`--${caminho.join("-")}`, valorDtcg(no.$value), no.$description ?? ""));
    }
    for (const [chave, filho] of Object.entries(no)) {
      if (!chave.startsWith("$")) visitar(filho, [...caminho, chave]);
    }
  };
  visitar(JSON.parse(texto), []);
  return tokens;
}

/**
 * @param {string} caminho
 * @param {string} texto
 * @returns {Token[]}
 */
export function lerTokens(caminho, texto) {
  if (caminho.endsWith(".css")) return lerTokensCss(texto);
  if (caminho.endsWith(".json")) return lerTokensDtcg(texto);
  throw new Error(`Fonte de tokens em formato desconhecido: ${caminho}`);
}

const celula = (texto) => texto.replaceAll("|", "\\|");

/**
 * @param {Token[]} tokens
 * @param {string} fonte path of the source, as the repository names it
 */
export function tokensMd(tokens, fonte) {
  const linhas = [
    "# Tokens do atelier",
    "",
    `Fonte: \`${fonte}\`. Gerado por \`npm run ds:gerar\`, sem IA: não edite à mão.`,
    "",
    "Use sempre o nome exato. Um nome que não está nesta lista não existe no atelier.",
  ];
  const grupos = [...new Set(tokens.map((t) => t.grupo))];
  for (const grupo of grupos) {
    const doGrupo = tokens.filter((t) => t.grupo === grupo);
    linhas.push(
      "",
      `## ${GRUPOS[grupo] ?? grupo} (${doGrupo.length})`,
      "",
      "| Token | Valor | Classe Tailwind | Nota |",
      "| --- | --- | --- | --- |",
      ...doGrupo.map(
        (t) =>
          `| \`${t.nome}\` | \`${celula(t.valor)}\` | ${t.classe ? `\`${t.classe}\`` : ""} | ${celula(t.nota)} |`,
      ),
    );
  }
  return linhas.join("\n") + "\n";
}
