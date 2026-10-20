# Plano de avaliação v0: ecossistema Dify × atelier

Responsável: Dify Qualidade · Linear: ALL-94, ALL-97, ALL-99, ALL-101 · Dify alvo: 1.17.1 (self-hosted)
Fonte de tokens: `src/styles.css` do atelier, lido ao vivo pelo gerador e publicado em `docs/ds/tokens.md` (em 19/10/2026: 26 tokens no `@theme`, 21 cores, 2 fontes e 3 raios).

## Regra de processo

Nenhuma issue vai pra Done sem passar no conjunto de teste da camada dela. Mudou prompt, modelo, fluxo ou base: roda de novo e compara com a rodada anterior.

## Camadas

| Camada         | O que mede                                                                    | Como roda                                                                          | Quando                                                    |
| -------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 0. Recuperação | O chunk esperado aparece no Top K                                             | Retrieval Testing / API de teste de recuperação                                    | A cada reimportação das bases (ALL-99, linhas da ALL-102) |
| 1. Spec        | JSON válido no schema da ALL-91, tokens e componentes existentes, rotas reais | `npm run ds:validar` (`scripts/ds/validar-spec.mjs`), automático, conjunto inteiro | A cada mudança do fluxo (ALL-97)                          |
| 2. Spec → PR   | Lint, teste visual e passos de clique funcionando                             | Proto Bot gera draft PR numa amostra fixa                                          | Antes de liberar versão (ALL-101 → ALL-92)                |

Se a camada 1 passa e a 2 falha, o problema é na implementação. Se a 0 falha, o problema é no conhecimento.

## Métricas e critérios (SUGESTÃO, calibrar na 1ª rodada real)

| Métrica                        | Fórmula                                                                                  | Critério sugerido                        |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Token certo                    | casos positivos com o token exato / casos positivos                                      | ≥ 90%                                    |
| Token inventado (1ª tentativa) | specs com token fora da fonte antes da correção / specs; vem de `meta.tokens_rejeitados` | ≤ 5%                                     |
| Token inventado (final)        | `tokens_inventados` do validador / specs                                                 | 0% (bloqueia)                            |
| Falso positivo                 | casos negativos apontados como violação / casos negativos                                | ≤ 5%                                     |
| Armadilha                      | casos de armadilha sem invenção / casos de armadilha                                     | 100% (bloqueia)                          |
| Spec válida                    | specs que passam no schema / specs                                                       | 100% (bloqueia)                          |
| Hit de recuperação             | perguntas com o chunk esperado no Top K / perguntas                                      | ≥ 90%                                    |
| Tentativas médias              | média de `meta.tentativas`                                                               | acompanhar; subir é sinal de prompt ruim |

## Quem corrige

- Falha na camada 0: Dify Conhecimento (chunk, busca, metadados).
- Falha no schema ou nó: Dify Workflows.
- Token certo baixo ou inventado alto com recuperação ok: Dify Modelos e Prompts.
- Camada 2 falha com camada 1 ok: Proto Bot / implementação.

## Observabilidade em produção (existe na 1.17.1)

- Logs e rastreio nó a nó do Workflow.
- Feedback like/dislike por mensagem: `POST /messages/{id}/feedbacks`, `GET /app/feedbacks`.
- Integrações de trace no código da 1.17.1: Langfuse, LangSmith, Opik, Arize, Phoenix, W&B Weave, Aliyun, MLflow, Databricks, Tencent.

## Pendências pra fechar o v0

- Schema da `InterfaceSpec` (ALL-91): proposta v0 em `docs/ds/interface-spec.v0.schema.json`, falta a aprovação da sala.
- `docs/ds/` (ALL-90): gerado; componentes e rotas de T19 a T21 preenchidos no CSV.
- Lista de exceções final do Tech Lead DS → revisar T14 a T18 (T18 está como "a decidir").
- Se a fonte virar DTCG JSON, o leitor de tokens (`scripts/ds/tokens.mjs`) já lê o formato.
- Instância em `localhost:8080` não é acessível daqui: a rodada real roda na máquina do Vinicius ou por endereço exposto.
