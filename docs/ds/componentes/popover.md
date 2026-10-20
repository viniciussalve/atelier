---
componente: popover
camada: ui
arquivo: src/components/ui/popover.tsx
export: popover, popovercontent, popovertrigger, popoveranchor, popoverclose
---

# Popover

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/popover.tsx`

## Export

`Popover`, `PopoverContent`, `PopoverTrigger`, `PopoverAnchor`, `PopoverClose`

## Props

### `Popover`

Também aceita as props herdadas: 5 de `@radix-ui/react-popover`.

### `PopoverContent`

Também aceita as props herdadas: 279 de `react`, 11 de `@radix-ui/react-popper`, 5 de `@radix-ui/react-dismissable-layer`, 3 de `@radix-ui/react-popover`, 1 de `@radix-ui/react-primitive`.

### `PopoverTrigger`

Também aceita as props herdadas: 290 de `react`, 1 de `@radix-ui/react-primitive`.

### `PopoverAnchor`

Também aceita as props herdadas: 280 de `react`, 1 de `@radix-ui/react-primitive`, 1 de `@radix-ui/react-popper`.

### `PopoverClose`

Também aceita as props herdadas: 290 de `react`, 1 de `@radix-ui/react-primitive`.

## Telas onde aparece

- Coleção: `src/components/library/browser/filter-bar.tsx`
- Avaliação: `src/components/library/evaluation/score-control.tsx`
- Inspetor: `src/components/library/inspector/details.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para um conteúdo pequeno que abre preso a um botão e fecha ao clicar fora: a nota escrita de um critério, a lista de filtros, editar um campo dos detalhes. `PopoverContent` é a caixa; `PopoverTrigger`, `PopoverAnchor` e `PopoverClose` são as partes do Radix.

Para uma lista de ações, use o `DropdownMenu`. Para uma tarefa que interrompe a tela, use o `Modal`.

## Trecho de código

De `src/components/library/evaluation/score-control.tsx`:

```tsx
<Popover>
  <PopoverTrigger
    aria-label={note ? `Nota sobre ${criterion.label}: ${note}` : `Anotar ${criterion.label}`}
    className="relative grid size-6 place-items-center rounded-[5px] hover:bg-current/10"
  >
    <PenLine className="size-3.5" />
    {note ? (
      <span
        aria-hidden
        className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-current"
      />
    ) : null}
  </PopoverTrigger>
  {/* … */}
</Popover>
```

<<<FIM>>>
