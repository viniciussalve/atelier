// Regressão dos fluxos principais do Atelier. Rode depois de qualquer mudança:
//   bash $SKILL/scripts/e2e/run.sh $SKILL/scripts/e2e/smoke.cjs [PORTA]
// Se a sua mudança altera algo verificado aqui (rótulo, contagem), atualize este arquivo junto.
const { open, goto, shot, check, realErrors } = require("./lib.cjs");

const panes = (page) => page.locator("section[aria-label=Painel]");
const widths = (page) =>
  page
    .locator("[data-panel]")
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
const textOf = async (locator) => ((await locator.textContent()) ?? "").trim();

async function desktop() {
  const { browser, page, errors } = await open();
  await goto(page);
  await shot(page, "smoke-01-colecao");

  // Com a coleção na largura toda há espaço para duas metades de 220 px.
  await page.keyboard.press("Control+Backslash");
  await page.waitForTimeout(300);
  await check(
    "Ctrl+\\ divide à direita quando há espaço",
    async () => (await panes(page).count()) === 2,
  );
  await page.keyboard.press("Alt+KeyW");
  await page.waitForTimeout(300);
  await check(
    "Alt+W fecha a aba e o painel que ficou vazio",
    async () => (await panes(page).count()) === 1,
  );

  await page.getByRole("button", { name: "Expandir Sans serif" }).click();
  await page.getByRole("button", { name: "Expandir Interface" }).click();
  await check(
    "explorador: Inter aparece uma vez no ramo Sans serif",
    async () =>
      (await page
        .locator("aside")
        .getByRole("button", { name: /^Inter(, usar)?$/ })
        .count()) === 1,
  );

  await page.getByRole("button", { name: /^Veredito/ }).click();
  await page.getByRole("checkbox", { name: /Usar/ }).check();
  await check(
    "filtro Veredito = Usar mostra 2 de 9",
    async () => (await textOf(page.locator("main h1 + p").first())) === "2 de 9 fontes",
  );
  await shot(page, "smoke-02-filtros");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Limpar filtros" }).click();

  for (const name of ["Inter", "Roboto", "JetBrains Mono"]) {
    await page.getByRole("checkbox", { name: `Selecionar ${name} para comparar` }).click();
  }
  await page.getByRole("button", { name: "Comparar lado a lado" }).click();
  await page.waitForTimeout(400);
  await check("comparar abre 3 painéis", async () => (await panes(page).count()) === 3);
  const separator = await page.locator("[data-separator]").first().boundingBox();
  await page.mouse.move(separator.x + separator.width / 2, separator.y + 300);
  await page.mouse.down();
  await page.mouse.move(separator.x + 80, separator.y + 300, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const before = await widths(page);
  await shot(page, "smoke-03-paineis");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const after = await widths(page);
  await check(
    "larguras dos painéis sobrevivem ao recarregar",
    async () =>
      after.length === before.length &&
      after.every((width, index) => Math.abs(width - before[index]) <= 4),
  );

  const overall = page.locator("[aria-label='Nota geral'] p").first();
  await panes(page).first().locator("h2").first().click();
  const was = await textOf(overall);
  await panes(page).first().getByRole("radio", { name: "Leitura: Ok" }).click();
  await page.waitForTimeout(300);
  await check(
    `nota na prova muda a nota geral (${was} → outra)`,
    async () => (await textOf(overall)) !== was,
  );
  await shot(page, "smoke-04-nota-na-prova");

  await panes(page).first().locator("h2").first().click();
  await page.keyboard.press("Control+Shift+Backslash");
  await page.waitForTimeout(300);
  await check("Ctrl+Shift+\\ divide abaixo", async () => (await panes(page).count()) === 4);
  // Um terço da largura não comporta duas metades de 220 px: nenhum painel fica estreito demais.
  await page.keyboard.press("Control+Backslash");
  await page.waitForTimeout(300);
  await check(
    "Ctrl+\\ não divide um painel sem espaço para duas metades",
    async () => (await panes(page).count()) === 4,
  );
  await page.keyboard.press("Alt+KeyW");
  await page.waitForTimeout(300);
  await check(
    "Alt+W fecha a aba (e o painel vazio)",
    async () => (await panes(page).count()) === 3,
  );
  await page.keyboard.press("Alt+Digit1");
  await page.waitForTimeout(200);
  const title = panes(page).first().locator("h2").first();
  const first = await textOf(title);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  await check("→ passa para o próximo item", async () => (await textOf(title)) !== first);

  await page.keyboard.press("Control+KeyK");
  await page.getByPlaceholder("Buscar fonte, conjunto, pasta ou comando").fill("playfair");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  await check(
    "Ctrl+K abre o item buscado",
    async () => (await page.getByRole("tab", { name: /^Playfair Display/ }).count()) > 0,
  );
  await check("Ctrl+K deixa o foco na aba do item aberto, não no body", async () =>
    page.evaluate(
      () =>
        document.activeElement?.getAttribute("role") === "tab" &&
        /^Playfair Display/.test(document.activeElement.textContent.trim()),
    ),
  );

  await browser.close();
  return realErrors(errors);
}

async function migration() {
  const legacy = {
    state: {
      kind: "font",
      view: { type: "all" },
      selectedId: null,
      query: "",
      sampleText: "x",
      previewMode: "preview",
      ground: "paper",
      zoom: 16,
      folders: [{ id: "f-sans", name: "Sans serif", kind: "font", parentId: null }],
      assets: [
        {
          id: "old",
          kind: "font",
          name: "Antiga",
          folderIds: ["f-sans"],
          tags: ["teste"],
          notes: "",
          url: "",
          rating: 4,
          verdict: "",
          criteria: {},
          family: "Inter, sans-serif",
          style: "Sans serif",
          weights: "400",
          format: "WOFF2",
          sizeLabel: "1 KB",
          license: "OFL",
          iconKey: "",
          samples: [],
          createdAt: "2026-10-01T00:00:00.000Z",
          modifiedAt: "2026-10-01T00:00:00.000Z",
          importedAt: "2026-10-01T00:00:00.000Z",
          lastUsedAt: null,
        },
      ],
    },
    version: 3,
  };
  const { browser, page, errors } = await open({
    init: `localStorage.setItem("atelier-library", ${JSON.stringify(JSON.stringify(legacy))});`,
  });
  await goto(page);
  await page
    .getByRole("button", { name: /^Antiga/ })
    .first()
    .click();
  await page.waitForTimeout(300);
  await check(
    "migração v3: nota 4 em estrelas vira a carinha Bom",
    async () => (await textOf(page.locator("[aria-label='Nota geral'] p").first())) === "Bom",
  );
  await browser.close();
  return realErrors(errors);
}

async function mobile() {
  const { browser, page, errors } = await open({ width: 390, height: 844 });
  await goto(page);
  await check(
    "celular: sem botão de dividir",
    async () => (await page.getByRole("button", { name: "Dividir à direita" }).count()) === 0,
  );
  await page.getByRole("button", { name: "Inter, usar" }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await page.waitForTimeout(300);
  await check(
    "celular: inspetor abre como gaveta",
    async () => (await page.locator("aside[aria-label^='Inspetor']").count()) === 1,
  );
  await shot(page, "smoke-05-celular-inspetor");
  await page
    .locator("aside[aria-label^=Inspetor]")
    .getByRole("button", { name: "Fechar o inspetor" })
    .click();
  await page.getByRole("button", { name: "Abrir a barra" }).click();
  await page.waitForTimeout(300);
  await check(
    "celular: barra abre como gaveta",
    async () => (await page.locator("aside[aria-label=Biblioteca]").boundingBox()).x >= 0,
  );
  await check(
    "celular: a barra aberta é modal (foco nela, página inerte)",
    async () =>
      (await page.evaluate(
        () => !!document.activeElement?.closest("aside[aria-label=Biblioteca]"),
      )) && (await page.locator("main").evaluate((el) => el.inert)),
  );
  await browser.close();
  return realErrors(errors);
}

(async () => {
  const problems = [...(await desktop()), ...(await migration()), ...(await mobile())];
  if (problems.length) {
    console.error("erros de página:\n" + problems.join("\n"));
    process.exit(1);
  }
  console.log("smoke ok: sem erros de página");
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
