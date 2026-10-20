---
componente: dropdown-menu
camada: ui
arquivo: src/components/ui/dropdown-menu.tsx
export: dropdownmenu, dropdownmenucontent, dropdownmenuitem, dropdownmenucheckboxitem, dropdownmenuradioitem, dropdownmenulabel, dropdownmenuseparator, dropdownmenusubtrigger, dropdownmenusubcontent, dropdownmenutrigger, dropdownmenusub, dropdownmenuradiogroup
---

# DropdownMenu

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/dropdown-menu.tsx`

## Export

`DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuTrigger`, `DropdownMenuSub`, `DropdownMenuRadioGroup`

## Props

### `DropdownMenu`

Também aceita as props herdadas: 6 de `@radix-ui/react-dropdown-menu`.

### `DropdownMenuContent`

Também aceita as props herdadas: 278 de `react`, 11 de `@radix-ui/react-popper`, 7 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuItem`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `tone` | `"danger"` | não |  |

Também aceita as props herdadas: 278 de `react`, 3 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuCheckboxItem`

Também aceita as props herdadas: 278 de `react`, 5 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuRadioItem`

Também aceita as props herdadas: 278 de `react`, 4 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuLabel`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` | sim |  |

### `DropdownMenuSeparator`

Sem props.

### `DropdownMenuSubTrigger`

Também aceita as props herdadas: 279 de `react`, 2 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuSubContent`

Também aceita as props herdadas: 278 de `react`, 9 de `@radix-ui/react-popper`, 7 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuTrigger`

Também aceita as props herdadas: 290 de `react`, 1 de `@radix-ui/react-primitive`.

### `DropdownMenuSub`

Também aceita as props herdadas: 4 de `@radix-ui/react-dropdown-menu`.

### `DropdownMenuRadioGroup`

Também aceita as props herdadas: 280 de `react`, 2 de `@radix-ui/react-menu`, 1 de `@radix-ui/react-primitive`.

## Telas onde aparece

- Coleção: `src/components/library/browser/collection.tsx`
- Barra lateral: `src/components/library/sidebar/folder-actions.tsx`
- Painéis: `src/components/library/workspace/pane.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger className="h-7 rounded-md px-2 text-xs text-muted tabular-nums hover:bg-elevated hover:text-fg">
    Painel {index + 1} de {panes.length}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuRadioGroup value={activePaneId} onValueChange={focus}>
      {panes.map((pane, position) => (
        <PaneOption key={pane.id} id={pane.id} tab={pane.active} position={position} />
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

<<<FIM>>>
