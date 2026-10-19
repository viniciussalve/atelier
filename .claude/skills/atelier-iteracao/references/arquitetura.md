# Arquitetura do Atelier

## Sumário

- [Mapa](#mapa)
- [Fluxo de dados](#fluxo-de-dados)
- [Receitas](#receitas): critério, faceta de filtro, vista rápida, aba de prova, atalho, comando da paleta, configuração sincronizável, operação de painel, campo persistido.

## Mapa

### `src/lib/library/`: lógica e estado

| Arquivo              | O que faz                                                                                                                                                                                                    | Teste                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `types.ts`           | Tipos do domínio: Asset, Folder, View, Scorecard, Filters, KindNav, LibraryData                                                                                                                              | —                     |
| `criteria.ts`        | Critérios por tipo (peso, orientação, seção da prova), `overallScore` (média ponderada), `evaluationStatus`, `roundedScore` (a carinha da média), `scaleLabel`, rótulos de veredito e status                 | sim                   |
| `folders.ts`         | `folderScope`, `folderPath`, `explorerTree` (um item por ramo), `filterExplorer`, `normalizeText` (sem acento)                                                                                               | sim                   |
| `filters.ts`         | `scopeToView`, `matchesQuery`, `applyFilters`, `facetCounts` (disjuntivas), `sortAssets`, `collectionList` (o que a coleção mostra), `viewCounts`, `FACETS_BY_KIND`                                          | sim                   |
| `layout.ts`          | Árvore de divisões: `insertBeside`, `removeLeaf`, `normalize`, `equalize`, `setSizes`, `neighbor`, `dropZoneAt`, `validateLayout`                                                                            | sim                   |
| `workspace-model.ts` | Painéis e abas: `openTab` (com prévia), `closeTab`, `splitPane`, `moveTab`, `dropTab`, `dropAsset`, `openToSide`, `compare`, `applySettings` (sincronia), `reconcile`, `sanitizeWorkspace`, `checkWorkspace` | sim                   |
| `migrate.ts`         | `migrateLibrary`, para qualquer versão anterior do store da biblioteca                                                                                                                                       | sim                   |
| `seed.ts`            | Pastas e itens iniciais no formato atual, `defaultLibrary()`                                                                                                                                                 | via `migrate.test.ts` |
| `fonts.ts`           | `parseWeights`, `weightName`, `googleFontsHref` (usado no `__root.tsx`)                                                                                                                                      | sim                   |
| `shortcuts.ts`       | `matchShortcut` (puro), `shortcutLabel`                                                                                                                                                                      | sim                   |
| `format.ts`          | `formatDate`                                                                                                                                                                                                 | sim                   |
| `store.ts`           | Store zustand da biblioteca (persist `atelier-library`, **versão 4**)                                                                                                                                        | —                     |
| `workspace.ts`       | Store zustand dos painéis (persist `atelier-workspace`, versão 1). Também guarda `drag`, `layoutEpoch` e `canSplit`, que não são persistidos                                                                 | —                     |
| `commands.ts`        | Ações que tocam os dois stores: `openItem`, `showView`, `compareItems`, `navigate`, `dropOnPane`, `score`, `split`, `beginDrag`/`endDrag`…                                                                   | `commands.test.ts`    |
| `hooks.ts`           | `useAsset`, `usePane`, `useActivePane`, `useActiveAsset`, `useCollection`                                                                                                                                    | —                     |
| `test-fixtures.ts`   | `asset()` e `folder()` para testes                                                                                                                                                                           | —                     |

### `src/components/library/`: interface

| Pasta ou arquivo      | Responsabilidade                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `atelier.tsx`         | Shell. Lê os dois stores do localStorage, depois roda `reconcile`, depois `ready`. Define `canSplit` pela largura, trata os atalhos globais e abre as gavetas e a paleta                                                              |
| `sidebar/`            | `sidebar.tsx` (seletor Fontes/Ícones, filtro, vistas, pastas), `explorer.tsx` (árvore, campo de nome, arrastar para pasta) e `folder-actions.tsx` (menus e confirmação)                                                               |
| `browser/`            | `collection.tsx` (cabeçalho, ordenação, grade ou lista, barra de comparar), `filter-bar.tsx`, `asset-card.tsx` e `asset-table.tsx`                                                                                                    |
| `workspace/`          | `workspace.tsx` (Group/Panel/Separator recursivos), `pane.tsx` (cabeçalho, ações, menu de sincronia), `tab-strip.tsx`, `drop-overlay.tsx` e `scroll-sync.ts`                                                                          |
| `specimen/`           | `asset-tab.tsx` (cabeçalho do item, abas da prova, controles, área rolável), `font-specimen.tsx` (FontProof, FontWeights, FontGlyphs), `icon-specimen.tsx`, `info.tsx`, `section.tsx` (seção com a nota do critério) e `controls.tsx` |
| `evaluation/`         | `score-control.tsx` (cinco carinhas, nas variantes inline e full), `scorecard.tsx`, `badges.tsx` (`ScoreFace`, `ScoreBadge`) e `tones.ts` (classes por veredito, `withVerdict`)                                                       |
| `inspector/`          | `inspector.tsx` (coluna ou gaveta, abas) e `details.tsx`                                                                                                                                                                              |
| `shared/`             | `grounds.ts` (fundos e cor de tinta), `labels.ts`, `use-tab-label.ts`, `use-media-query.ts` e `field.tsx`                                                                                                                             |
| `command-palette.tsx` | Paleta ⌘K (cmdk)                                                                                                                                                                                                                      |
| `icons.tsx`           | `Glyph` (img do Iconify com aviso de "não encontrado") e `SetGlyphs`                                                                                                                                                                  |

`src/components/ui/` tem wrappers Radix já estilizados: tooltip, icon-button (rótulo obrigatório), dropdown-menu, popover, confirm-dialog, segmented e tabs. Use-os em vez de criar outros.

## Fluxo de dados

- A **biblioteca** guarda `kind`, `nav[kind]` (vista, busca, filtros, ordenação, exibição), `expanded`, `folders` e `assets`. A busca não é persistida.
- O **espaço de trabalho** guarda a árvore `root`, os `panes` (abas, ativa, prévia, `settings` por painel), `activePaneId`, a `sync` e o estado do inspetor.
- Os componentes leem por seletores pequenos. Para mudar os dois stores, chame uma função de `commands.ts`; não encadeie chamadas nos componentes.
- A coleção é sempre `collectionList(...)`, e a navegação por ←/→ segue a mesma ordem.

## Receitas

Em todas: teste primeiro no módulo puro, depois a interface, depois a verificação no navegador.

### Novo critério de avaliação

1. `types.ts`: acrescente o id em `FontCriterionId` ou `IconCriterionId`.
2. `criteria.ts`: acrescente o critério na lista do tipo, com `label`, `hint` ("o que observar"), `weight` (1–3) e `section`. Se a seção da prova ainda não existir, acrescente-a em `SpecimenSection` e crie a seção em `specimen/`.
3. Testes de `criteria.test.ts`: a contagem total (hoje 8) e as somas ponderadas.
4. Não é preciso migrar: um critério novo começa sem nota. **Remover** um critério apaga as notas dele na próxima migração; diga isso no PR.
5. Se quiser que as seeds mostrem a novidade, atualize `seed.ts`.

### Nova faceta de filtro

1. `types.ts`: acrescente o campo em `Filters` (lista) e ele passa a entrar em `ListFacet`.
2. `filters.ts`: acrescente em `EMPTY_FILTERS`, em `facetValues`, em `LIST_FACETS` e, se valer para o tipo, em `FACETS_BY_KIND`.
3. `browser/filter-bar.tsx`: acrescente em `FACET_LABEL` e, se os valores precisarem de rótulo, em `optionLabel`.
4. **Formato persistido mudou**: `nav[kind].filters` salvo não tem a chave nova, e `filters[facet].length` quebra. Suba a versão do store da biblioteca e cubra no `migrate.test.ts`. `migrateLibrary` hoje refaz o `nav` a partir de `defaultNav()` e só mantém a vista.

### Nova vista rápida

1. `types.ts`: acrescente o tipo em `View`.
2. `filters.ts`: acrescente em `scopeToView` e `viewCounts`, com teste.
3. `migrate.ts`: acrescente em `validView`.
4. `sidebar/sidebar.tsx`: acrescente em `QUICK_VIEWS` (rótulo e ícone lucide).
5. `browser/collection.tsx`: escreva a mensagem de vazio em `EMPTY_VIEW`.
6. `shared/labels.ts`: acrescente em `viewTitle`.

### Nova aba de prova

1. `workspace-model.ts`: acrescente o valor em `FontSpecimenTab` ou `IconSpecimenTab` e em `FONT_TABS` ou `ICON_TABS`, porque o saneamento descarta valores desconhecidos.
2. `specimen/asset-tab.tsx`: acrescente o rótulo na lista de abas e o caso em `Body`.
3. Escreva o componente da aba em `specimen/`, usando `SpecimenSection` se ela tiver critério.

### Novo atalho

1. `shortcuts.ts`: acrescente o tipo em `Command`, a regra em `matchShortcut` e o rótulo em `LABELS`, com teste. Para letras e símbolos, compare por `event.key`; para Alt+tecla, compare por `event.code`. Veja as armadilhas.
2. `atelier.tsx`: trate o comando em `runShortcut`. Se ele usar setas, confira a guarda `ARROW_WIDGETS`.
3. Se fizer sentido, mostre o atalho num tooltip (`IconButton shortcut=…`) e na paleta.

### Novo comando na paleta

Em `command-palette.tsx`, acrescente um `<Action icon label shortcut onSelect>` no grupo "Comandos". A ação deve chamar uma função de `commands.ts`.

### Nova configuração por painel (sincronizável)

1. `workspace-model.ts`: acrescente em `PaneSettings`, em `DEFAULT_PANE_SETTINGS`, em `SYNC_FIELDS` (sob a chave de sincronia certa), em `sanitizeSettings` e em `isSettings`.
2. Teste a propagação com `applySettings` em `workspace-model.test.ts`.
3. Ligue o controle em `specimen/asset-tab.tsx` (`onSettings`).

### Nova operação de painel

1. Escreva uma função pura em `workspace-model.ts`. Ela recebe e devolve um `Workspace`, e devolve o mesmo objeto quando não faz nada.
2. Teste com `checkWorkspace(ws)`, que deve voltar `[]` depois de cada operação.
3. Exponha a operação em `commands.ts` com `ws().update(...)`.

### Mudar um campo persistido (qualquer store)

1. Suba `version` no `persist` do store.
2. Biblioteca: estenda `migrateLibrary` e cubra o caso antigo em `migrate.test.ts`.
3. Espaço de trabalho: `sanitizeWorkspace` tolera campos ausentes e completa os valores padrão; teste em `workspace-model.test.ts`.
4. No PR, diga o que acontece com os dados de quem já usa.
