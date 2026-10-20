# Plano de implementação: ecossistema Dify × atelier

Ponto de partida: o kickstart parcial (conhecimento, qualidade, pesquisa e plugin do Cursor) e as issues ALL-90 a ALL-104 do Linear. Alvo: Dify 1.17.1 self-hosted.

Este plano separa o que **dá pra fazer no repositório agora** do que **depende de uma instância do Dify ou de uma decisão da sala**. A instância em `localhost:8080` não é acessível daqui, então nada nas etapas abaixo chama o Dify.

## Como as peças se ligam

```
código do atelier ──(gerador, sem IA)──► docs/ds/tokens.md
                                         docs/ds/componentes/*.md ──► bases do Dify (ALL-100)
                                                                       │
pedido de tela ──► fluxo piloto (ALL-93) ──► InterfaceSpec ──► validar-spec (ALL-104)
                                              ▲   schema único (ALL-91)  │
                                              └──── Loop de correção ◄───┘
```

O gerador, o schema e o validador moram no repositório e são a "fonte única": o Dify lê o que sai daqui, nunca o contrário.

## Etapas no repositório

Cada etapa é um commit, com o próprio critério de pronto.

| #   | Etapa                    | Issue           | Entrega                                                                                                                        | Pronto quando                                                                                                                                                                                            |
| --- | ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Planejamento e kickstart | —               | Este arquivo, o material do kickstart em `docs/ecossistema-dify/` e o plugin do Cursor em `plugins/cursor-atelier-dify/`       | Os caminhos do kickstart apontam pros arquivos reais do repositório                                                                                                                                      |
| 1   | Tokens                   | ALL-90          | Leitor de tokens (`scripts/ds/tokens.mjs`: `@theme` do CSS hoje, DTCG JSON depois) e `docs/ds/tokens.md`                       | Os 26 tokens do `@theme` aparecem com valor, grupo e comentário; teste do leitor nos dois formatos                                                                                                       |
| 2   | Componentes              | ALL-90          | `docs/ds/componentes/<arquivo>.md`, um por arquivo `.tsx` de `src/components/ui` e `src/components/library`                    | Headings fixos; exports e props saem dos tipos do TypeScript; "onde aparece" sai de uma busca nos imports; cada arquivo tem metadados em minúsculas, termina em `<<<FIM>>>` e fica abaixo de 4000 tokens |
| 3   | "Quando usar"            | ALL-90          | O único trecho escrito por IA, marcado como gerado                                                                             | Todo componente tem o texto; o gerador preserva o texto ao regenerar                                                                                                                                     |
| 4   | Contrato v0              | ALL-91          | `docs/ds/interface-spec.v0.schema.json`                                                                                        | Cobre os campos combinados na sala (`meta`, `fonte` por token e componente, `fluxo` com `rota`/`acao`/`alvo`); marcado como **proposta** até a sala aprovar                                              |
| 5   | Validador                | ALL-104, ALL-97 | `scripts/ds/validar-spec.mjs`: JavaScript puro, sem dependência, pronto pra colar no nó Code do Dify; CLI `npm run ds:validar` | Confere schema, tokens, componentes e rotas; devolve `{valida, erros[], tokens_rejeitados[]}`; casos T19 a T21 do conjunto como testes                                                                   |
| 6   | Guarda e entrega         | ALL-90          | `npm run ds:gerar`, teste que falha se `docs/ds/` estiver desatualizado, PR em draft                                           | `npm test`, lint e typecheck limpos; draft PR aberto                                                                                                                                                     |

**Status (20/10/2026):** as etapas 0 a 6 estão feitas no branch deste plano, uma por commit. O que falta para fechar cada issue:

- ALL-90: a conferência por amostragem do Dify Qualidade.
- ALL-91: a revisão da sala e a aprovação do Vinicius. As três propostas novas (`lacunas`, `acao` fechada, `nome` separado de `export`) estão em `contrato-interface-spec-v0.md`.
- ALL-104: montar o app no Dify. Ninguém rodou o validador dentro do sandbox de JavaScript do nó Code ainda; ele não usa nenhuma API além do JavaScript padrão, mas isso é a primeira coisa a conferir.

