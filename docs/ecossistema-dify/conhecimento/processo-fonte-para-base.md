# Processo: como uma fonte vira base (ALL-98)

Vale pro atelier e pra qualquer app futuro do ecossistema.

## 1. Preparar a fonte

- Formato: `.md` com headings fixos por tipo de documento. Código e JSON grandes (ex. `google-fonts.json`, 490 KB) ficam fora.
- Cada arquivo diz de onde veio (caminho no repo) e, se tiver texto gerado por IA, marca o trecho.
- Um tipo de fonte por base. Não misturar componentes com regras: o chunking certo é diferente e não muda depois de criar.

## 2. Escolher o chunking (antes de criar; não dá pra mudar)

| Fonte                                            | Modo                                 |
| ------------------------------------------------ | ------------------------------------ |
| Unidade fechada e curta (componente, token, FAQ) | Geral, 1 unidade = 1 chunk           |
| Texto longo com seções (guias, regras)           | Parent-child, parent = parágrafo     |
| Planilha de pergunta e resposta                  | Q&A (só no pipeline, Alta Qualidade) |

## 3. Metadados

- Definir os campos na base antes da primeira ingestão. Nomes: minúsculas, números e `_`.
- Valores sempre minúsculos (o filtro é case-sensitive).
- Mínimo: o campo de identidade (`componente`, `fonte`) e o caminho do arquivo.

## 4. Ingerir

Caminho decidido pela ALL-96:

- **A. Plugin `langgenius/github_datasource` no Knowledge Pipeline**, se ele limitar a pasta e aceitar metadados. Disparo pela API `Run Pipeline`.
- **B. Script pela API de conhecimento** (plano B): `Create Document by Text` na primeira vez, `Update Document by Text` depois (reindexa só quando o texto muda), e `Update Document Metadata in Batch` pros metadados. Chave dataset-scoped.

## 5. Testar e decidir

1. Rodar o teste de recuperação da base (CSV) e guardar os resultados com a data.
2. Comparar com a última rodada.
3. **Piorou** (algum chunk esperado saiu do Top K): rollback. No caminho B, reenviar a versão anterior do `.md` (que está no git). Mudança de chunking piorou: recriar a base, porque o modo não muda.
4. **Igual ou melhor**: fica.

## 6. Cuidados da 1.17.1

- CSV, Excel, Notion e páginas web importados antes da 1.17.1 precisam ser reimportados (correções de extração). Instalação nova: não se aplica.
- Weaviate embarcado: não dar kill forçado no container durante a indexação (pode corromper o índice HNSW).
