# Contexto compartilhado

Fonte: LukeW, [Collaborative Steering](https://www.lukew.com/ff/2153/collaborative-steering).

## Regra

O contexto que dirige os agentes é do projeto, não de quem pediu. Ele mora em
`AGENTS.md`, em `docs/steering/` e neste repositório — não no prompt de uma
pessoa, não na memória de uma conversa, não num MCP local.

Quando a pessoa pedir algo que contraria uma regra daqui, o agente edita a regra
neste repositório e diz o que mudou. Não inventa um ponto de vista paralelo: é
assim que um time entrega quinze ideias em vez de uma.

Hoje o contexto se esconde em três lugares, e só o primeiro é compartilhado:

| Onde | Quem lê |
| --- | --- |
| `AGENTS.md` e `docs/steering/` | todo mundo, versionado |
| `.claude/skills/atelier-iteracao/` | quem usa aquela ferramenta |
| memória de agente, prompt de sistema | ninguém além de quem escreveu |

Regra prática: se a decisão muda o produto, ela pertence ao primeiro lugar.

## Como verificar

`git log --oneline -- docs/steering AGENTS.md` mostra quando o contexto mudou e
por quê. Se você aprendeu algo que vale para o próximo agente e não está aqui,
voltou a existir contexto escondido.
