# Roteiro ALL-96 — testar o plugin de GitHub (≈15 min, na sua máquina)

O que já se sabe (Marketplace / README do plugin `langgenius/github_datasource` 0.4.8, mín. Dify 1.9.0): lê repo privado; o README pede **PAT clássico com escopo `repo`** (amplo). Ressincronização automática no push: **não confirmada**.

Só use uma base nova de teste. Não mexe em nada que exista.

## Preparar

1. No GitHub, crie um PAT clássico com `repo`, validade curta (7 dias). Ele fica só no seu Dify; não mande pra ninguém.
2. Garanta que existe pelo menos 1 arquivo em `docs/ds/` no atelier (pode ser um `teste.md` qualquer) e algum arquivo fora dessa pasta.

## Passos

1. Plugins → Marketplace → instale "GitHub" (datasource, autor langgenius). **Print 1:** tela de detalhes com a versão.
2. Knowledge → criar base pelo **Knowledge Pipeline** (em branco). Adicione o data source do GitHub e autorize com o PAT. **Print 2:** os campos que o nó de data source mostra (é aqui que se vê se dá pra escolher pasta/caminho).
3. Selecione o repo `viniciussalve/atelier`. Tente escolher só `docs/ds/`. **Print 3:** a lista de arquivos que ele oferece.
4. Monte o resto do pipeline com o mínimo: extractor padrão → chunker Geral → nó Knowledge Base (Alta Qualidade). Nas configurações do nó, procure onde definir metadados. **Print 4.**
5. Rode o teste do pipeline e publique. Abra a aba Documents. **Print 5:** quais arquivos entraram.
6. Abra um documento e veja se tem metadados preenchidos. **Print 6.**
7. Faça um commit pequeno no `teste.md` e espere 5 min. Veja se o documento mudou sozinho na base. **Print 7.**

## O que eu concluo de cada print

| Pergunta                         | Onde se vê     | Se SIM       | Se NÃO                                                            |
| -------------------------------- | -------------- | ------------ | ----------------------------------------------------------------- |
| Limita a `docs/ds/`?             | Prints 2, 3, 5 | Plugin segue | Plano B (API)                                                     |
| Atribui metadados por documento? | Prints 4, 6    | Plugin segue | Plugin + `Update Document Metadata in Batch` pela API, ou plano B |
| Ressincroniza no push?           | Print 7        | Nada a fazer | CI chama `Run Pipeline` depois do push                            |

Depois do teste: apague a base de teste se quiser e revogue o PAT se formos pelo plano B.
