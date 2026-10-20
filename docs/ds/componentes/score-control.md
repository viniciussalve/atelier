---
componente: score-control
camada: library
arquivo: src/components/library/evaluation/score-control.tsx
export: scorecontrol
---

# ScoreControl

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/evaluation/score-control.tsx`

## Export

`ScoreControl`

## Props

### `ScoreControl`

A 1–5 score for one criterion, as five faces from Muito ruim to Ótimo. Clicking the current face clears it; arrow keys move between faces. Only the chosen face lights up, with a ring, so the state never rests on color alone. It sits in a specimen section header, drawn like a proof mark in the margin, so the criterion is judged while looking at what it is about.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `criterion` | `CriterionDef` | sim |  |
| `entry` | `CriterionScore \| undefined` | sim |  |
| `onScore` | `(value: Score \| null) => void` | sim |  |
| `onNote` | `(note: string) => void` | sim |  |
| `onPaper` | `boolean` | não |  |

## Telas onde aparece

- Provas: `src/components/library/specimen/section.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/specimen/section.tsx`:

```tsx
<ScoreControl
  key={criterion.id}
  onPaper={onPaper}
  criterion={criterion}
  entry={asset.criteria[criterion.id]}
  onScore={(value) => score(paneId, asset.id, criterion.id, value)}
  onNote={(note) => setCriterionNote(asset.id, criterion.id, note)}
/>
```

<<<FIM>>>
