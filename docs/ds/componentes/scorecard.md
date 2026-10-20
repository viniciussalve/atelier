---
componente: scorecard
camada: library
arquivo: src/components/library/evaluation/scorecard.tsx
export: scorecard
---

# Scorecard

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/evaluation/scorecard.tsx`

## Export

`Scorecard`

## Props

### `Scorecard`

The overall score, a read-only line per criterion and the verdict. Criteria are scored in the specimen sections, next to what they judge, not here.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |

## Telas onde aparece

- Inspetor: `src/components/library/inspector/inspector.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para o resumo da avaliação no inspetor: a nota geral, uma linha só de leitura por critério e o veredito. Os critérios recebem nota na prova, não aqui.

Para dar nota a um critério, use o `ScoreControl` na seção da prova.

## Trecho de código

De `src/components/library/inspector/inspector.tsx`:

```tsx
<Scorecard key={`placar-${asset.id}`} asset={asset} />
```

<<<FIM>>>
