# Vistas de trabalho

Fonte: LukeW, [Many Agents, Many Views](https://www.lukew.com/ff/2165/many-agents-many-views).

## Regra

Chat inicia, move e redireciona o trabalho. Ele não é o único jeito de ver o que
está acontecendo. O que responde "como isso vai ficar?" é a vista.

No Atelier, **vista é conteúdo de painel** — não é página nova, nem substitui o
shell. A barra lateral fixa (`w-64`, gaveta abaixo de 860 px), a árvore de painéis
do `react-resizable-panels` e a coluna do inspetor continuam como estão.

As quatro vistas que valem implementar:

| Vista | Responde | Estado no Atelier |
| --- | --- | --- |
| Diagrama | O que o agente pretende fazer, antes de gastar token | ainda sem dados |
| Passo a passo | Em que estágio do diagrama estamos, com o trecho em destaque | ainda sem dados |
| Antes e depois | A mudança de UI se explica sem ler código | **no painel**: item atual contra o padrão |
| Sistema de design ao vivo | "Qual padding?" a um olhar de distância | **no painel**: os mesmos tokens da rota |

Diagrama e passo a passo não existem porque não há o que desenhar: o Atelier ainda
não produz plano nem saída de agente. Uma vista vazia seria a mentira que esta regra
existe para impedir — elas entram quando houver dados, não antes.

Uma vista pode fixar uma captura para mostrar progresso de relance. Caixas do
diagrama que apontam para arquivo abrem o arquivo ao clicar.

## Como verificar

Se a única forma de acompanhar uma tarefa longa é rolar o chat, falta vista. Se
implementar uma vista exigiu mexer em `workspace-model.ts`, ela virou shell — e
não era para virar.
