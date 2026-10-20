---
componente: dialog
camada: ui
arquivo: src/components/ui/dialog.tsx
export: modal, dialogclose
---

# Dialog

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/dialog.tsx`

## Export

`Modal`, `DialogClose`

## Props

### `Modal`

A centered modal: focus stays inside, the page behind is hidden from assistive tech, and Escape or a click outside closes it. `footer` stays visible while the body scrolls. On close, focus goes back to what had it when the modal opened.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `open` | `boolean` | sim |  |
| `onOpenChange` | `(open: boolean) => void` | sim |  |
| `title` | `string` | sim |  |
| `description` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| I…` | não |  |
| `children` | `ReactNode` | sim |  |
| `footer` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| I…` | não |  |
| `className` | `string` | não |  |
| `fallbackFocus` | `() => HTMLElement \| null` | não | Takes focus on close when what opened the modal left the page or was the body. |
| `onCloseAutoFocus` | `(event: Event) => void` | não | Runs first on close; `event.preventDefault()` there to place focus yourself. |

### `DialogClose`

Também aceita as props herdadas: 290 de `react`, 1 de `@radix-ui/react-primitive`.

## Telas onde aparece

- Diálogo Adicionar: `src/components/library/import-dialog.tsx`
- Compartilhado: `src/components/library/shared/copy-layer.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

`Modal` é o diálogo centralizado para uma tarefa que interrompe a tela, como adicionar fontes ou ver um texto para copiar: o foco fica dentro, Escape ou um clique fora fecha, e o rodapé fica visível enquanto o corpo rola. `DialogClose` é o botão que fecha.

Para só confirmar uma ação perigosa, use o `ConfirmDialog`. Para algo pequeno preso a um botão, use o `Popover`.

## Trecho de código

De `src/components/library/shared/copy-layer.tsx`:

```tsx
<Modal
  open
  onOpenChange={(open) => !open && updateCopy({ fallback: null })}
  title={fallback.title}
  description="O navegador não deixou copiar sozinho. O texto já está selecionado: copie com Ctrl+C (⌘C no Mac)."
  footer={
    <DialogClose className="h-9 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg">
      Fechar
    </DialogClose>
  }
>
  {/* … */}
</Modal>
```

<<<FIM>>>
