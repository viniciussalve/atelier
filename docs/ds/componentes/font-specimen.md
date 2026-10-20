---
componente: font-specimen
camada: library
arquivo: src/components/library/specimen/font-specimen.tsx
export: fontproof, fontweights, fontglyphs
---

# FontSpecimen

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/font-specimen.tsx`

## Export

`FontProof`, `FontWeights`, `FontGlyphs`

## Props

### `FontProof`

The proof sheet for a font. Sizes are in em of the pane's "Corpo", except the fixed-size rows.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `paneId` | `string` | sim |  |
| `settings` | `PaneSettings` | sim |  |
| `onSettings` | `(patch: Partial<PaneSettings>) => void` | sim |  |

### `FontWeights`

Every declared weight, one line each, at 1.5em of the pane's "Corpo".

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `settings` | `PaneSettings` | sim |  |

### `FontGlyphs`

The character set, grouped, in cells big enough to judge each glyph.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `settings` | `PaneSettings` | sim |  |

## Telas onde aparece

- Provas: `src/components/library/specimen/asset-tab.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/specimen/asset-tab.tsx`:

```tsx
<FontProof asset={asset} paneId={paneId} settings={settings} onSettings={onSettings} />
```

<<<FIM>>>
