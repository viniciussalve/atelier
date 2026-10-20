---
name: atelier-interface-spec
description: Use quando for criar ou alterar uma tela do atelier. Pede a InterfaceSpec ao app do Dify antes de escrever código, e consulta fontes e ícones no /mcp do atelier.
---

# InterfaceSpec do atelier

1. Antes de escrever código de tela, chame a ferramenta do servidor `dify-interface-spec` com o pedido da tela.
2. A resposta é uma `InterfaceSpec` em JSON. O formato oficial é o schema único da ALL-91, em `docs/ds/interface-spec.v0.schema.json` no repositório do atelier; não copie nem reescreva o schema aqui.
3. Use só os tokens e componentes que vierem na spec, com o nome exato. Na dúvida, confira em `docs/ds/tokens.md` e `docs/ds/componentes/`. Se a spec citar algo que não existe no código, pare e reporte; não invente substituto.
4. Para catálogo de fontes e ícones, use o servidor `atelier`, não a spec.
5. Nunca invente dados de API: se um servidor não responder, diga qual e pare.
