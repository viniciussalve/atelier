# Armadilhas conhecidas

Cada item já causou um bug ou custou tempo neste projeto. Para cada um vai o sintoma, a causa e o que fazer.

## Ambiente

- **`npm install` falha com "Cannot read properties of null (reading 'edgesOut')".**
  - Causa: bug do npm ao resolver peers opcionais do vitest.
  - O que fazer: `npm install --legacy-peer-deps`, que o `setup.sh` já usa. Não commite o `package-lock.json` gerado.
- **Três testes de `scripts/with-app-env.test.mjs` falham.**
  - Causa: falta `.grok/app-env.json`, um arquivo da plataforma que está no `.gitignore`.
  - O que fazer: o `setup.sh` cria o arquivo localmente.
- **O dev não sobe ou o SSR quebra importando `grok-pwa-plugin.mjs` ou `preview-host-bridge`.**
  - Causa: esses dois arquivos são da plataforma e não estão no repositório.
  - O que fazer: o `setup.sh` copia substitutos vazios de `scripts/stubs/` e os deixa fora do git. Não os commite: no repositório, eles esconderiam os arquivos reais da plataforma.
- **O Playwright não abre localhost e mostra uma página de "agent-proxy relay".**
  - Causa: o Chromium manda o loopback pelo proxy.
  - O que fazer: rode com `PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1`, que o `e2e/run.sh` já define.
  - Use o Playwright global (`npm root -g`), que bate com os navegadores em `/opt/pw-browsers`. O do projeto espera outro build.
- **"Executable doesn't exist at /opt/pw-browsers/…" ao rodar um roteiro.**
  - Causa: um `require("playwright")` feito de dentro do repositório acha o Playwright do projeto antes do global.
  - O que fazer: no roteiro, use só o `lib.cjs`, que carrega o global pelo caminho em `ATELIER_PLAYWRIGHT` (o `run.sh` define essa variável). Não faça `require("playwright")` direto.
- **Ícones não aparecem no teste.**
  - Causa: o proxy bloqueia `api.iconify.design`. O Google Fonts passa.
  - O que fazer: o `e2e/lib.cjs` simula o Iconify. Um nome que começa com `nao-existe` responde 404.
- **"spawn vite ENOENT" ao subir o servidor fora do `npm run`.**
  - Causa: o `vite` mora em `node_modules/.bin`, que só entra no PATH dentro do `npm run`.
  - O que fazer: use `server.sh start`, que acerta o PATH. Se o `node_modules` não existir, rode `setup.sh` antes.
- **A porta está ocupada.**
  - Causa: o servidor usa `strictPort`, e outra sessão pode estar na 8080.
  - O que fazer: passe outra porta para `server.sh` e `run.sh`.
- **`npm run build` falha.**
  - Causa: o middleware importa arquivos de plataforma ausentes.
  - O que fazer: nada. A falha já existia e não é verificação desta skill.

## Formatação e testes

- **Diff cheio de arquivos que você não tocou.**
  - Causa: o Prettier rodou numa pasta inteira ou o `npm run format` rodou no projeto todo.
  - O que fazer: formate só os arquivos alterados e desfaça o resto com `git checkout -- <arquivo>`. `src/components/preview-host-bridge.tsx` e `eslint.config.mjs` são as vítimas comuns.
- **Teste em `src/lib/library` quebra com "does not provide an export named …".**
  - Causa: um tipo foi importado como valor, e o `--experimental-strip-types` não apaga esse import.
  - O que fazer: use `import type`. O ESLint cobra `consistent-type-imports` nessa pasta e também proíbe `typeof import("…")`; use `import type * as X`.
- **Teste que importa um store precisa de `localStorage`.**
  - O que fazer: copie o padrão de `commands.test.ts`. Ele cria um `localStorage` em memória e só então importa os módulos, com `await import(...)`.

- **JSON de pacote no servidor quebra com `ERR_IMPORT_ATTRIBUTE_MISSING`.**
  - Causa: o SSR do Vite deixa o pacote para o Node, que exige `with { type: "json" }`. O índice do `@iconify/collections` importa o JSON sem isso.
  - O que fazer: importe o `.json` direto, com o atributo: `import collections from "@iconify/collections/collections.json" with { type: "json" }`.
