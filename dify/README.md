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

## `interface-spec.yml` (ALL-93, fluxo piloto)

Workflow: Início (`pedido`) → busca em "Componentes" (Top K 3) → busca em "Regras do DS" (Top K 4) → Montar contexto → Laço, até 3 tentativas: LLM escreve a spec → Validar e preencher meta → Guardar a tentativa → Fim (`spec`, `valida`, `erros`, `tentativas`, `recuperados`).

`recuperados` é quantos trechos as duas buscas trouxeram. Com zero, o avaliador avisa que a rodada não mediu componentes nem a armadilha de tela.

- **Tokens:** a lista inteira de `docs/ds/tokens.md` vai no prompt, sem busca por Top K.
- **Saída estruturada:** o LLM devolve a spec no schema v0 sem `meta`.
- **Validação e `meta`:** o nó Code roda o mesmo validador do `validar-spec` e preenche `meta` (`flow_version` e `prompt_version` das variáveis de ambiente, `tentativas`, `tokens_rejeitados` das tentativas anteriores).
- **Correção:** se a spec for inválida, os erros voltam ao LLM na tentativa seguinte.
- **Avaliação:** o avaliador (`npm run ds:avaliar`) chama este fluxo pela API.

### Configurar
`dify/interface-spec.config.json`, versionado e sem segredo:
- `modelo`: `langgenius/deepseek/deepseek` + `deepseek-flash`. O plugin do DeepSeek não declara saída estruturada, então o Dify pede JSON pelo prompt (`json_object`); por isso o `thinking` fica desligado nos nós.
- `bases`: os ids das bases "Componentes" e "Regras do DS". Vazios até as bases existirem; com o id vazio, a busca volta sem nada e o fluxo roda só com os tokens.
- `flow_version`: suba a cada mudança do fluxo. O `prompt_version` é gerado do texto do prompt.
- `tentativas`: limite do laço.

Mudou a configuração: `npm run ds:gerar` e reimporte.

### O que mudou em relação ao desenho da ALL-93
- **Sem Parameter Extractor.** `configuracao-bases.md` manda testar primeiro o filtro de metadados Automático; o extrator entra só se o Automático errar no teste de recuperação.
- **Validação no próprio fluxo, não como ferramenta.** Chamar o `validar-spec` como ferramenta exigiria o id dele na sua instância. O nó Code é gerado do mesmo `scripts/ds/validar-spec.mjs`, então a regra continua num lugar só.
- **Sem a ferramenta do `/mcp` do atelier.** O catálogo de fontes e ícones não entra na spec v0. Fica para quando um pedido precisar dele.

### O que foi conferido sem uma instância
- Os 10 nós validados nas classes do `graphon` 0.7.0, incluindo a busca nas bases, o laço e o nó LLM com saída estruturada.
- Toda referência `{{#…#}}` aponta para um nó que existe.
- As variáveis do laço convertidas pelo próprio código do Dify, com os valores iniciais certos.
- O nó de validação e o de contexto rodados com o invólucro do executor de JavaScript do Dify.

Importado e rodado numa instância 1.17.1 pelo Vinicius em 20/10/2026, ainda sem as bases: "tela de login" saiu válida na 1ª tentativa, com 11 tokens reais, nenhum inventado e a falta de rota de login em `lacunas`.
