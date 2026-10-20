---
componente: face-icon
camada: ui
arquivo: src/components/ui/face-icon.tsx
export: faceicon
---

# FaceIcon

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/face-icon.tsx`

## Export

`FaceIcon`

## Props

### `FaceIcon`

One face of the carinhas set, filled: a disc in `currentColor` with the features cut out by a mask, so the ground shows through. Always decorative: the control or text around it carries the name ("Bom").

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `level` | `Score` | sim |  |
| `size` | `number` | não |  |
| `strokeWidth` | `number` | não | Width of the cut-out features, in grid units; 2 matches the lucide icons. |

Também aceita as props herdadas: 487 de `react`.

## Telas onde aparece

- Coleção: `src/components/library/browser/filter-bar.tsx`
- Avaliação: `src/components/library/evaluation/badges.tsx`
- Avaliação: `src/components/library/evaluation/score-control.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para desenhar uma carinha da escala de nota (de Muito ruim a Ótimo) como ícone. É sempre decorativa: o texto ou o controle em volta diz o nome ("Bom").

Para mostrar a nota de um item, use o `ScoreBadge` ou o `ScoreFace`. Para dar nota, use o `ScoreControl`.

## Trecho de código

De `src/components/library/browser/filter-bar.tsx`:

```tsx
<FaceIcon level={entry.value} className="text-proof" />
```

<<<FIM>>>
