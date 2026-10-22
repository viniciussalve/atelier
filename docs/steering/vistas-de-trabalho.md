# Vistas de trabalho

Fonte: LukeW, [Many Agents, Many Views](https://www.lukew.com/ff/2165/many-agents-many-views).

## Regra

Chat inicia, move e redireciona o trabalho. Ele não é o único jeito de ver o que
está acontecendo. O que responde "como isso vai ficar?" é a vista.

No Atelier, **vista é conteúdo de painel** — não é página nova, nem substitui o
shell. A barra lateral fixa (`w-64`, gaveta abaixo de 860 px), a árvore de painéis
do `react-resizable-panels` e a coluna do inspetor continuam como estão.

As quatro vistas que valem implementar:

| Vista | Responde |
| --- | --- |
| Diagrama | O que o agente pretende fazer, antes de gastar token |
| Passo a passo | Em que estágio do diagrama estamos, com o trecho em destaque |
| Antes e depois | A mudança de UI se explica sem ler código |
| Sistema de design ao vivo | "Qual padding?" a um olhar de distância |

Uma vista pode fixar uma captura para mostrar progresso de relance. Caixas do
diagrama que apontam para arquivo abrem o arquivo ao clicar.

## Como verificar

Se a única forma de acompanhar uma tarefa longa é rolar o chat, falta vista. Se
implementar uma vista exigiu mexer em `workspace-model.ts`, ela virou shell — e
não era para virar.
