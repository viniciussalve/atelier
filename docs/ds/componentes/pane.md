---
componente: pane
camada: library
arquivo: src/components/library/workspace/pane.tsx
export: paneview
---

# Pane

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/workspace/pane.tsx`

## Export

`PaneView`

## Props

### `PaneView`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `paneId` | `string` | sim |  |
| `onOpenNav` | `() => void` | sim |  |

## Telas onde aparece

- Painéis: `src/components/library/workspace/workspace.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/workspace/workspace.tsx`:

```tsx
<PaneView paneId={activePaneId} onOpenNav={onOpenNav} />
```

<<<FIM>>>
