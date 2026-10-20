---
componente: drop-overlay
camada: library
arquivo: src/components/library/workspace/drop-overlay.tsx
export: dropoverlay
---

# DropOverlay

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/workspace/drop-overlay.tsx`

## Export

`DropOverlay`

## Props

### `DropOverlay`

Covers a pane while something is dragged: the edges split the pane, the center opens the item there, the way VS Code drops editors.

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
<DropOverlay paneId={paneId} />
```

<<<FIM>>>
