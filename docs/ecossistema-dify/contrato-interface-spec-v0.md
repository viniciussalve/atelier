# Contrato v0 da InterfaceSpec (ALL-91)

**Status: aprovado** pelo Vinicius em 20/10/2026, com as três propostas novas abaixo.

O v0 está congelado. Qualquer mudança no schema vira `interface-spec.v1.schema.json`, com `versao: "1"`, e o v0 fica como está até nenhum fluxo usá-lo. Um teste do `npm test` falha se o arquivo do v0 mudar.

O schema único é `docs/ds/interface-spec.v0.schema.json`. Nenhum outro lugar copia o schema: o DSL do fluxo piloto (ALL-93) injeta este arquivo, e a skill do Cursor aponta pra ele.

## Start (entradas do fluxo)

| Variável | Tipo      | Obrigatória | O que é                                                 |
| -------- | --------- | ----------- | ------------------------------------------------------- |
| `pedido` | parágrafo | sim         | O pedido de tela, em português, como a pessoa escreveu. |

`flow_version` e `prompt_version` não são entradas: vêm de variáveis de ambiente do app e o fluxo as copia para `meta`. O LLM nunca escreve esses dois campos.

## End (saída do fluxo)

| Variável | Tipo   | O que é                            |
| -------- | ------ | ---------------------------------- |
| `spec`   | objeto | A InterfaceSpec, válida no schema. |

## Campos

| Campo           | O que guarda                                                                | Combinado na sala                                |
| --------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| `versao`        | Sempre `"0"` nesta versão.                                                  | —                                                |
| `pedido`        | O pedido como chegou. Deixa a spec legível sozinha.                         | —                                                |
| `tela`          | `nome` e `resumo` (o que a pessoa consegue fazer na tela).                  | —                                                |
| `tokens[]`      | `nome` exato, `uso` e `fonte` (documento recuperado).                       | Nome exato da fonte de tokens; `fonte` por token |
| `componentes[]` | `nome` (metadado `componente`), `export` (como no código), `uso` e `fonte`. | `fonte` por componente                           |
| `fluxo[]`       | Passos com `rota`, `acao`, `alvo` e `valor` opcional.                       | Lista de passos com `rota`, `acao` e `alvo`      |
| `lacunas[]`     | O que o pedido precisa e o atelier não tem (`falta`, `motivo`).             | —                                                |
| `meta`          | `flow_version`, `prompt_version`, `tentativas`, `tokens_rejeitados`.        | Os quatro campos                                 |

### O que entrou além do combinado na sala

- **`lacunas`.** O caso T21 (gráfico de pizza) pede que a spec diga o que falta em vez de inventar um componente. Sem um campo pra isso, o LLM tende a preencher `componentes` com algo que não existe.
- **`acao` como lista fechada:** `abrir`, `clicar`, `digitar`, `arrastar`, `pressionar`, `ver`. Fechada, o Proto Bot sabe reproduzir cada passo; aberta, cada spec inventaria um verbo.
- **`componentes[].nome` e `export` separados.** Uma página de `docs/ds/componentes` pode ter vários exports (`dropdown-menu` tem 12). O `nome` acha a página; o `export` diz qual peça usar.

## Exemplos

Em `docs/ds/exemplos/`, validados pelo `npm test`:

- `t19-comparar-fontes.json`: pedido do caso T19, spec válida.
- `t20-buscar-icones.json`: pedido do caso T20, spec válida.
- `t21-grafico-de-pizza.json`: caso T21, sem componente de gráfico; a falta vai em `lacunas`.

## Validação

`npm run ds:validar -- <spec.json>` confere o schema, os tokens, os componentes, as fontes e as rotas. A mesma função vai no nó Code do app `validar-spec` (ALL-104); veja `scripts/ds/validar-spec.mjs`.
