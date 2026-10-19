---
name: atelier-iteracao
description: Conduz uma iteração de desenvolvimento no Atelier, a ferramenta de avaliação de fontes e conjuntos de ícones. Cobre entender o pedido, desenhar, implementar com testes, verificar no navegador com screenshots, commitar e abrir e acompanhar o PR. Use sempre que o pedido mudar o Atelier, mesmo pequeno e mesmo que a pessoa não diga "iteração". Vale para nova funcionalidade, ajuste de interface, correção de bug, filtro, critério de avaliação, painel, atalho, prova de fonte ou de ícone e mudança no estado salvo.
---

# Iteração no Atelier

O Atelier é um app React 19, TanStack Start, Tailwind v4 e zustand 5. Ele serve para avaliar artefatos de design (fontes e conjuntos de ícones do Iconify) com:

- barra lateral em estilo explorador;
- coleção com filtros;
- painéis divididos como no VS Code;
- avaliação ponderada por critérios.

Toda a interface está em português do Brasil.

Uma iteração entrega uma mudança que funciona e foi vista funcionando. O pacote final tem quatro partes:

- código coberto por testes onde há lógica;
- checagens limpas;
- screenshots do navegador mostrando o comportamento novo;
- commit (ou PR) descrito em português para quem usa.

Os scripts citados ficam em `scripts/`, na pasta desta skill (no repositório, `.claude/skills/atelier-iteracao/`). Rode-os a partir da raiz do repositório e chame essa pasta de `$SKILL`.

## O ciclo

### 1. Preparar o ambiente

```bash
bash $SKILL/scripts/setup.sh
```

O script é idempotente e faz três coisas:

- instala as dependências com `--legacy-peer-deps`, porque o `npm install` puro trava num bug do npm;
- cria o `.grok/app-env.json` local, sem o qual três testes falham;
- tira o `package-lock.json` do git.

Rode-o ao começar, mesmo que pareça desnecessário: é barato e evita perder tempo com falhas que não são suas.

### 2. Entender o pedido e o código

Um pedido costuma descrever um sintoma ("X não aparece", "Y não acha Z"). Antes de codar, escreva para si, numa frase, o que a pessoa quer **conseguir fazer** quando a mudança estiver pronta. Exemplo: "a nota não aparece no card" quer dizer "quero comparar as notas olhando a grade". O número aparecer não basta se ele fica cortado num painel estreito. Esse objetivo é o que você vai verificar no passo 5.

Leia o código que o pedido toca antes de propor qualquer coisa. `references/arquitetura.md` mapeia onde mora cada parte e traz receitas para as mudanças comuns: critério, faceta de filtro, vista, aba de prova, atalho, comando da paleta, configuração sincronizável entre painéis e campo persistido. Use a receita quando houver uma: ela lista os arquivos que precisam mudar juntos, e esquecer um deles é a causa mais comum de bug aqui.

### 3. Decidir o tamanho e desenhar

- **Pequeno**: uma correção ou ajuste local, sem escolha de produto em aberto. Implemente direto e explique no fim.
- **Médio ou grande**: tem escolhas que a pessoa precisa fazer (onde fica o controle, o que acontece no caso X) ou muda o formato salvo. Apresente um desenho curto: o que muda para quem usa, os arquivos tocados e como vai verificar. Espere a resposta antes de codar, a menos que a pessoa já tenha dito para seguir.

Mudança no formato persistido (store da biblioteca ou do espaço de trabalho) é sempre médio ou maior: exige subir a versão e migrar com teste. Veja `references/armadilhas.md`.

### 4. Implementar

Coloque cada coisa no lugar certo; a separação é o que mantém o projeto testável.

- **Regra de negócio** (cálculo, filtro, ordenação, operação de painel, migração): módulo puro em `src/lib/library/`, com o teste escrito primeiro, rodado para ver falhar e depois passar. Esses módulos rodam em `node --experimental-strip-types`, então:
  - use imports relativos com `.ts`;
  - use `import type` para tipos;
  - não use enums nem parameter properties.
- **Estado e orquestração**:
  - `store.ts` guarda a biblioteca e `workspace.ts` guarda os painéis.
  - Fluxos que tocam os dois stores vão em `commands.ts`, que já tem um teste em `commands.test.ts` com `localStorage` simulado.
  - Seletores ficam em `hooks.ts`.
- **Interface**: componentes em `src/components/library/<área>/` e wrappers Radix em `src/components/ui/`. Siga `references/design.md` para tokens, texto e acessibilidade.

