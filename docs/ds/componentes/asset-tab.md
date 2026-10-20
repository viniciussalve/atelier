---
componente: asset-tab
camada: library
arquivo: src/components/library/specimen/asset-tab.tsx
export: assettab
---

# AssetTab

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/asset-tab.tsx`

## Export

`AssetTab`

## Props

### `AssetTab`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `paneId` | `string` | sim |  |
| `assetId` | `string` | sim |  |

## Telas onde aparece

- Painéis: `src/components/library/workspace/pane.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para o conteúdo de uma aba de item num painel: a prova da fonte ou do conjunto, com as abas de partes da prova e os controles de fundo e corpo. É o que aparece quando alguém abre um item.

Não use para listar vários itens: isso é a `Collection`.

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<AssetTab paneId={paneId} assetId={assetId} />
```

<<<FIM>>>
