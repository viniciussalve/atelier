# Configuração das bases (ALL-100) — Dify 1.17.1

Fontes: docs.dify.ai (Knowledge, self-host) e código da tag 1.17.1. Valores marcados **[ajustar no teste]** são ponto de partida e só viram definitivos depois do `teste-recuperacao.csv`.

## Regras gerais (valem pras duas)

| Item             | Valor                                                                                                       | Por quê                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipo de base     | Pronta (ready-to-use) se a ingestão for pela API; Knowledge Pipeline se o plugin de GitHub passar na ALL-96 | A fonte de dados não pode ser trocada depois de criar a base, então decidir antes de criar                                                                  |
| Índice           | **Alta Qualidade**                                                                                          | Precisa de busca híbrida e de parent-child. Não dá pra voltar pra Econômico, mas não vamos querer                                                           |
| Embedding        | Um modelo **multilíngue** disponível no seu provedor (conteúdo é pt-BR + nomes de código em inglês)         | Trocar o embedding depois re-embeda tudo; escolher uma vez e congelar. Escolha final junto com o Dify Modelos e Prompts, que sabe quais provedores você tem |
| Busca            | **Híbrida + Rerank**                                                                                        | Full-text pega nomes exatos (`IconButton`, `segmented`); vetor pega a intenção ("alternar entre opções"). O rerank ordena os dois                           |
| Score threshold  | **Desligado** no começo, depois **[ajustar no teste]**                                                      | Sem números reais qualquer valor é chute. Rodar o teste, ver o menor score dos acertos e o maior dos erros, e pôr o corte entre eles                        |
| Limpeza de texto | "Replace consecutive spaces…" **ligado**; "Remove URLs and emails" **desligado**                            | Os `.md` têm caminhos de arquivo e links de doc que precisam continuar no chunk                                                                             |
| Metadados        | Ligados, filtro **Automático** primeiro                                                                     | Se o automático errar o filtro no teste, aí entra um Parameter Extractor (Dify Workflows) com filtro Manual                                                 |

## Base "Componentes"

Fonte: `docs/ds/componentes/*.md`, um arquivo por componente, gerado pelo script da ALL-90.

| Item               | Valor                                                                        | Por quê                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chunking           | **Geral**                                                                    | Cada componente é uma unidade completa; não tem hierarquia pra parent-child aproveitar                                                                          |
| Delimitador        | Um marcador que não aparece no texto, ex. `<<<FIM>>>` no fim de cada arquivo | Garante 1 componente = 1 chunk. O delimitador é removido do texto pelo Dify                                                                                     |
| Tamanho máximo     | **4000** (teto do `INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH`)                 | Evita corte no meio do componente. O script tem que manter cada `.md` abaixo disso; se passar, o Dify corta à força                                             |
| Overlap            | **0**                                                                        | Chunk = documento inteiro; overlap só duplicaria texto de outro componente                                                                                      |
| Top K              | **3** [ajustar no teste]                                                     | A pergunta típica quer 1 componente; 3 dá margem pra alternativas sem lotar o contexto                                                                          |
| Metadados (String) | `componente`, `camada` (`ui` ou `library`), `arquivo`, `export`              | Permitem filtrar "só ui" ou achar pelo nome exato. Nomes em minúsculas e `_`, como o Dify exige. O filtro é case-sensitive: o script grava sempre em minúsculas |

Headings fixos de cada `.md` (contrato com o Proto Bot): nome, camada, props, quando usar (marcado como gerado por IA), snippet, caminho do arquivo, nome do export, telas onde aparece.

## Base "Regras do DS"

Fonte: `.claude/skills/atelier-iteracao/references/{design,arquitetura,armadilhas,verificacao}.md` + `README.md`.

| Item                       | Valor                                                                            | Por quê                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Chunking                   | **Parent-child**, parent = **Parágrafo**                                         | A pergunta casa com uma frase (child), mas a regra só faz sentido com a seção em volta (parent). Full Doc não serve: corta em 10.000 tokens |
| Parent: delimitador / máx. | `\n## ` / **2000** [ajustar no teste]                                            | Cada seção H2 vira um parent. 2000 cabe uma seção típica sem misturar duas                                                                  |
| Child: delimitador / máx.  | `\n` / **400** [ajustar no teste]                                                | Uma regra por linha/bullet; 400 é um pouco menor que o default (512) pra child ficar focado                                                 |
| Top K                      | **4** [ajustar no teste]                                                         | Regras costumam vir em pares (regra + armadilha); como volta o parent, 4 já traz bastante contexto                                          |
| Metadados (String)         | `fonte` (nome do arquivo), `tema` (design, arquitetura, armadilhas, verificacao) | Permite o fluxo pedir só "armadilhas" na etapa de revisão                                                                                   |

## Onde configurar a recuperação

- No **nó Knowledge Retrieval** do fluxo piloto (ALL-93). A configuração tem duas camadas: a da base e a do nó; a do nó é a que vale na execução.
- Com as duas bases no mesmo nó, só os metadados em comum aparecem no filtro. Por isso é melhor **dois nós Knowledge Retrieval**, um por base. Isso é escolha de fluxo: a Dify Workflows decide.
- Citações: no piloto, a fonte de cada item da `InterfaceSpec` vem de `metadata.arquivo` no `result` do nó Knowledge Retrieval, sem depender do recurso de citação da interface.
