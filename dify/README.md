# Apps do Dify

DSL dos apps do ecossistema, gerado por `npm run ds:gerar` para o Dify 1.17.1 (DSL `0.7.0`). Não edite no Dify: mude o repositório, regenere e reimporte. O `npm test` falha se um arquivo daqui ficar para trás.

## `validar-spec.yml` (ALL-104)

Workflow sem LLM: Início (`spec`, a InterfaceSpec como texto) → Code (JavaScript) → Fim (`valida`, `erros`, `tokens_rejeitados`).

O nó Code é o `scripts/ds/validar-spec.mjs` com o que o atelier tem embutido ao lado: o schema v0, os 26 tokens, as páginas de componente, os documentos das bases e as rotas. Por isso o app não precisa alcançar o repositório privado de dentro do Docker do Dify. Em troca, **reimporte o app sempre que tokens, componentes ou rotas mudarem**.

### Importar e publicar
1. Estúdio → criar app → importar arquivo DSL → `dify/validar-spec.yml`.
2. Rode uma vez com o conteúdo de `docs/ds/exemplos/t19-comparar-fontes.json`: tem que voltar `valida: true`.
3. Publique. Em pontos de acesso, ligue a API (para o conjunto de teste da ALL-97) e o MCP Server (para o plugin do Cursor, `DIFY_VALIDAR_MCP_URL`). O app não tem nó de gatilho, então os dois ficam disponíveis.

A ferramenta MCP leva o nome do app, `validar-spec`, e recebe `spec` como texto.

### O que foi conferido sem uma instância
- O arquivo lido com PyYAML (o mesmo do Dify): `version` sai como texto `"0.7.0"`.
- Os três nós validados nas classes `StartNodeData`, `CodeNodeData` e `EndNodeData` do `graphon` 0.7.0, o pacote de nós da 1.17.1.
- O nó Code rodado no Node com o mesmo invólucro do executor de JavaScript do Dify: devolve só as três saídas declaradas.
- As listas de saída ficam em no máximo 30 itens (`CODE_MAX_STRING_ARRAY_LENGTH`); o 30º erro vira "… e mais N erros.".

Importado e rodado numa instância 1.17.1 pelo Vinicius em 20/10/2026: funcionou.
