---
componente: workspace
camada: library
arquivo: src/components/library/workspace/workspace.tsx
export: workspace
---

# Workspace

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/workspace/workspace.tsx`

## Export

`Workspace`

## Props

### `Workspace`

The panes, laid out by the split tree. On narrow screens only the active pane shows.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `onOpenNav` | `() => void` | sim |  |

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

É o espaço de trabalho com os painéis, montado pela árvore de divisões: dividir à direita ou abaixo, arrastar as divisórias e igualar com clique duplo. Em telas estreitas mostra só o painel ativo.

Não monte de novo: ele já fica na raiz do app.

## Trecho de código

De `src/components/library/atelier.tsx`:

```tsx
<Workspace onOpenNav={() => setNavOpen(true)} />
```

<<<FIM>>>
