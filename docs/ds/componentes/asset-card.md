---
componente: asset-card
camada: library
arquivo: src/components/library/browser/asset-card.tsx
export: assetcard, assetrow
---

# AssetCard

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/browser/asset-card.tsx`

## Export

`AssetCard`, `AssetRow`

## Props

### `AssetCard`

A collection card: name and facts on top, then the item drawn large with the shared preview.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `preview` | `CollectionPreview` | sim |  |
| `selected` | `boolean` | sim |  |
| `selecting` | `boolean` | sim | Something is selected, so every checkbox shows. |
| `onSelect` | `() => void` | sim |  |
| `handlers` | `CardHandlers` | sim |  |

### `AssetRow`

A collection row: one line of facts, then one line of specimen that fades at the edge.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `preview` | `CollectionPreview` | sim |  |
| `selected` | `boolean` | sim |  |
| `selecting` | `boolean` | sim | Something is selected, so every checkbox shows. |
| `onSelect` | `() => void` | sim |  |
| `handlers` | `CardHandlers` | sim |  |

## Telas onde aparece

- Coleção: `src/components/library/browser/collection.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/browser/collection.tsx`:

```tsx
<AssetCard
  key={item.id}
  asset={item}
  preview={nav.preview}
  selected={selected.has(item.id)}
  selecting={selected.size > 0}
  onSelect={() => toggle(item.id)}
  handlers={handlersFor(item)}
/>
```

<<<FIM>>>
