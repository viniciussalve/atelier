# Ciclos de verificação

Fonte: LukeW, [Consistent Character Maker Update](https://www.lukew.com/ff/2146/consistent-character-maker-update).

## Regra

Uma checagem estrutural barata vale mais que revisão visual item a item. O caso
que originou a regra: comparar a dimensão da imagem devolvida com a da referência
pegava o erro em 1 de cada 30-40 gerações, sem custo nenhum. Checar cada imagem
com um modelo de visão pegava o mesmo erro e custava latência em 100% dos casos —
não valia a troca.

Três consequências para o Atelier:

1. Prefira uma verificação que o `npm test` roda em segundos a uma inspeção que
alguém precisa lembrar de fazer.
2. Prefira estrutura a conteúdo: "a medida é arbitrária?" é verificável; "o
espaçamento está bom?" não é.
3. Comece largo e aperte com uso real. Guardrail escrito antes do uso erra o alvo;
   guardrail apertado depois do uso acerta.

## Como verificar

Para cada regra em `docs/steering/`, existe um comando que falha quando ela é
violada — hoje `npm run ds:reuso` e `npm run ds:gerar -- --check`. Regra sem
comando é intenção, não regra.
