---
componente: design-system-view
camada: library
arquivo: src/components/library/views/design-system-view.tsx
export: designsystemview
---

# DesignSystemView

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/views/design-system-view.tsx`

## Export

`DesignSystemView`

## Props

### `DesignSystemView`

The live design system (article 2164), as pane content and as a page. One component, two hosts: `/design-system` and the `vista:sistema` tab. If the pane rendered its own copy of the token list, the route could drift from it and the agent would read a view that is no longer what the app uses.

Sem props.

## Telas onde aparece

- Painéis: `src/components/library/workspace/pane.tsx`
- Rota /design-system: `src/routes/design-system.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<DesignSystemView />
```

<<<FIM>>>
