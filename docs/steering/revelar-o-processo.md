# Revelar o processo

Fonte: LukeW, [Showing the Work of Agents in UI](https://www.lukew.com/ff/2142/showing-the-work-of-agents-in-ui).

## Regra

O trabalho do agente aparece como **uma linha**, que abre para o detalhe. Quem
quer o resultado lê o resultado; quem está conferindo abre a linha e lê o passo
a passo.

- O processo é o indicador de progresso. Nada de spinner girando sem dizer o que
  está acontecendo: a linha diz o que o agente decidiu e qual ferramenta usou.
- Enquanto o agente trabalha, a linha fica visível. Quando o resultado chega, ela
  recolhe para um resumo de uma linha com o link para reabrir.
- Ferramenta e resultado ficam aninhados: o resultado abre sob a ferramenta que o
  produziu, não numa lista paralela.
- Configurar ferramenta não é trabalho da pessoa. O agente escolhe e configura.

A tentação é mostrar tudo, porque o trabalho é interessante. Já foi testado e é
demais: a maior parte das pessoas quer o resultado, e as poucas que conferem
sabem abrir uma linha.

## Como verificar

Pergunte a alguém que não escreveu o código: "o que o agente está fazendo agora?".
Se a resposta exigir interpretar um spinner ou abrir uma aba, a linha está faltando.
