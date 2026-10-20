// First layer of the evaluation (ALL-97): every case of the test set goes to
// the pilot flow (ALL-93) through the Dify API, each spec that comes back is
// checked by the same validator as the CI, and the metrics of the evaluation
// plan come out. Each round is kept with its date and compared with the last.
//
//   DIFY_API_URL=http://localhost:8080/v1 DIFY_SPEC_API_KEY=app-… \
//     npm run ds:avaliar [-- --casos T19,T20]
//
// The key stays in the environment: it is never written to a file.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ } from "./raiz.mjs";
import { fonteDoAtelier } from "./validar.mjs";
import { validarSpec } from "./validar-spec.mjs";

export const CONJUNTO = "docs/ecossistema-dify/qualidade/conjunto-teste-v0.csv";
export const RODADAS = "docs/ecossistema-dify/qualidade/rodadas";

/** RFC 4180 CSV: quoted fields may hold commas, line breaks and `""`. */
export function lerCsv(texto) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo || linha.length) linhas.push([...linha, campo]);
  const [cabecalho, ...resto] = linhas.filter((l) => l.some((v) => v !== ""));
  return resto.map((l) => Object.fromEntries(cabecalho.map((nome, i) => [nome, l[i] ?? ""])));
}

/** The cases of the test set, with the screen request out of "Pedido: …". */
export function casosDe(csv) {
  return lerCsv(csv).map((l) => ({
    id: l.id,
    camada: l.camada,
    tipo: l.tipo,
    pedido: l.entrada.replace(/^Pedido:\s*/, ""),
    esperado: l.resposta_esperada,
  }));
}

const NAO_MEDIDOS = new Set(["negativo", "ambiguo"]);

/**
 * One case against the spec the flow returned.
 * @param {{ id: string, camada: string, tipo: string, esperado: string }} caso
 * @param {any} spec undefined when the flow returned none
 * @param {object} fonte what a spec may cite (fonteDoAtelier)
 * @param {string} [erroFluxo] why the flow returned no spec
 */
export function avaliarCaso(caso, spec, fonte, erroFluxo = "sem resposta") {
  const base = { id: caso.id, camada: caso.camada, tipo: caso.tipo, esperado: caso.esperado };
  // The InterfaceSpec has no field for "this is a violation", so negative
  // cases (exceptions that must not be flagged) cannot be measured on it.
  base.medido = !NAO_MEDIDOS.has(caso.tipo);
  if (spec === undefined) {
    return {
      ...base,
      valida: false,
      erros: [`O fluxo não devolveu spec: ${erroFluxo}`],
      respondeu: false,
      tokens_inventados: [],
      componentes_inventados: [],
      inventou_na_primeira: false,
      tentativas: null,
      versoes: null,
      ...(caso.tipo === "armadilha" ? { armadilha_ok: false } : {}),
      ...(caso.camada === "token" && caso.tipo === "positivo" ? { token_certo: false } : {}),
    };
  }
  const v = validarSpec(spec, fonte);
  // The contract has `pedido` repeat the request: a spec for another case
  // (a cache, a mix-up) must not pass as this one's.
  const normal = (t) => (typeof t === "string" ? t.replace(/\s+/g, " ").trim() : t);
  if (caso.pedido !== undefined && normal(spec?.pedido) !== normal(caso.pedido)) {
    v.valida = false;
    v.erros = [...v.erros, "pedido: a spec não repete o pedido enviado ao fluxo."];
  }
  const nomes = Array.isArray(spec?.tokens) ? spec.tokens.map((t) => t?.nome) : [];
  const r = {
    ...base,
    valida: v.valida,
    erros: v.erros,
    respondeu: true,
    tokens_inventados: v.tokens_rejeitados,
    componentes_inventados: v.erros.filter((e) => /^componentes\[\d+\]\.(nome|export):/.test(e)),
    inventou_na_primeira: (spec?.meta?.tokens_rejeitados?.length ?? 0) > 0,
    tentativas: typeof spec?.meta?.tentativas === "number" ? spec.meta.tentativas : null,
    // The flow fills these from its environment, so a round says which
    // flow and prompt produced it even when the API URL stays the same.
    versoes: { flow: spec?.meta?.flow_version ?? null, prompt: spec?.meta?.prompt_version ?? null },
  };
  if (caso.camada === "token" && caso.tipo === "positivo")
    r.token_certo = nomes.includes(caso.esperado);
  if (caso.tipo === "armadilha") {
    // A screen request that asks for something the atelier lacks (T21) is
    // only passed when the spec says so in `lacunas`, not when it just omits it.
    const disseQueFalta = caso.camada !== "spec" || (spec?.lacunas?.length ?? 0) > 0;
    r.armadilha_ok =
      v.tokens_rejeitados.length === 0 && r.componentes_inventados.length === 0 && disseQueFalta;
    if (!disseQueFalta)
      r.erros = [...r.erros, "armadilha sem `lacunas`: a spec não disse o que falta"];
  }
  return r;
}

