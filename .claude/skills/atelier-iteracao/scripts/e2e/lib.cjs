// Utilitários de Playwright para verificar o Atelier no navegador.
// Use via run.sh, que define BASE_URL, SHOTS, ATELIER_PLAYWRIGHT e o ambiente do proxy.
// Carrega o Playwright global pelo caminho: dentro do repositório, require("playwright")
// acharia o do projeto, que espera outro build do Chromium.
const { chromium } = require(process.env.ATELIER_PLAYWRIGHT || "playwright");

const BASE = process.env.BASE_URL || "http://127.0.0.1:8080/";
const SHOTS = process.env.SHOTS || "screenshots";

/** Ícones de mentira com formas variadas por nome; "nao-existe…" responde 404 (ícone ausente). */
async function mockIconify(context) {
  await context.route("https://api.iconify.design/**", (route) => {
    const url = new URL(route.request().url());
    const name = url.pathname.split("/").pop().replace(".svg", "");
    if (name.startsWith("nao-existe")) return route.fulfill({ status: 404, body: "" });
    const color = url.searchParams.get("color") ?? "#000";
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
    const shapes = [
      `<circle cx="12" cy="12" r="8"/>`,
      `<rect x="4" y="4" width="16" height="16" rx="4"/>`,
      `<path d="M4 18 L12 5 L20 18 Z"/>`,
      `<path d="M5 12h14M12 5v14"/>`,
      `<path d="M4 7h16M4 12h16M4 17h10"/>`,
    ];
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes[hash % shapes.length]}</svg>`,
    });
  });
}

/**
 * Abre um navegador com contexto limpo (localStorage vazio).
 * `init` roda antes da página (ex.: preparar localStorage).
 */
async function open({ width = 1440, height = 900, init } = {}) {
  const browser = await chromium.launch({
    proxy: process.env.HTTPS_PROXY
      ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" }
      : undefined,
  });
  const context = await browser.newContext({ viewport: { width, height } });
  await mockIconify(context);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || /hydrat/i.test(message.text())) {
      errors.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  return { browser, context, page, errors };
}

async function goto(page, path = "") {
  await page.goto(new URL(path, BASE).toString(), { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

async function shot(page, name) {
  const path = `${SHOTS}/${name}.png`;
  await page.screenshot({ path });
  console.log(`screenshot: ${path}`);
  return path;
}

/** Afirmação com nome legível: imprime "ok …" ou lança com o nome. */
async function check(name, predicate) {
  const result = await predicate();
  if (!result) throw new Error(`falhou: ${name}`);
  console.log(`ok ${name}`);
}

/** Erros de página que importam (os 404 do Iconify simulado são esperados). */
function realErrors(errors) {
  return errors.filter((error) => !/status of 404/.test(error));
}

module.exports = { open, goto, shot, check, realErrors, BASE, SHOTS };
