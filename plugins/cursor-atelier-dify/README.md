# atelier-dify (plugin do Cursor)

Sem servidor próprio: aponta pro MCP embutido de cada app do Dify 1.17.1 e pro `/mcp` do atelier.

## Configurar (na sua máquina)

Defina as variáveis de ambiente antes de abrir o Cursor. As URLs carregam credencial: nunca commitar.

- `DIFY_SPEC_MCP_URL`: URL gerada em app > pontos de acesso > MCP Server ([doc](https://docs.dify.ai/en/self-host/use-dify/publish/publish-mcp)). O app não pode ter nó de gatilho (ALL-95).
- `ATELIER_MCP_URL`: endereço da rota `/mcp` do atelier rodando local.

## Instalar local

Copie esta pasta (`plugins/cursor-atelier-dify` no repositório) pra `~/.cursor/plugins/local/atelier-dify` e recarregue o Cursor.

## A confirmar

- Transporte `streamable-http` do MCP do Dify. O do atelier está confirmado: `/mcp` fala Streamable HTTP sem sessão, só por POST (`src/routes/mcp.ts`).
- Nome exato da ferramenta exposta pelo app do Dify (sai da ALL-93).

Issue: ALL-103.
