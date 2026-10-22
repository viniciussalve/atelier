# Sistema de design como direção

Fonte: LukeW, [Design Systems for AI Agents](https://www.lukew.com/ff/2164/design-systems-for-ai-agents).

## Regra

O sistema de design é a camada que dirige o agente. Não é documentação para
pessoa ler: **agente lê toda vez**.

- Toda cor vem do `@theme` de `src/styles.css`, pelo nome do token. Um hex novo é
  um bug, não uma decisão.
- Reuse o componente que já existe antes de escrever outro. Se falta variante,
  adicione variante ao componente existente.
- `docs/ds/` é gerado do código e é a referência escrita: `tokens.md` e uma página
  por componente. Nunca edite à mão — mude o código e rode `npm run ds:gerar`.
- O código é a fonte da verdade. Não sincronize Figma, não copie spec de design
  para dentro do repositório.
- As regras visuais mais finas já estão em
  `.claude/skills/atelier-iteracao/references/design.md`; esta regra não as repete.

## Como verificar

`npm run ds:reuso` falha em hex, em cor de paleta do Tailwind (`bg-zinc-900`) e em
medida arbitrária (`w-[137px]`). `npm run ds:gerar -- --check` falha quando
`docs/ds/` ficou para trás do código. `npm test` roda os dois.
