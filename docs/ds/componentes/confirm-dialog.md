---
componente: confirm-dialog
camada: ui
arquivo: src/components/ui/confirm-dialog.tsx
export: confirmdialog
---

# ConfirmDialog

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/confirm-dialog.tsx`

## Export

`ConfirmDialog`

## Props

### `ConfirmDialog`

Asks before something that cannot be undone.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `open` | `boolean` | sim |  |
| `onOpenChange` | `(open: boolean) => void` | sim |  |
| `title` | `string` | sim |  |
| `description` | `ReactNode` | sim |  |
| `confirmLabel` | `string` | sim |  |
| `onConfirm` | `() => void` | sim |  |

## Telas onde aparece

- Barra lateral: `src/components/library/sidebar/folder-actions.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/sidebar/folder-actions.tsx`:

```tsx
<ConfirmDialog
  open={confirming}
  onOpenChange={setConfirming}
  title={`Excluir “${folder.name}”?`}
  description={consequence || "A pasta está vazia."}
  confirmLabel="Excluir pasta"
  onConfirm={() => deleteFolder(folder.id)}
/>
```

<<<FIM>>>
