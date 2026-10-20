// One page per component file of src/components/ui and src/components/library.
// File, exports and props come from the TypeScript types; where it appears
// comes from the imports in the code; the snippet is a real use. Only "Quando
// usar" is written by AI, and the generator keeps it when it regenerates.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import ts from "typescript";

export const PASTAS = { ui: "src/components/ui", library: "src/components/library" };
export const DELIMITADOR = "<<<FIM>>>";
/** Dify's ceiling per chunk (INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH). */
export const MAX_TOKENS = 4000;
export const MARCA_IA = "<!-- Texto gerado por IA. Revise antes de confiar. -->";
export const PENDENTE = "_Pendente: texto a ser escrito por IA._";

const CAMADA = {
  ui: "ui: peça base, sem regra do atelier (em geral um wrapper do Radix).",
  library: "library: peça do atelier, ligada aos stores e às regras da biblioteca.",
};

/** The area of the app a file belongs to, from its path or its folder. */
const AREAS = {
  "src/components/ui": "Base (ui)",
  "src/components/library/browser": "Coleção",
  "src/components/library/sidebar": "Barra lateral",
  "src/components/library/workspace": "Painéis",
  "src/components/library/inspector": "Inspetor",
  "src/components/library/specimen": "Provas",
  "src/components/library/evaluation": "Avaliação",
  "src/components/library/shared": "Compartilhado",
  "src/components/library/atelier.tsx": "Atelier (raiz da tela)",
  "src/components/library/command-palette.tsx": "Paleta ⌘K",
  "src/components/library/import-dialog.tsx": "Diálogo Adicionar",
  "src/components/library/icons.tsx": "Ícones",
};

const posix = (caminho) => caminho.split(sep).join("/");

function areaDe(arquivo) {
  if (AREAS[arquivo]) return AREAS[arquivo];
  const rota = /^src\/routes\/(.+)\.tsx?$/.exec(arquivo)?.[1];
  if (rota) return `Rota /${rota === "index" ? "" : rota.replace(/\/?index$/, "")}`;
  const pasta = posix(dirname(arquivo));
  for (const [prefixo, area] of Object.entries(AREAS)) {
    if (pasta === prefixo || pasta.startsWith(`${prefixo}/`)) return area;
  }
  return "Outro";
}

function arquivosTsx(raiz, pasta) {
  const saida = [];
  const visitar = (relativo) => {
    for (const item of readdirSync(join(raiz, relativo), { withFileTypes: true })) {
      const caminho = `${relativo}/${item.name}`;
      if (item.isDirectory()) visitar(caminho);
      else if (item.name.endsWith(".tsx")) saida.push(caminho);
    }
  };
  if (existsSync(join(raiz, pasta))) visitar(pasta);
  return saida.sort();
}

function arquivosFonte(raiz) {
  const saida = [];
  const visitar = (relativo) => {
    for (const item of readdirSync(join(raiz, relativo), { withFileTypes: true })) {
      const caminho = `${relativo}/${item.name}`;
      if (item.isDirectory()) visitar(caminho);
      else if (/\.tsx?$/.test(item.name) && !/\.(test|gen)\.ts$/.test(item.name))
        saida.push(caminho);
    }
  };
  visitar("src");
  return saida.sort();
}

/** `@/x` and relative specifiers, resolved to a file of the repository. */
function resolver(raiz, de, especificador) {
  let base;
  if (especificador.startsWith("@/")) base = `src/${especificador.slice(2)}`;
  else if (especificador.startsWith(".")) base = posix(join(dirname(de), especificador));
  else return undefined;
  for (const sufixo of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const candidato = `${base}${sufixo}`;
    if (/\.tsx?$/.test(candidato) && existsSync(join(raiz, candidato))) return candidato;
  }
  return undefined;
}

const pascal = (nome) => nome.replace(/(^|-)([a-z0-9])/g, (_, __, letra) => letra.toUpperCase());
const encurtar = (texto, max) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);
const umaLinha = (texto) => texto.replace(/\s+/g, " ").trim();

/** `node_modules/@scope/name/...` -> `@scope/name`; `@types/react` -> `react`. */
function pacoteDe(arquivo) {
  const partes = posix(arquivo).split("/node_modules/").pop().split("/");
  const nome = partes[0].startsWith("@") ? `${partes[0]}/${partes[1]}` : partes[0];
  return nome.startsWith("@types/") ? nome.slice("@types/".length) : nome;
}

