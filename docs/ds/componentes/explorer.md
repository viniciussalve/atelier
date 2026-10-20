---
componente: explorer
camada: library
arquivo: src/components/library/sidebar/explorer.tsx
export: explorer
---

# Explorer

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/sidebar/explorer.tsx`

## Export

`Explorer`

## Props

### `Explorer`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `nodes` | `ExplorerNode[]` | sim |  |
| `kind` | `Kind` | sim |  |
| `forceOpen` | `boolean` | sim | Show every branch open, e.g. while searching. |
| `draft` | `Draft \| null` | sim |  |
| `onDraft` | `(draft: Draft \| null) => void` | sim |  |
| `onNavigate` | `() => void` | sim |  |

## Telas onde aparece

- Barra lateral: `src/components/library/sidebar/sidebar.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/sidebar/sidebar.tsx`:

```tsx
<Explorer
  nodes={shown}
  kind={kind}
  forceOpen={searching}
  draft={draft}
  onDraft={setDraft}
  onNavigate={onNavigate}
/>
```

<<<FIM>>>