- **O Iconify devolve mais ícones do que o pedido.**
  - Causa: a busca dele tem limite mínimo de 32.
  - O que fazer: peça ao menos 32 e corte no limite pedido (`searchIcons` já faz).
- **Rota de servidor nova não existe para o `tsc`.**
  - Causa: o `src/routeTree.gen.ts` só se refaz quando o dev ou o build rodam.
  - O que fazer: suba o dev antes do typecheck e commite o arquivo gerado (ele está no `.prettierignore`).

## React e zustand

- **"Maximum update depth exceeded" ou loop de renderização.**
  - Causa: um seletor devolve array ou objeto novo a cada chamada, como `useWorkspace(s => orderedPanes(s))`.
  - O que fazer: selecione fatias estáveis e derive com `useMemo`, ou use `useShallow` de `zustand/react/shallow`.
- **O layout salvo some ao recarregar.**
  - Causa: algo chamou `set` num store persistido antes do `rehydrate`. O persist gravou o estado padrão por cima do salvo.
  - O que fazer: escreva nos stores só depois de `ready` (veja o efeito de `setCanSplit` em `atelier.tsx`).
- **Quebra depois de mudar o formato salvo.** Exemplo: `filters[facet]` indefinido.
  - Causa: o dado antigo no localStorage não tem o campo novo, e o store da biblioteca não tem `merge`.
  - O que fazer: suba a versão e migre, com teste. Veja a receita em `arquitetura.md`.
- **Hidratação.**
  - O que fazer: tudo que depende de localStorage ou de `window` só renderiza depois de `ready`. Enquanto isso, o servidor e o primeiro frame mostram `ShellFrame`. Não leia `window` fora disso.

## Interação

- **Menu Radix rouba o foco de um campo que ele mesmo abriu**, como em "Nova subpasta" ou "Renomear".
  - Causa: ao fechar, o menu devolve o foco ao gatilho, e o trap de foco ainda está ativo quando o campo monta.
  - O que fazer: chame `event.preventDefault()` em `onCloseAutoFocus` só nas ações que abrem campo, e foque o campo no frame seguinte com `requestAnimationFrame` (veja `NameInput`).
  - Também abra o que for preciso para o campo aparecer, por exemplo expandir a pasta.
- **Arrastar e soltar em HTML5 é cancelado ou o overlay fica preso.**
  - Causa: mudar o DOM sob o ponteiro dentro do `dragstart` cancela o arraste no Chromium.
  - O que fazer: use `beginDrag` (atrasa um tick) e `endDrag` em `commands.ts`. Toda saída de arraste chama `endDrag`. Imagens levam `draggable={false}`.
- **Clique duplo que nunca dispara.**
  - Causa: o primeiro clique troca o conteúdo debaixo do ponteiro (abrir o item no mesmo painel), então o segundo cai em outro elemento.
  - O que fazer: dê outro caminho para a ação, como clique duplo na aba ou um item de menu.
- **Navegar com ←/→ fica alternando entre dois itens.**
  - Causa: marcar o item como usado durante a navegação reordena "Recentes".
  - O que fazer: não chame `markUsed` ao navegar; só ao abrir de fato.
- **Texto digitado se perde ao fechar um popover.**
  - Causa: o salvamento com atraso (debounce) não roda quando o componente desmonta.
  - O que fazer: guarde o último rascunho num ref e salve na limpeza do efeito ao desmontar (veja `NoteEditor`).
- **Um modificador "vaza" para a próxima ação.**
  - Causa: um ref guarda, por exemplo, ⌘Enter na paleta e nunca é zerado.
  - O que fazer: leia o modificador e zere-o na mesma seleção.

- **Uma fonte adicionada some junto com as outras.**
  - Causa: o `css2` do Google Fonts responde 400 para a requisição inteira se uma família ou um peso não existe.
  - O que fazer: um `<link>` por família (`fontAssetHref`), com os pesos do catálogo; família desconhecida vai sem eixo.