const fracao = (lista, ok) => (lista.length ? lista.filter(ok).length / lista.length : null);

function metrica(valor, criterio, passa, bloqueia) {
  return {
    valor,
    criterio,
    passou: valor === null || passa === null ? null : passa(valor),
    bloqueia,
  };
}

/** The metrics of plano-avaliacao-v0.md; only the blocking ones gate the round. */
export function metricas(resultados) {
  const positivos = resultados.filter((r) => "token_certo" in r);
  const armadilhas = resultados.filter((r) => "armadilha_ok" in r);
  // A run that returned no spec fails spec válida, but says nothing about
  // invention: it stays out of those denominators.
  const respondidos = resultados.filter((r) => r.respondeu);
  const tentativas = resultados.map((r) => r.tentativas).filter((t) => t !== null);
  const m = {
    spec_valida: metrica(
      fracao(resultados, (r) => r.valida),
      "= 100%",
      (v) => v === 1,
      true,
    ),
    token_certo: metrica(
      fracao(positivos, (r) => r.token_certo),
      "≥ 90%",
      (v) => v >= 0.9,
      false,
    ),
    token_inventado_primeira: metrica(
      fracao(respondidos, (r) => r.inventou_na_primeira),
      "≤ 5%",
      (v) => v <= 0.05,
      false,
    ),
    token_inventado_final: metrica(
      fracao(respondidos, (r) => r.tokens_inventados.length > 0),
      "= 0%",
      (v) => v === 0,
      true,
    ),
    falso_positivo: metrica(null, "≤ 5%", null, false),
    armadilha: metrica(
      fracao(armadilhas, (r) => r.armadilha_ok),
      "= 100%",
      (v) => v === 1,
      true,
    ),
    tentativas_medias: metrica(
      tentativas.length ? tentativas.reduce((a, b) => a + b, 0) / tentativas.length : null,
      "acompanhar",
      null,
      false,
    ),
  };
  m.aprovada = Object.values(m).every((x) => !x.bloqueia || x.passou !== false);
  return m;
}

/** Metrics where a lower number is better. */
const MENOR_MELHOR = new Set([
  "token_inventado_primeira",
  "token_inventado_final",
  "falso_positivo",
  "tentativas_medias",
]);

export function compararRodadas(anterior, atual) {
  if (!anterior) return [];
  return Object.entries(atual.metricas)
    .filter(([, m]) => typeof m?.valor === "number")
    .filter(([nome]) => typeof anterior.metricas?.[nome]?.valor === "number")
    .map(([nome, m]) => {
      const antes = anterior.metricas[nome].valor;
      const piorou = MENOR_MELHOR.has(nome) ? m.valor > antes : m.valor < antes;
      return { metrica: nome, antes, agora: m.valor, piorou };
    });
}

/** Every flow/prompt version pair seen in a round; more than one means it changed mid-run. */
export function versoesDe(resultados) {
  const vistas = new Map();
  for (const r of resultados) {
    if (r.versoes) vistas.set(`${r.versoes.flow}|${r.versoes.prompt}`, r.versoes);
  }
  return [...vistas.values()];
}

const ROTULOS = {
  spec_valida: "Spec válida",
  token_certo: "Token certo",
  // tokens_rejeitados holds every attempt before the last (contract v0), so
  // this is "before the correction", the plan's formula, not attempt one alone.
  token_inventado_primeira: "Token inventado (antes da correção)",
  token_inventado_final: "Token inventado (final)",
  falso_positivo: "Falso positivo",
  armadilha: "Armadilha",
  tentativas_medias: "Tentativas médias",
};

const mostrar = (nome, valor) =>
  valor === null
    ? "não medido"
    : nome === "tentativas_medias"
      ? valor.toFixed(2)
      : `${Math.round(valor * 100)}%`;