### Decisões tomadas aqui (revisáveis)

- **Validador em JavaScript, não Python.** O repositório é Node e o `npm test` já roda `node --test`. O nó Code do Dify aceita JavaScript, então o mesmo arquivo serve para a CI e para o app `validar-spec`, e a regra fica num lugar só (pedido da ALL-93). Ele substitui o `validar_spec.py` do kickstart.
- **Sem `styles.snapshot.css`.** O gerador lê o `src/styles.css` vivo e o teste de sincronia acusa a diferença. Uma cópia congelada só ficaria velha.
- **Um `.md` por arquivo, não por export.** Os exemplos do teste de recuperação já assumem isso (`segmented.md`, `dialog.md`) e um arquivo como `dropdown-menu.tsx` só faz sentido inteiro. O metadado `export` lista todos os exports do arquivo.
- **"Telas onde aparece" = arquivos que importam o componente.** O atelier é uma tela só (`/`) com áreas (barra lateral, coleção, painéis, inspetor). A área sai do caminho do arquivo que importa.
- **Rotas reais = arquivos de `src/routes/`**, lidos pelo validador, sem lista escrita à mão.
- **Schema conferido por um subconjunto de JSON Schema escrito no validador**, sem `ajv`: são só as palavras-chave que o schema v0 usa. Uma palavra-chave nova no schema precisa entrar no validador, e um teste falha enquanto ela não entrar.

### As cinco lentes, aplicadas a este material

O material aqui não é tela: é texto lido por um recuperador e JSON lido por uma máquina. As lentes valem do mesmo jeito.

- **Ive, verdade do material.** Um chunk é o material. Um componente = um chunk, com as palavras que a pergunta usa ("alternar entre opções"), não só o nome no código.
- **Rams, contenção.** Headings fixos e nada além deles. Nada de cópia do schema na skill do Cursor nem de snapshot de tokens.
- **Hadid, movimento.** Quem chega pelo `PLANO.md` atravessa as etapas em ordem; cada pasta é uma sala com um dono (conhecimento, qualidade, pesquisa).
- **Ingels, função dupla.** O erro do validador também é a correção: ao rejeitar `--color-primary`, ele sugere o token real mais próximo, e isso alimenta o Loop de correção do fluxo piloto.
- **Norman, affordance.** Cada erro diz onde (`componentes[2].nome`), o quê e o que existe no lugar. Quem lê não precisa abrir o validador para entender.

## Fora do repositório (depende do Dify ou da sala)

| Ordem | Passo                                                                              | Quem              | Depende de       |
| ----- | ---------------------------------------------------------------------------------- | ----------------- | ---------------- |
| A     | Rodar `conhecimento/roteiro-all-96-plugin-github.md` e decidir plugin ou API       | Vinicius          | Instância local  |
| B     | Criar as bases conforme `conhecimento/configuracao-bases.md`                       | Dify Conhecimento | A + etapas 1 a 3 |
| C     | Ingerir `docs/ds/` (plugin, ou script pela API de conhecimento se o plugin falhar) | Dify Conhecimento | A, B             |
| D     | Rodar `conhecimento/teste-recuperacao.csv` e calibrar o threshold                  | Dify Qualidade    | C                |
| E     | Aprovar o contrato v0                                                              | Sala + Vinicius   | Etapa 4          |
| F     | App `validar-spec` em DSL (cola o validador da etapa 5 no nó Code)                 | Dify Workflows    | E, etapa 5       |
| G     | Fluxo piloto em DSL (ALL-93)                                                       | Dify Workflows    | E, F, D          |
| H     | Plugin do Cursor carregado local (ALL-103)                                         | tinkabot          | G                |
| I     | Segunda camada: spec vira draft PR (ALL-92, ALL-101)                               | Proto Bot         | G                |

O script de sincronização pela API (plano B do passo C) fica pra depois da decisão do passo A: escrever antes seria código que pode não ser usado.