function propsDe(checker, tipo, local) {
  const assinatura = tipo.getCallSignatures()[0];
  const parametro = assinatura?.getParameters()[0];
  if (!parametro) return { proprias: [], herdadas: [] };
  const tipoProps = checker.getTypeOfSymbolAtLocation(parametro, local);
  const proprias = [];
  const herdadas = new Map();
  for (const prop of checker.getPropertiesOfType(tipoProps)) {
    const declaracao = prop.declarations?.[0];
    const arquivo = declaracao?.getSourceFile().fileName ?? "";
    if (arquivo.includes("/node_modules/")) {
      const pacote = pacoteDe(arquivo);
      herdadas.set(pacote, (herdadas.get(pacote) ?? 0) + 1);
      continue;
    }
    const tipoProp = checker.getTypeOfSymbolAtLocation(prop, local);
    const opcional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
    proprias.push({
      nome: prop.name,
      tipo: encurtar(
        umaLinha(checker.typeToString(opcional ? checker.getNonNullableType(tipoProp) : tipoProp)),
        100,
      ),
      obrigatoria: !opcional,
      descricao: umaLinha(ts.displayPartsToString(prop.getDocumentationComment(checker))),
    });
  }
  return {
    proprias,
    herdadas: [...herdadas]
      .map(([pacote, total]) => ({ pacote, total }))
      .sort((a, b) => b.total - a.total),
  };
}

const CORTE = 14;

