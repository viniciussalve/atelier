---
componente: import-dialog
camada: library
arquivo: src/components/library/import-dialog.tsx
export: importdialog
---

# ImportDialog

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/import-dialog.tsx`

## Export

`ImportDialog`

## Props

### `ImportDialog`

Adds fonts and icon sets from the catalogs. From a link it lists the suggested items, already chosen; from the add command it searches the catalog. Nothing is added until the person confirms.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `request` | `ImportRequest \| null` | sim |  |
| `onClose` | `() => void` | sim |  |

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/atelier.tsx`:

```tsx
<ImportDialog request={adding} onClose={() => setAdding(null)} />
```

<<<FIM>>>
