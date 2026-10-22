---
componente: before-after-view
camada: library
arquivo: src/components/library/views/before-after-view.tsx
export: beforeafterview
---

# BeforeAfterView

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/views/before-after-view.tsx`

## Export

`BeforeAfterView`

## Props

### `BeforeAfterView`

Antes e depois (article 2165): the same item at the pane's current settings and at the shipped defaults, side by side. The reference column is not editable on purpose — it exists to be compared against, and every control in it would write to the pane's real settings.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `paneId` | `string` | sim |  |

## Telas onde aparece

- Painéis: `src/components/library/workspace/pane.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<BeforeAfterView paneId={paneId} />
```

<<<FIM>>>
