# Verificação no navegador

## Subir e rodar

```bash
bash $SKILL/scripts/server.sh start 8080   # sobe em segundo plano e espera responder
bash $SKILL/scripts/e2e/run.sh $SKILL/scripts/e2e/smoke.cjs 8080
bash $SKILL/scripts/server.sh stop 8080    # ao terminar
```

O `server.sh` guarda o processo e o log em `$TMPDIR/atelier-dev/`. Use `server.sh log 8080` para ver o fim do log se algo parecer errado, por exemplo uma tela branca ou um erro de importação. Rodar `start` de novo com o servidor no ar não sobe outro. Se ele disser que a porta já responde e não foi ele que subiu, outra sessão está usando a porta: escolha outra.

O `run.sh` define `BASE_URL`, `SHOTS` (padrão: `screenshots/` na raiz, fora do git), `ATELIER_E2E` (a pasta `e2e` desta skill) e o ambiente do Playwright.

## O smoke

O `smoke.cjs` cobre os fluxos que não podem quebrar, cada um num contexto limpo (localStorage vazio):

1. A coleção abre e a Inter aparece uma vez só no ramo Sans serif › Interface.
2. O filtro Veredito = Usar mostra "2 de 9 fontes".
3. Comparar 3 itens, arrastar uma divisória e recarregar mantém as larguras (±4 px).
4. Uma carinha dada na prova muda a carinha da nota geral.
5. Ctrl+\, Ctrl+Shift+\, Alt+W, Alt+1 e → funcionam, e Ctrl+\ não divide um painel sem espaço para duas metades de 220 px.
6. Ctrl+K com "playfair" e Enter abre o item e deixa o foco na aba dele.
7. Um localStorage no formato v3, com nota 4 em estrelas, mostra a carinha "Bom".
8. Em 390×844 não há botão de dividir, e o inspetor e a barra abrem como gaveta. A barra aberta recebe o foco e deixa o `<main>` inerte.

Ele termina com código 0 e "no page errors" em cada bloco. Os 404 do Iconify simulado são esperados e filtrados.

## Escrever um roteiro para a sua mudança

Crie o arquivo no scratchpad ou em `/tmp`, fora do repositório:

```js
const { open, goto, shot, check, realErrors } = require(process.env.ATELIER_E2E + "/lib.cjs");

(async () => {
  const { browser, page, errors } = await open(); // 1440×900; open({ width: 390, height: 844 }) para celular
  await goto(page);

  // Localize por papel e nome acessível, como uma pessoa com leitor de tela faria.
  await page.getByRole("button", { name: "Inter, usar" }).first().click();
  await page.getByRole("tab", { name: "Pesos" }).first().click();

  await check(
    "a aba Pesos mostra o peso 600",
    async () => (await page.getByText("600 Seminegrito").count()) > 0,
  );
  await shot(page, "pesos-inter");

  await browser.close();
  if (realErrors(errors).length) throw new Error(realErrors(errors).join("\n"));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### Dicas

- **Nomes acessíveis úteis:**
  - Cards e folhas da barra: "Inter, usar" (ou só "Roboto", sem veredito).
  - Abas: role `tab` com o mesmo nome.
  - Painéis: `section[aria-label=Painel]`.
  - Divisórias: `[data-separator]`.
  - Painéis do layout: `[data-panel]`. Um split aninhado também conta como painel.
  - Nota: role `radio` com nome "Leitura: Ok" (a palavra da carinha).
  - Nota geral: `[aria-label='Nota geral'] p`.
- **Abas do painel e abas da prova são `tab` as duas.** Dentro de um painel, `getByRole("tab")` acha também Prova, Pesos, Glifos e Info. Para as abas do painel, use `getByRole("tablist", { name: "Abas do painel" }).getByRole("tab")`.
- **Setas num `RadioGroup` ou `ToggleGroup` do Radix** (seletor de fundo, nota): o Radix move o foco num `setTimeout` e só marca a opção se a tecla ainda estiver descida.
  - Segure a tecla como uma pessoa: `page.keyboard.press("ArrowRight", { delay: 50 })`.
  - Sem isso, o teste falha de vez em quando: o foco vai para a opção certa, mas a anterior continua marcada.
- **Ao clicar para focar um painel**, clique no título (`h2`) e não numa coordenada: uma coordenada cai fácil em cima de um controle de nota.
- **Para arrastar uma divisória**, use `page.mouse.down`/`move({ steps: 8 })`/`up` sobre a `boundingBox` do `[data-separator]`.
- **Para arrastar um item até um painel**, use `locator.dragTo(painel, { targetPosition: { x: largura - 10, y: altura / 2 } })`. A borda divide, o centro abre.
- **Para preparar o localStorage**, passe `open({ init: \`localStorage.setItem(...)\` })`.
- **Atalhos no Linux** usam Control (`Control+Backslash`); no Mac seriam Meta.

## Olhar os screenshots

Abra cada screenshot salvo e procure:

- texto cortado ou quebrando em painel estreito;
- controles sobrepostos;
- contraste ruim no fundo escolhido;
- estado vazio sem orientação.

Esses problemas não aparecem em `assert`. Se notar algo, corrija e tire o screenshot de novo.