const simNao = (v) => (v === null ? "—" : v ? "sim" : "não");

function motivos(r) {
  const saida = [];
  if (r.tokens_inventados.length)
    saida.push(`tokens inventados: ${r.tokens_inventados.join(", ")}`);
  if (r.componentes_inventados.length) saida.push(...r.componentes_inventados);
  if (r.token_certo === false) saida.push(`não veio o token esperado ${r.esperado}`);
  const outros = r.erros.filter(
    (e) =>
      !r.tokens_inventados.some((t) => e.includes(`\`${t}\``)) &&
      !r.componentes_inventados.includes(e),
  );
  return [...saida, ...outros];
}

export function relatorioMd({ data, fluxo, versoes = [], resultados, metricas: m, comparacao }) {
  const linhas = [
    `# Rodada de avaliação · ${data}`,
    "",
    `Fluxo: \`${fluxo}\` · versões: ${versoes.map((v) => `flow ${v.flow}, prompt ${v.prompt}`).join("; ") || "nenhuma spec voltou"} · ${resultados.length} casos · ${m.aprovada ? "**Aprovada**" : "**Reprovada**"} (bloqueiam: spec válida, token inventado final e armadilha)`,
    "",
    "| Métrica | Valor | Critério | Passou | Bloqueia |",
    "| --- | --- | --- | --- | --- |",
    ...Object.entries(ROTULOS).map(
      ([nome, rotulo]) =>
        `| ${rotulo} | ${mostrar(nome, m[nome].valor)} | ${m[nome].criterio} | ${simNao(m[nome].passou)} | ${m[nome].bloqueia ? "sim" : "não"} |`,
    ),
  ];
  const semBusca = resultados.filter((r) => r.componentes_recuperados === 0).map((r) => r.id);
  if (semBusca.length) {
    linhas.push(
      "",
      `**Atenção:** a busca de componentes voltou vazia em ${semBusca.length} de ${resultados.length} casos (${semBusca.join(", ")}). Neles, componentes e a armadilha de tela (T21) não medem nada: sem contexto, o modelo não conhece os componentes e quase toda spec traz alguma lacuna.`,
    );
  }
  if (comparacao.length) {
    linhas.push("", "## Comparado com a rodada anterior", "");
    for (const c of comparacao) {
      const marca = c.piorou ? "piorou" : c.agora === c.antes ? "igual" : "melhorou";
      linhas.push(
        `- ${ROTULOS[c.metrica]}: ${mostrar(c.metrica, c.antes)} → ${mostrar(c.metrica, c.agora)} (${marca})`,
      );
    }
  }
  const falhas = resultados.map((r) => [r.id, motivos(r)]).filter(([, lista]) => lista.length);
  linhas.push("", "## Casos com problema", "");
  if (falhas.length) linhas.push(...falhas.map(([id, lista]) => `- ${id}: ${lista.join("; ")}`));
  else linhas.push("Nenhum.");
  const naoMedidos = resultados.filter((r) => !r.medido).map((r) => r.id);
  if (naoMedidos.length) {
    linhas.push(
      "",
      `Critério do caso não medido em ${naoMedidos.join(", ")}: os negativos pedem um campo de violação que a InterfaceSpec v0 não tem. A spec deles ainda conta em spec válida.`,
    );
  }
  return linhas.join("\n") + "\n";
}

/**
 * Runs the pilot flow once over the Dify workflow API, in streaming mode
 * (ALL-93: the blocking timeout of self-hosted Dify is not documented).
 * @returns {Promise<{ spec?: any, erro?: string }>}
 */
