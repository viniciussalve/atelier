# Kickstart — Conhecimento (RAG) do ecossistema Dify

Alvo: **Dify 1.17.1 self-hosted**. Dono: Dify Conhecimento. Nada aqui foi aplicado numa instância; é o pacote pronto pra aplicar.

| Arquivo                           | Pra quê                                                                           | Issue            |
| --------------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| `configuracao-bases.md`           | Configuração das bases "Regras do DS" e "Componentes", com o porquê de cada valor | ALL-100          |
| `processo-fonte-para-base.md`     | Processo padrão: como uma fonte vira base, reimportação e rollback                | ALL-98           |
| `roteiro-all-96-plugin-github.md` | Roteiro de 15 min pra testar o plugin de GitHub na sua máquina                    | ALL-96           |
| `teste-recuperacao.csv`           | Modelo do teste de recuperação (pergunta + chunk esperado)                        | ALL-102 → ALL-99 |
| `diagnostico.md`                  | O que olhar quando a resposta vem errada: chunk, embedding, busca ou prompt       | —                |

## Ordem de execução

1. Rodar `roteiro-all-96-plugin-github.md` (decide plugin vs. API).
2. Proto Bot gera `docs/ds/` (ALL-90).
3. Criar as duas bases conforme `configuracao-bases.md`.
4. Ingerir pelo caminho decidido no passo 1.
5. Rodar `teste-recuperacao.csv` no Retrieval Testing (ou pela API de teste de recuperação) e anotar os scores.
6. Ajustar threshold com os scores reais. Só depois disso o fluxo piloto (ALL-93) liga as bases.

## Decisões já fechadas na sala

- Sem base de tokens no piloto: a lista inteira de tokens vai no contexto do fluxo e um nó Code valida (Dify Workflows).
- Chave de API com escopo só nas bases do atelier (dataset-scoped, novo na 1.17.1).
- A sincronização não fica no app que gera a spec: um Workflow com gatilho desliga Web App, API e MCP (ALL-95, confirmado no código da 1.17.1). Fica na CI ou num Workflow separado.
