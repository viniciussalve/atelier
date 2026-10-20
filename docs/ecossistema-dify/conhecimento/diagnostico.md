# Diagnóstico: resposta errada — onde está o problema?

Sempre comece pelo **Retrieval Testing** da base (ou pela API de teste de recuperação) com a mesma pergunta. As alterações feitas lá valem só pra sessão de teste.

| Sintoma no teste                                                                | Causa provável             | Correção                                                                                                                                       |
| ------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| O chunk certo **não existe** (texto cortado ao meio ou dois componentes juntos) | **Chunk**                  | Delimitador/tamanho; arquivo maior que o máximo; script fora do contrato de headings                                                           |
| O chunk certo existe mas não volta nem com Top K no máximo                      | **Embedding** ou **texto** | Pergunta e chunk usam palavras muito diferentes: melhorar o "quando usar" do `.md`; se for geral, rever o modelo de embedding (re-embeda tudo) |
| Volta, mas fora do Top K / abaixo do threshold                                  | **Busca**                  | Rerank ligado? Híbrida? Threshold alto demais? Ajustar com os scores do CSV                                                                    |
| Volta o componente certo e o filtro de metadado some com ele                    | **Metadado**               | Valor com maiúscula (filtro é case-sensitive) ou filtro Automático errou; ir pro Manual com Parameter Extractor                                |
| O chunk certo vem em 1º lugar e mesmo assim a resposta erra                     | **Prompt / fluxo**         | Não é RAG: Dify Modelos e Prompts (prompt) ou Dify Workflows (variável errada indo pro LLM)                                                    |

Toda mudança de chunk, embedding ou busca passa pelo processo de `processo-fonte-para-base.md` §5 (testar e rollback se piorar).
