---
componente: collection
camada: library
arquivo: src/components/library/browser/collection.tsx
export: collection
---

# Collection

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/browser/collection.tsx`

## Export

`Collection`

## Props

### `Collection`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `paneId` | `string` | sim |  |

## Telas onde aparece

- Painéis: `src/components/library/workspace/pane.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para a grade ou lista de itens da vista atual, com busca, filtros, ordenação, "Escreva para testar" e seleção para comparar lado a lado. É a aba Coleção de um painel.

Não use para um item só: para isso há a `AssetTab`.

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<Collection paneId={paneId} />
```

<<<FIM>>>
