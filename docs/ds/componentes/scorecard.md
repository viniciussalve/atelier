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

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/inspector/inspector.tsx`:

```tsx
<Scorecard key={`placar-${asset.id}`} asset={asset} />
```

<<<FIM>>>
