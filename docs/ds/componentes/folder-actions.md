---
componente: folder-actions
camada: library
arquivo: src/components/library/sidebar/folder-actions.tsx
export: folderactions, itemactions
---

# FolderActions

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/sidebar/folder-actions.tsx`

## Export

`FolderActions`, `ItemActions`

## Props

### `FolderActions`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `folder` | `Folder` | sim |  |
| `onNewSubfolder` | `() => void` | sim |  |
| `onRename` | `() => void` | sim |  |

### `ItemActions`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `name` | `string` | sim |  |
| `folderName` | `string \| null` | sim |  |
| `canSplit` | `boolean` | sim |  |
| `onOpen` | `() => void` | sim |  |
| `onOpenToSide` | `() => void` | sim |  |
| `onRemoveFromFolder` | `() => void` | sim |  |

## Telas onde aparece

- Barra lateral: `src/components/library/sidebar/explorer.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/sidebar/explorer.tsx`:

```tsx
<FolderActions
  folder={folder}
  onNewSubfolder={() => {
    setExpanded(folder.id, true);
    onDraft({ mode: "create", parentId: folder.id });
  }}
  onRename={() => onDraft({ mode: "rename", folderId: folder.id })}
/>
```

<<<FIM>>>