/** Every use in JSX of one of `nomes` in `arquivo`, as trimmed lines. */
function usosEm(fonte, nomes) {
  const usos = [];
  const visitar = (no) => {
    const abertura = ts.isJsxElement(no)
      ? no.openingElement
      : ts.isJsxSelfClosingElement(no)
        ? no
        : undefined;
    if (abertura && nomes.includes(abertura.tagName.getText(fonte))) {
      const inicio = fonte.getLineAndCharacterOfPosition(no.getStart(fonte));
      const [primeira, ...resto] = fonte.text.slice(no.getStart(fonte), no.end).split("\n");
      usos.push([primeira, ...resto.map((l) => l.slice(inicio.character))]);
      return;
    }
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
  return usos;
}

/**
 * A real use from a file that imports the component: the first short use of
 * the main export, else of any export, else the shortest one, cut down.
 */
function trechoDe(programa, importadores, principal, nomes, arquivoDe) {
  const candidatos = [];
  for (const grupo of [[principal], nomes]) {
    for (const de of importadores) {
      const fonte = programa.getSourceFile(arquivoDe(de));
      if (fonte) candidatos.push(...usosEm(fonte, grupo).map((linhas) => ({ de, linhas })));
    }
  }
  if (!candidatos.length) return undefined;
  const escolhido =
    candidatos.find((c) => c.linhas.length <= CORTE) ??
    candidatos.reduce((menor, c) => (c.linhas.length < menor.linhas.length ? c : menor));
  const { linhas } = escolhido;
  const trecho =
    linhas.length > CORTE ? [...linhas.slice(0, CORTE - 1), "  {/* … */}", linhas.at(-1)] : linhas;
  return { de: escolhido.de, codigo: trecho.join("\n") };
}

/**
 * Everything the pages need, read from the code.
 * @param {string} raiz
 */
export function extrairComponentes(raiz) {
  const arquivos = Object.entries(PASTAS).flatMap(([camada, pasta]) =>
    arquivosTsx(raiz, pasta).map((arquivo) => ({ arquivo, camada })),
  );
  const fontes = arquivosFonte(raiz);
  const arquivoDe = (relativo) => posix(join(raiz, relativo));
  const programa = ts.createProgram(fontes.map(arquivoDe), {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    baseUrl: raiz,
    paths: { "@/*": ["./src/*"] },
    types: [],
  });
  const checker = programa.getTypeChecker();

  const importadoresDe = new Map();
  for (const fonte of fontes) {
    const texto = readFileSync(join(raiz, fonte), "utf8");
    for (const [, especificador] of texto.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
      const alvo = resolver(raiz, fonte, especificador);
      if (!alvo || alvo === fonte) continue;
      if (!importadoresDe.has(alvo)) importadoresDe.set(alvo, new Set());
      importadoresDe.get(alvo).add(fonte);
    }
  }

  const vistos = new Map();
  const componentes = [];
  for (const { arquivo, camada } of arquivos) {
    const nome = arquivo
      .split("/")
      .pop()
      .replace(/\.tsx$/, "");
    if (vistos.has(nome)) {
      throw new Error(
        `Dois componentes com o mesmo nome de arquivo: ${vistos.get(nome)} e ${arquivo}`,
      );
    }
    vistos.set(nome, arquivo);
    const fonte = programa.getSourceFile(arquivoDe(arquivo));
    const modulo = fonte && checker.getSymbolAtLocation(fonte);
    if (!modulo) continue;
    const exports = [];
    for (const simbolo of checker.getExportsOfModule(modulo)) {
      if (!/^[A-Z][a-z]/.test(simbolo.name)) continue; // components are PascalCase; NOTE, ASSET are constants
      const declaracao = simbolo.valueDeclaration ?? simbolo.declarations?.[0];
      if (!declaracao) continue;
      const tipo = checker.getTypeOfSymbolAtLocation(simbolo, declaracao);
      if (!tipo.getCallSignatures().length) continue;
      exports.push({
        nome: simbolo.name,
        descricao: umaLinha(ts.displayPartsToString(simbolo.getDocumentationComment(checker))),
        ...propsDe(checker, tipo, declaracao),
      });
    }
    if (!exports.length) continue;
    const titulo = pascal(nome);
    const principal = exports.find((e) => e.nome === titulo) ?? exports[0];
    exports.sort((a, b) => (a === principal ? -1 : b === principal ? 1 : 0));
    const importadores = [...(importadoresDe.get(arquivo) ?? [])].sort();
    componentes.push({
      nome,
      titulo,
      camada,
      arquivo,
      exports,
      ondeAparece: importadores.map((de) => ({ area: areaDe(de), arquivo: de })),
      trecho: trechoDe(
        programa,
        importadores,
        principal.nome,
        exports.map((e) => e.nome),
        arquivoDe,
      ),
    });
  }
  return componentes;
}

/** The AI-written "Quando usar" of an existing page, so regenerating keeps it. */
export function quandoUsarDe(md) {
  const secao = /\n## Quando usar\n\n([\s\S]*?)\n\n## /.exec(md ?? "");
  const texto = secao?.[1].replace(MARCA_IA, "").trim();
  return texto && texto !== PENDENTE ? texto : undefined;
}

/** A conservative token estimate (pt-BR and code run near 3 characters a token). */
export const estimarTokens = (texto) => Math.ceil(texto.length / 3);

const celula = (texto) => texto.replaceAll("|", "\\|");

/**
 * @param {ReturnType<typeof extrairComponentes>[number]} c
 * @param {string | undefined} quandoUsar
 */
export function componenteMd(c, quandoUsar) {
  const metadados = [
    "---",
    `componente: ${c.nome}`,
    `camada: ${c.camada}`,
    `arquivo: ${c.arquivo.toLowerCase()}`,
    `export: ${c.exports.map((e) => e.nome.toLowerCase()).join(", ")}`,
    "---",
  ];
  const props = c.exports.flatMap((e) => {
    const bloco = ["", `### \`${e.nome}\``];
    if (e.descricao) bloco.push("", e.descricao);
    if (e.proprias.length) {
      bloco.push(
        "",
        "| Prop | Tipo | Obrigatória | Descrição |",
        "| --- | --- | --- | --- |",
        ...e.proprias.map(
          (p) =>
            `| \`${p.nome}\` | \`${celula(p.tipo)}\` | ${p.obrigatoria ? "sim" : "não"} | ${celula(p.descricao)} |`,
        ),
      );
    } else if (!e.herdadas.length) {
      bloco.push("", "Sem props.");
    }
    if (e.herdadas.length) {
      const lista = e.herdadas.map((h) => `${h.total} de \`${h.pacote}\``).join(", ");
      bloco.push("", `Também aceita as props herdadas: ${lista}.`);
    }
    return bloco;
  });
  const onde = c.ondeAparece.length
    ? c.ondeAparece.map((o) => `- ${o.area}: \`${o.arquivo}\``)
    : ["Nenhum arquivo importa este componente."];
  const trecho = c.trecho
    ? [`De \`${c.trecho.de}\`:`, "", "```tsx", c.trecho.codigo, "```"]
    : ["Nenhum uso em JSX no código."];
  return [
    ...metadados,
    "",
    `# ${c.titulo}`,
    "",
    "## Camada",
    "",
    CAMADA[c.camada],
    "",
    "## Arquivo",
    "",
    `\`${c.arquivo}\``,
    "",
    "## Export",
    "",
    c.exports.map((e) => `\`${e.nome}\``).join(", "),
    "",
    "## Props",
    ...props,
    "",
    "## Telas onde aparece",
    "",
    ...onde,
    "",
    "## Quando usar",
    "",
    MARCA_IA,
    "",
    quandoUsar ?? PENDENTE,
    "",
    "## Trecho de código",
    "",
    ...trecho,
    "",
    DELIMITADOR,
    "",
  ].join("\n");
}
