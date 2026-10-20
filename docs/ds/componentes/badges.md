---
componente: badges
camada: library
arquivo: src/components/library/evaluation/badges.tsx
export: verdictdot, verdictbadge, scoreface, scorebadge, statustext
---

# Badges

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/evaluation/badges.tsx`

## Export

`VerdictDot`, `VerdictBadge`, `ScoreFace`, `ScoreBadge`, `StatusText`

## Props

### `VerdictDot`

Colored dot for a verdict. Decorative: name the control with `withVerdict`.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `verdict` | `Verdict` | sim |  |
| `className` | `string` | não |  |

### `VerdictBadge`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `verdict` | `Verdict` | sim |  |
| `className` | `string` | não |  |

### `ScoreFace`

The face of a rounded mean or score, in the proof blue.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `value` | `number \| null` | sim |  |
| `size` | `number` | não |  |
| `className` | `string` | não |  |

### `ScoreBadge`

The face of the weighted score with its word ("Bom"), or a quiet "Sem nota". `compact` drops the word where room is short; the name stays for assistive tech.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `compact` | `boolean` | não |  |
| `className` | `string` | não |  |

### `StatusText`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `className` | `string` | não |  |

## Telas onde aparece

- Coleção: `src/components/library/browser/asset-card.tsx`
- Paleta ⌘K: `src/components/library/command-palette.tsx`
- Avaliação: `src/components/library/evaluation/scorecard.tsx`
- Barra lateral: `src/components/library/sidebar/explorer.tsx`
- Provas: `src/components/library/specimen/asset-tab.tsx`
- Painéis: `src/components/library/workspace/tab-strip.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/command-palette.tsx`:

```tsx
<VerdictDot verdict={asset.verdict} />
```

<<<FIM>>>