- **Na paleta, Enter abre um item em vez do comando digitado.**
  - Causa: o cmdk ordena dentro de cada grupo, mas não reordena os grupos. Um item que casa por letras espalhadas, no grupo de cima, ganha de um comando que casa exato.
  - O que fazer: o filtro da paleta zera pontuações abaixo de 0,01. Nome de comando novo deve começar pelo verbo que a pessoa digitaria.

## Teclado

- **Atalho com caractere** (\, |, letras): compare por `event.key`, não por `event.code`. No ABNT2 a tecla \ é `IntlBackslash`, e a posição `Backslash` digita ].
- **Atalho com Alt/⌥**: compare por `event.code` (`KeyW`, `Digit2`), porque no Mac ⌥2 digita "™".
- **Atalhos do navegador**: ⌘W e ⌘1–8 são do navegador. Fechar aba usa Alt+W e ir para painel usa Alt+1–6.
- **Campos e widgets**: ignore atalhos quando o foco está em campo de texto. As setas também são ignoradas em radiogroup, tablist, slider, separator, menu e grupos de botões (veja `ARROW_WIDGETS`).

## Acessibilidade

- **Pontos e ícones decorativos** dentro de um botão levam `aria-hidden`. O nome do controle vem por `aria-label`, por exemplo `withVerdict(nome, veredito)` → "Inter, usar".
  - Por quê: o Chrome insere espaços entre elementos inline ao montar o nome ("Roboto , sem veredito").
- **Botão com texto escondido por container query** (como "Avaliar" em painel estreito) precisa de `aria-label` fixo. Sem ele, fica sem nome.
- **Fundo escuro de gaveta**: use um `div aria-hidden` com `onClick`, não um botão com o mesmo nome do "Fechar". A gaveta oferece outro jeito de sair: o botão de fechar ou Escape.
- **Gaveta sobre a página é modal.** Ao abrir, o foco entra nela e o resto fica fora do Tab e da árvore de acessibilidade. Ao fechar, o foco volta a quem abriu.
  - O inspetor usa `Dialog` do Radix. Sem `Dialog.Trigger`, o Radix devolve o foco ao `body`, então guarde quem abriu em `onOpenAutoFocus`.
  - Mas o Radix **não chama `onOpenAutoFocus`** quando um campo dentro tem `autoFocus` (o foco já está lá). O `Modal` de `ui/dialog.tsx` guarda quem abriu num `useLayoutEffect`, que roda antes de o portal montar o conteúdo. Para diálogos novos, use o `Modal` em vez de repetir isso.
  - Quem abriu pode não servir mais: saiu da página (um item tomou o lugar da coleção), ficou sob `inert` (a gaveta fechou) ou era o `body` (diálogo aberto por link). `returnFocus` (`ui/return-focus.ts`) cai então no `fallbackFocus`; na biblioteca, passe `activeTab` (`shared/active-tab.ts`). Quando fechar abre outra coisa na frente (confirmar o diálogo de adicionar), ponha o foco nela com `onCloseAutoFocus` e `event.preventDefault()`.
  - A barra fica montada (desliza com transição), então usa `inert` no `<main>` e move o foco num efeito.
  - Para conferir a árvore, leia a do Chromium (`Accessibility.getFullAXTree` via CDP): o `getByRole` do Playwright não considera `inert`.
- **Papéis ARIA prometem comportamento.** `tree`, `tablist` e `radiogroup` sem navegação por setas confundem leitor de tela. Na dúvida, use botões com `aria-expanded`, `aria-pressed` ou `aria-current`.

## Painéis (react-resizable-panels v4)

- `minSize` e `defaultSize` em número são pixels; em string sem unidade, porcentagem.
- Cada `Group` tem `key` com os ids dos filhos. Mudou o conjunto de filhos, remonta.
- Salve tamanhos só quando `onLayoutChanged` traz `meta.isUserInteraction`. Para aplicar tamanhos vindos do store (Igualar), use `layoutEpoch` e `groupRef.setLayout`.
- O clique duplo nativo do `Separator` só reseta painéis com `defaultSize`. Por isso usamos `disableDoubleClick` e um `div` interno com handler próprio.
