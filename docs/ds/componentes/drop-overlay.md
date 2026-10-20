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

É a camada que cobre um painel enquanto alguém arrasta um item ou uma aba: as bordas dividem o painel e o centro abre ali, como no VS Code. Só faz sentido dentro do painel.

Não use para arrastar e soltar em outros lugares, como as pastas da barra lateral.

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<DropOverlay paneId={paneId} />
```

<<<FIM>>>
