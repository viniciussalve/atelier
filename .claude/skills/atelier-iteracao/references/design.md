# Design e texto

## Identidade

- O cromo é escuro e sóbrio, com IBM Plex Sans. A estrela é o **espécime**, desenhado sobre o fundo escolhido (Papel, Névoa, Areia, Tinta, Marinho), e o cromo fica quieto em volta dele.
- O acento é o **azul de revisão** (`proof`, #93cfe4): a cor do lápis de marcar provas. Ele aparece no foco, no painel ativo, na seleção, na nota e no hover das divisórias.
  - Sobre papel, use `proof-ink` (#2b7894).
  - Não introduza outro acento; reserve o azul para estado e atenção.
- Veredito tem cor semântica: `good` para Usar, `warn` para Revisar, `bad` para Evitar. Use as classes de `evaluation/tones.ts`, por exemplo `VERDICT_CHIP` e `VERDICT_SOLID`, em vez de repetir cores.
- A nota dentro da prova funciona como marca de revisão na margem. É o elemento memorável: mantenha o resto disciplinado ao redor.

## Tokens (em `src/styles.css`, no `@theme`)

| Token                                  | Uso                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `bg`                                   | Fundo do app                                                                |
| `surface`                              | Barra lateral e barras de ferramentas                                       |
| `elevated`                             | Menus, hover, chips                                                         |
| `border`                               | Linhas e divisórias                                                         |
| `fg`                                   | Texto                                                                       |
| `muted`                                | Texto secundário                                                            |
| `subtle`                               | Texto terciário. Não use para texto pequeno importante: o contraste é baixo |
| `paper`, `mist`, `sand`, `ink`, `navy` | Fundos de prova                                                             |
| `proof`, `proof-fg`, `proof-ink`       | Acento                                                                      |
| `good`, `warn`, `bad`                  | Vereditos. Use com opacidade em chips (`bg-good/15 text-good`)              |

Cores em hex só em `shared/grounds.ts`, que espelha o tema para o Iconify colorir os SVGs. Não espalhe hex pelos componentes.

## Layout

- Cada painel é um `@container`. Ajuste o que aparece pela largura **do painel**, não da janela: `@sm:`, `@md:`, `@xl:`, `@2xl:`. A barra de filtros vira um único botão "Filtros" abaixo de `@2xl`.
- A janela abaixo de 860 px (`canSplit` falso) mostra um painel por vez, e barra e inspetor viram gavetas.
- Textos longos de prova ficam em até ~62ch.
- Divisórias têm 1 px de linha e área de clique maior; painéis têm 220 px de largura mínima (160 px na vertical).

## Texto (pt-BR)

- Use maiúscula só no início da frase. **Nada de rótulo em caixa-alta.**
- Use verbos e diga o que acontece: "Comparar lado a lado", "Limpar filtros", "Excluir pasta". A confirmação repete o verbo: "Excluir “Sans serif”?" com o botão "Excluir pasta".
- Estado vazio diz o que fazer, não lamenta: "Pasta vazia. Arraste itens da coleção ou da barra para a pasta."
- Contagens: "9 fontes", "2 de 9 fontes", "3 de 4 critérios". Use `itemCount` de `shared/labels.ts` para o plural.
- Notas no formato pt-BR, com vírgula: `formatScore` → "4,9".
- Não junte metadados com "·". Use elementos separados com espaçamento.
- Rótulos de dados não vão em fonte monoespaçada; use `tabular-nums`.

## Acessibilidade

- Todo botão só com ícone usa `IconButton`, que exige `label` e mostra tooltip. Passe `shortcut` quando houver atalho.
- O foco visível usa o contorno `proof`, já global em `styles.css`. Não remova `outline` sem pôr outro indicador no lugar.
- Use `aria-current` no item ou vista ativos, `aria-pressed` em alternâncias e `aria-expanded` em quem expande.
- O controle de nota usa o ToggleGroup do Radix, com setas e um nome por segmento ("Leitura: 4, Muito bom").
- Respeite `prefers-reduced-motion`; já há uma regra global. Animação só responde a ação da pessoa.
