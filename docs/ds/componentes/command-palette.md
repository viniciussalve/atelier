---
componente: command-palette
camada: library
arquivo: src/components/library/command-palette.tsx
export: commandpalette
---

# CommandPalette

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/command-palette.tsx`

## Export

`CommandPalette`

## Props

### `CommandPalette`

⌘K: jump to any item, folder or command. ⌘Enter opens an item beside the current pane.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `open` | `boolean` | sim |  |
| `onOpenChange` | `(open: boolean) => void` | sim |  |
| `onAddItems` | `() => void` | sim | Opens the add dialog; called a frame after the palette closes. |

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

É a paleta do ⌘K / Ctrl+K: abrir um item, uma pasta ou rodar um comando digitando o nome. Um comando novo do app entra na lista dela.

Não use para um menu de ações de um item ou painel: para isso há o `DropdownMenu`.

## Trecho de código

De `src/components/library/atelier.tsx`:

```tsx
<CommandPalette
  open={paletteOpen}
  onOpenChange={setPaletteOpen}
  onAddItems={() => setAdding({ mode: "search", kind: useLibrary.getState().kind })}
/>
```

<<<FIM>>>
