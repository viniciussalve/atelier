---
componente: filter-bar
camada: library
arquivo: src/components/library/browser/filter-bar.tsx
export: filterbutton, activefilters
---

# FilterBar

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/browser/filter-bar.tsx`

## Export

`FilterButton`, `ActiveFilters`

## Props

### `FilterButton`

One button for every facet, so filtering takes no room until it is used.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `kind` | `Kind` | sim |  |

### `ActiveFilters`

The filters applied, as chips, and a way to clear them; nothing when none is.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `kind` | `Kind` | sim |  |

## Telas onde aparece

- Coleção: `src/components/library/browser/collection.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para filtrar a coleção. `FilterButton` é o botão "Filtros" que abre todas as facetas (veredito, status, nota mínima, tags, licença, estilo, formato) com a contagem de cada opção; `ActiveFilters` mostra os filtros aplicados como chips com X e o "Limpar filtros".

Uma faceta nova entra aqui, não como um controle solto na barra da coleção.

## Trecho de código

De `src/components/library/browser/collection.tsx`:

```tsx
<FilterButton kind={kind} />
```

<<<FIM>>>
