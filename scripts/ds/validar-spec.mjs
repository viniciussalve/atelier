// Checks an InterfaceSpec without AI: the schema, then every token, component,
// source and route it cites against what the atelier really has.
//
// No imports and no I/O on purpose: the same code runs in the CI and in the
// Code node of the Dify app `validar-spec` (ALL-104), so the rule lives in one
// place. In Dify, drop the `export` keywords and add a
// `function main({ spec }) { return validarSpec(spec, { schema, tokens, ... }); }`.

const TOKEN = /--[a-z][a-z0-9-]*/g;

const tipoDe = (valor) => (valor === null ? "null" : Array.isArray(valor) ? "array" : typeof valor);

/** A small JSON Schema subset: what interface-spec.v0.schema.json uses. */
function checarSchema(valor, schema, caminho, erros) {
  const onde = caminho || "(raiz)";
  if ("const" in schema && valor !== schema.const) {
    erros.push(`${onde}: deve ser ${JSON.stringify(schema.const)}.`);
    return;
  }
  if (schema.enum && !schema.enum.includes(valor)) {
    erros.push(`${onde}: deve ser um de ${schema.enum.join(", ")}.`);
    return;
  }
  if (schema.type) {
    const tipo = tipoDe(valor);
    const ok = schema.type === "integer" ? Number.isInteger(valor) : tipo === schema.type;
    if (!ok) {
      erros.push(`${onde}: deve ser ${schema.type === "integer" ? "inteiro" : schema.type}.`);
      return;
    }
  }
  if (typeof valor === "string") {
    if (schema.minLength && valor.length < schema.minLength)
      erros.push(`${onde}: não pode ser vazio.`);
    if (schema.pattern && !new RegExp(schema.pattern).test(valor)) {
      erros.push(`${onde}: não segue o padrão ${schema.pattern}.`);
    }
  }
  if (typeof valor === "number" && schema.minimum !== undefined && valor < schema.minimum) {
    erros.push(`${onde}: deve ser pelo menos ${schema.minimum}.`);
  }
  if (Array.isArray(valor)) {
    if (schema.minItems && valor.length < schema.minItems) {
      erros.push(`${onde}: precisa de pelo menos ${schema.minItems} item.`);
    }
    if (schema.items)
      valor.forEach((item, i) => checarSchema(item, schema.items, `${caminho}[${i}]`, erros));
  }
  if (tipoDe(valor) === "object") {
    const filho = (chave) => (caminho ? `${caminho}.${chave}` : chave);
    for (const chave of schema.required ?? []) {
      if (!(chave in valor)) erros.push(`${onde}: falta o campo obrigatório \`${chave}\`.`);
    }
    if (schema.additionalProperties === false) {
      for (const chave of Object.keys(valor)) {
        if (!(chave in (schema.properties ?? {})))
          erros.push(`${filho(chave)}: campo fora do schema.`);
      }
    }
    for (const [chave, sub] of Object.entries(schema.properties ?? {})) {
      if (chave in valor) checarSchema(valor[chave], sub, filho(chave), erros);
    }
  }
}

function distancia(a, b) {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    anterior = atual;
  }
  return anterior[b.length];
}

/** The real name a typo meant, if one is that close. */
function parecido(nome, validos) {
  let melhor;
  let menor = Infinity;
  for (const valido of validos) {
    const d = distancia(nome, valido);
    if (d < menor) [melhor, menor] = [valido, d];
  }
  return menor <= 2 && menor < nome.length / 3 ? melhor : undefined;
}

function erroDeToken(onde, nome, tokens) {
  const sugestao = parecido(nome, tokens);
  if (sugestao) return `${onde}: \`${nome}\` não existe. Você quis dizer \`${sugestao}\`?`;
  const grupo = nome.split("-")[2];
  const doGrupo = tokens.filter((t) => t.split("-")[2] === grupo);
  const lista = doGrupo.length
    ? `Tokens desse grupo: ${doGrupo.join(", ")}.`
    : `Tokens: ${tokens.join(", ")}.`;
  return `${onde}: \`${nome}\` não existe. ${lista}`;
}