export async function rodarFluxo(
  pedido,
  { url, chave, fetch = globalThis.fetch, campo = "pedido" },
) {
  let resposta;
  try {
    resposta = await fetch(`${url.replace(/\/+$/, "")}/workflows/run`, {
      method: "POST",
      headers: { authorization: `Bearer ${chave}`, "content-type": "application/json" },
      body: JSON.stringify({
        inputs: { [campo]: pedido },
        response_mode: "streaming",
        user: "atelier-avaliador",
      }),
      signal: AbortSignal.timeout(300_000),
    });
  } catch (e) {
    return { erro: `sem conexão com o Dify (${e.message})` };
  }
  let texto;
  try {
    texto = await resposta.text();
  } catch (e) {
    return { erro: `o stream caiu no meio (${e.message})` };
  }
  if (!resposta.ok) return { erro: `HTTP ${resposta.status}: ${texto.slice(0, 200)}` };
  for (const bloco of texto.split(/\r?\n\r?\n/)) {
    const dados = bloco
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("");
    if (!dados) continue;
    let evento;
    try {
      evento = JSON.parse(dados);
    } catch {
      continue;
    }
    if (evento.event === "error")
      return { erro: `erro do Dify: ${evento.message ?? "sem mensagem"}` };
    if (evento.event !== "workflow_finished") continue;
    const { status, error, outputs } = evento.data ?? {};
    if (status !== "succeeded") return { erro: `fluxo ${status}: ${error ?? "sem mensagem"}` };
    if (outputs?.spec === undefined || outputs.spec === null) {
      return { erro: "o fluxo terminou sem `spec` nas saídas" };
    }
    // The pilot says how many component chunks it found; older flows don't.
    const componentes_recuperados =
      typeof outputs.componentes_recuperados === "number" ? outputs.componentes_recuperados : null;
    if (typeof outputs.spec !== "string") return { spec: outputs.spec, componentes_recuperados };
    try {
      return { spec: JSON.parse(outputs.spec), componentes_recuperados };
    } catch {
      return { erro: "a `spec` devolvida não é JSON" };
    }
  }
  return { erro: "o stream acabou sem workflow_finished" };
}

/** The last round over the same cases: a partial run is not compared with a full one. */
export function ultimaRodada(raiz, casos) {
  let nomes = [];
  try {
    nomes = readdirSync(join(raiz, RODADAS)).filter((n) => n.endsWith(".json"));
  } catch {
    return undefined;
  }
  const mesmos = (r) =>
    r.casos?.length === casos.length && r.casos.every((id, k) => id === casos[k]);
  return nomes
    .sort()
    .reverse()
    .map((n) => JSON.parse(readFileSync(join(raiz, RODADAS, n), "utf8")))
    .find(mesmos);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.DIFY_API_URL;
  const chave = process.env.DIFY_SPEC_API_KEY;
  if (!url || !chave) {
    console.error(
      "Defina DIFY_API_URL (ex.: http://localhost:8080/v1) e DIFY_SPEC_API_KEY (chave de API do fluxo piloto).",
    );
    process.exit(2);
  }
  const posicao = process.argv.indexOf("--casos");
  const filtro =
    posicao === -1 ? undefined : (process.argv[posicao + 1] ?? "").split(",").filter(Boolean);
  const todos = casosDe(readFileSync(join(RAIZ, CONJUNTO), "utf8"));
  const desconhecidos = (filtro ?? []).filter((id) => !todos.some((c) => c.id === id));
  if (filtro && (!filtro.length || desconhecidos.length)) {
    console.error(
      `Casos que não existem no conjunto: ${desconhecidos.join(", ") || "(nenhum pedido)"}`,
    );
    process.exit(2);
  }
  const casos = todos.filter((c) => !filtro || filtro.includes(c.id));
  const fonte = fonteDoAtelier();
  const resultados = [];
  for (const caso of casos) {
    const r = await rodarFluxo(caso.pedido, { url, chave });
    resultados.push({
      ...avaliarCaso(caso, r.spec, fonte, r.erro),
      componentes_recuperados: r.componentes_recuperados ?? null,
    });
    console.error(`${caso.id} ${r.spec ? "ok" : `sem spec: ${r.erro}`}`);
  }
  const data = new Date().toISOString();
  const atual = {
    data,
    fluxo: url,
    versoes: versoesDe(resultados),
    casos: casos.map((c) => c.id),
    metricas: metricas(resultados),
    resultados,
  };
  atual.comparacao = compararRodadas(ultimaRodada(RAIZ, atual.casos), atual);
  const md = relatorioMd(atual);
  // Milliseconds in the name, so two rounds in the same second both stay.
  const nome = data.replaceAll(":", "").replace(".", "-");
  mkdirSync(join(RAIZ, RODADAS), { recursive: true });
  writeFileSync(join(RAIZ, RODADAS, `${nome}.json`), JSON.stringify(atual, null, 2) + "\n");
  writeFileSync(join(RAIZ, RODADAS, `${nome}.md`), md);
  console.log(md);
  console.error(`Rodada guardada em ${RODADAS}/${nome}.{json,md}`);
  process.exit(atual.metricas.aprovada ? 0 : 1);
}
