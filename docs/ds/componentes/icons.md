---
componente: icons
camada: library
arquivo: src/components/library/icons.tsx
export: glyph, setglyphs
---

# Icons

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/icons.tsx`

## Export

`Glyph`, `SetGlyphs`

## Props

### `Glyph`

One Iconify glyph, or a dashed placeholder when the set has no icon by that name.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `prefix` | `string` | sim |  |
| `name` | `string` | sim |  |
| `size` | `number` | sim |  |
| `color` | `string` | sim |  |

### `SetGlyphs`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `prefix` | `string` | sim |  |
| `names` | `string[]` | sim |  |
| `size` | `number` | sim |  |
| `color` | `string` | sim |  |

## Telas onde aparece

- Coleção: `src/components/library/browser/asset-card.tsx`
- Diálogo Adicionar: `src/components/library/import-dialog.tsx`
- Provas: `src/components/library/specimen/icon-specimen.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/browser/asset-card.tsx`:

```tsx
<Glyph prefix={asset.iconKey} name={name} size={preview.size} color={LIGHT_INK} />
```

<<<FIM>>>