/** Every string under `no`, with its path. */
function* textos(no, caminho) {
  if (typeof no === "string") yield [caminho, no];
  else if (Array.isArray(no)) {
    for (let i = 0; i < no.length; i++) yield* textos(no[i], `${caminho}[${i}]`);
  } else if (no && typeof no === "object") {
    for (const [chave, filho] of Object.entries(no)) {
      yield* textos(filho, caminho ? `${caminho}.${chave}` : chave);
    }
  }
}

/**
 * @param {unknown} entrada the spec, as an object or as JSON text
 * @param {{
 *   schema: object,
 *   tokens?: string[],
 *   componentes?: { nome: string, exports: string[] }[],
 *   rotas?: string[],
 *   fontes?: string[],
 * }} fonte what the atelier has; a list left out is not checked
 * @returns {{ valida: boolean, erros: string[], tokens_rejeitados: string[] }}
 */
export function validarSpec(entrada, { schema, tokens, componentes, rotas, fontes }) {
  let spec = entrada;
  if (typeof entrada === "string") {
    try {
      spec = JSON.parse(entrada);
    } catch {
      return {
        valida: false,
        erros: ["JSON inválido: a spec não pôde ser lida."],
        tokens_rejeitados: [],
      };
    }
  }
  const erros = [];
  const rejeitados = [];
  checarSchema(spec, schema, "", erros);
  if (tipoDe(spec) !== "object") return { valida: false, erros, tokens_rejeitados: [] };
  const lista = (campo) => (Array.isArray(spec[campo]) ? spec[campo] : []);

  if (tokens) {
    const rejeitar = (onde, nome) => {
      if (tokens.includes(nome)) return;
      erros.push(erroDeToken(onde, nome, tokens));
      if (!rejeitados.includes(nome)) rejeitados.push(nome);
    };
    lista("tokens").forEach((t, i) => {
      if (typeof t?.nome === "string") rejeitar(`tokens[${i}].nome`, t.nome);
    });
    // Tokens named in free text count too, `tokens[].uso` included (the names
    // were checked above); `lacunas` may name what is missing.
    const { meta: _meta, lacunas: _lacunas, ...corpo } = spec;
    corpo.tokens = lista("tokens").map((t) => ({ ...t, nome: null }));
    for (const [onde, texto] of textos(corpo, "")) {
      for (const nome of texto.match(TOKEN) ?? []) {
        if (!rejeitados.includes(nome)) rejeitar(onde, nome);
      }
    }
  }

  const checarFonte = (onde, valor) => {
    if (fontes && typeof valor === "string" && !fontes.includes(valor)) {
      erros.push(`${onde}: \`${valor}\` não é um documento das bases.`);
    }
  };
  lista("tokens").forEach((t, i) => checarFonte(`tokens[${i}].fonte`, t?.fonte));

  lista("componentes").forEach((c, i) => {
    if (componentes && typeof c?.nome === "string") {
      const pagina = componentes.find((p) => p.nome === c.nome);
      if (!pagina) {
        const sugestao = parecido(
          c.nome,
          componentes.map((p) => p.nome),
        );
        erros.push(
          `componentes[${i}].nome: \`${c.nome}\` não existe em docs/ds/componentes. ${
            sugestao
              ? `Você quis dizer \`${sugestao}\`?`
              : "Se o atelier não tem, ponha em `lacunas`."
          }`,
        );
      } else if (typeof c.export === "string" && !pagina.exports.includes(c.export)) {
        erros.push(
          `componentes[${i}].export: \`${c.export}\` não é export de \`${c.nome}\`. Exports: ${pagina.exports.join(", ")}.`,
        );
      }
    }
    checarFonte(`componentes[${i}].fonte`, c?.fonte);
  });

  if (rotas) {
    lista("fluxo").forEach((passo, i) => {
      if (typeof passo?.rota !== "string") return;
      const caminho = passo.rota.split(/[?#]/)[0];
      if (!rotas.includes(caminho)) {
        erros.push(
          `fluxo[${i}].rota: \`${caminho}\` não é uma rota do atelier. Rotas: ${rotas.join(", ")}.`,
        );
      }
    });
  }

  return { valida: erros.length === 0, erros, tokens_rejeitados: rejeitados };
}
