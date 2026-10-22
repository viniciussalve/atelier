# Atelier

Quadro para avaliar artefatos de design (fontes tipográficas e conjuntos de ícones do Iconify), comparando lado a lado e registrando uma avaliação com critérios.

## Como funciona

**Barra lateral.** Escolha a biblioteca (Fontes ou Ícones). Vistas rápidas: Tudo, Recentes, Para avaliar, Sem pasta e Sem tag. Abaixo fica o explorador de pastas: um item aparece só na pasta mais funda de cada ramo, as pastas começam recolhidas e o filtro do topo procura em pastas e itens. Arraste um item para uma pasta para incluí-lo nela.

**Coleção.** É a grade ou lista da vista atual, com busca, filtros e ordenação. Como no Google Fonts, cada item aparece desenhado na própria fonte: escreva em "Escreva para testar" e ajuste o corpo para mudar todos os cards e linhas de uma vez. Nos ícones, o controle muda o tamanho das amostras. Texto e corpo ficam salvos por biblioteca.

- Filtros, no botão "Filtros": veredito, status, nota mínima, tags, licença, estilo e formato. Cada opção mostra quantos itens tem com os outros filtros aplicados. Os filtros ativos aparecem como chips embaixo do cabeçalho, cada um com seu X, e "Limpar filtros" tira todos.
- Ordenação: nome, nota, veredito, modificado e uso recente.
- Marque de dois a seis itens e use "Comparar lado a lado".

**Painéis.** Como os editores do VS Code.

- Cada painel tem abas. Um clique abre o item como prévia (em itálico), que o próximo clique substitui. Clique duas vezes na aba ou dê uma nota para fixá-la.
- Divida à direita ou abaixo, arraste as divisórias e clique duas vezes numa divisória para igualar.
- Arraste itens e abas para as bordas de um painel para dividir, ou para o centro para abrir ali.
- O menu de cada painel sincroniza texto, corpo, fundo, aba e rolagem entre todos os painéis.

**Provas.**

- Fontes: Prova, Interface (telas de exemplo com os pesos de cada papel) e Glifos.
- Ícones: Amostras (aceita nomes novos; os que o conjunto não tem aparecem tracejados), Tamanhos e Componentes.

**Adicionar.** No ⌘K, "Adicionar fonte ou conjunto…" busca no Google Fonts e no Iconify. Um link `/?adicionar=fonte:Inter Tight,icones:lucide&motivo=…`, o formato que uma IA escreve, abre o mesmo diálogo com as sugestões já marcadas. Nada entra sem confirmar. Sugestões de IA levam a tag `ia` e o motivo nas notas, e aparecem em Para avaliar.

**Conversa com IA.** "Copiar link para IA", no menu "…" de cada painel ou no ⌘K, copia um link com a biblioteca e as instruções; cole numa IA com acesso à web. Ela lê o que você avaliou, busca e recomenda por semelhança, e responde com um link de adicionar. Para IA sem acesso à web, use "Copiar contexto para IA como texto" no ⌘K. As instruções gerais ficam em `/llms.txt`, apontado pelo `robots.txt` e pela cabeça da página, sem aparecer na tela. O link leva a biblioteca dentro da URL: quem tiver o link lê a biblioteca. Clientes MCP (Claude, ChatGPT, Cursor, Claude Code) podem se conectar a `/mcp`, sem login, e usar as mesmas buscas como ferramentas.

**Avaliação.** Cada biblioteca tem critérios com peso e uma orientação do que observar. Cada critério recebe uma carinha, de Muito ruim a Ótimo, e, se quiser, uma nota escrita. A nota geral é a carinha da média ponderada dos critérios avaliados. O veredito (usar, revisar, evitar) é a decisão final. Os critérios são avaliados só na prova: cada seção traz a carinha do critério que ela mede, e o lápis ao lado mostra o peso, o que observar e a nota escrita. O inspetor começa fechado; o botão "Avaliar" abre a coluna com a nota geral, um resumo de cada critério, o veredito e os detalhes do item.

| Atalho (Mac / outros) | Ação                              |
| --------------------- | --------------------------------- |
| ⌘K / Ctrl+K           | Abrir item, pasta ou comando      |
| ⌘\ / Ctrl+\           | Dividir à direita                 |
| ⇧⌘\ / Ctrl+Shift+\    | Dividir abaixo                    |
| ⌥W / Alt+W            | Fechar aba                        |
| ⌥1–6 / Alt+1–6        | Ir para o painel                  |
| ← →                   | Item anterior ou próximo da lista |

Tudo fica salvo no navegador (localStorage).

## Desenvolvimento

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:8080
npm test           # testes de src/lib/library e scripts
npm run typecheck
npm run lint
```

A lógica fica em módulos puros com testes em `src/lib/library/`:

- `criteria`: critérios e nota.
- `filters` e `folders`: vistas, filtros e explorador.
- `layout` e `workspace-model`: painéis e abas.
- `migrate`: estado salvo antigo.

A interface fica em `src/components/library/`.

Catálogos e endpoints para IA ficam em `src/lib/ai/` e `src/routes/api/` (`/api/fontes`, `/api/conjuntos`, `/api/icones`, `/api/adicionar`, `/api/parecidas`; JSON, ou Markdown com `?formato=md`), além de `/ia`, `/llms.txt`, `/robots.txt` e o servidor MCP em `/mcp`. O catálogo do Google Fonts é gerado por `node scripts/catalog-google-fonts.mjs`, sem chave de API; o do Iconify vem do pacote `@iconify/collections`.

`docs/ds/` é o design system em Markdown para as bases de conhecimento do Dify: `tokens.md` e uma página por componente, gerados por `npm run ds:gerar` a partir do código (só o "Quando usar" é escrito por IA). O `npm test` falha se a pasta ficar para trás. O contrato da InterfaceSpec fica em `docs/ds/interface-spec.v0.schema.json` e `npm run ds:validar -- <spec.json>` confere uma spec contra o atelier atual. O plano do ecossistema está em `docs/ecossistema-dify/PLANO.md`.

Esses textos para IA levam links absolutos para o app. Ao publicar atrás de um proxy, defina `PUBLIC_BASE_URL` no ambiente do servidor (por exemplo `PUBLIC_BASE_URL=https://atelier.app`): ela vale mais que qualquer cabeçalho. Sem ela, a origem vem do próprio pedido, e os cabeçalhos `X-Forwarded-Host`, `X-Forwarded-Proto` e `X-Forwarded-Prefix` só valem quando são um host com porta, `http` ou `https`, e o prefixo de porta de um preview por caminho. O `/llms.txt` e o `/robots.txt` respondem com `Vary` nesses cabeçalhos, para um cache não servir a origem de um pedido a outro.