Antes de mexer em seletores do zustand, menus Radix, arrastar e soltar, atalhos ou salvamento com atraso, leia `references/armadilhas.md`. Cada item ali já custou um bug neste projeto.

### 5. Verificar

Primeiro as checagens rápidas:

```bash
bash $SKILL/scripts/check.sh
```

Ele roda typecheck, lint, testes e o `prettier --check` só nos arquivos que você mudou. Formate só esses arquivos (`npx prettier --write <arquivos>`). Formatar pastas inteiras reformata código alheio, por exemplo `src/components/preview-host-bridge.tsx`. Se acontecer, desfaça com `git checkout -- <arquivo>`.

Depois, o navegador. Mudança de interface só está pronta depois que você a viu funcionando:

1. Suba o servidor: `bash $SKILL/scripts/server.sh start [porta]`. Ele roda sozinho em segundo plano e só volta quando o app responde. Se o processo morrer, ele mostra o log na hora. A porta padrão é 8080; se ela estiver ocupada por outra sessão, passe outra porta aqui e no `run.sh`.
2. **Refaça o caminho da pessoa.** Escreva um roteiro seguindo `references/verificacao.md` e rode-o com `bash $SKILL/scripts/e2e/run.sh <roteiro> [porta]`.
   - O roteiro faz o que ela faria, do jeito que ela faria (digitar, Enter, clicar, arrastar), até chegar ao objetivo do passo 2. Não basta conferir que o elemento existe.
   - **Se o próprio pedido ainda não funciona nesse caminho, corrija.** Vale mesmo que a causa não seja a que ela citou e mesmo que já existisse antes. Exemplos: o filtro aplica, mas some ao recarregar; o botão existe, mas fica escondido no celular; o atalho funciona, mas não no teclado ABNT2. Por quê: quem pediu vai testar fazendo o caminho inteiro. Se o último passo falha, para essa pessoa o pedido não foi atendido.
     - Se a correção mexe em comportamento além do pedido, ponha-a num commit separado e diga isso.
     - Se for grande demais para agora, diga logo no começo do relatório final.
   - **Outros bugs que você encontrar no caminho, que não impedem o pedido, só anote.** Não corrija, mesmo que pareçam pequenos. No relatório final, liste cada um com o sintoma e como reproduzir. Por quê: a pessoa quer revisar só o que pediu, e cada correção fora do pedido aumenta o diff, o tempo da iteração e o risco. Ela decide depois se vira a próxima iteração.
3. Rode o smoke, que é a regressão dos fluxos principais: `bash $SKILL/scripts/e2e/run.sh $SKILL/scripts/e2e/smoke.cjs [porta]`. Ele leva menos de um minuto. Rode-o uma vez, com a mudança pronta, e de novo só se mexer no código depois. Se a mudança altera algo que o smoke verifica (um rótulo, uma contagem), atualize o smoke no mesmo commit.
4. **Abra e olhe os screenshots** antes de afirmar que está pronto. O teste passar não garante que o layout não quebrou num painel estreito.
5. Pare o servidor: `bash $SKILL/scripts/server.sh stop [porta]`.

### 6. Commitar

Faça um commit por etapa coerente. A mensagem fica em português:

- primeira linha curta, no imperativo e sem ponto final, como no histórico do repositório: "Corrige…", "Adiciona filtro por…";
- depois, tópicos dizendo o que muda para quem usa e por quê;
- por fim, as linhas de atribuição que o ambiente pedir.

Nunca commite `package-lock.json`, `screenshots/` nem `.grok/`.

### 7. Abrir e acompanhar o PR

Envie o branch combinado com o ambiente e abra o PR como draft. A descrição fica em português, com as seções:

- **Resumo**;
- **O que muda para quem usa**;
- **Como está organizado**;
- **Pontos de atenção**: migração, decisões tomadas e o que ficou de fora;
- **Verificação**: comandos e resultados, mais os cenários vistos no navegador.

Acompanhe comentários e checks até o PR ficar pronto para merge. Se o ambiente for de teste ou a pessoa pedir só o commit, pare no commit.

## Ao terminar

Responda em português, sem jargão desnecessário. Comece pelo que a pessoa consegue fazer agora. Se alguma parte do objetivo ainda não funciona, diga isso nas primeiras linhas, não no fim. Depois:

- o que mudou para quem usa;
- onde estão o commit e o PR;
- os screenshots, enviados quando houver como mandar arquivos;
- as decisões que você tomou sozinho e o que deixou para depois;
- os bugs encontrados fora do pedido, cada um com como reproduzir.

Diga com franqueza o que não verificou.
