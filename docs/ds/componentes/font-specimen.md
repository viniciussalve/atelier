---
componente: font-specimen
camada: library
arquivo: src/components/library/specimen/font-specimen.tsx
export: fontproof, fontglyphs
---

# FontSpecimen

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/font-specimen.tsx`

## Export

`FontProof`, `FontGlyphs`

## Props

### `FontProof`

The proof sheet for a font. Sizes are in em of the pane's "Corpo", except the fixed-size rows.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `paneId` | `string` | sim |  |
| `settings` | `PaneSettings` | sim |  |
| `onSettings` | `(patch: Partial<PaneSettings>) => void` | sim |  |

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

As partes da prova de uma fonte: `FontProof` é a folha de prova com textos em vários corpos e `FontGlyphs` mostra o conjunto de caracteres em células. Cada uma é uma aba da prova da fonte; a aba Interface é o `FontInterface`.

Para a prova de um conjunto de ícones, use o `IconSpecimen`.

## Trecho de código

De `src/components/library/specimen/asset-tab.tsx`:

```tsx
<FontProof asset={asset} paneId={paneId} settings={settings} onSettings={onSettings} />
```

<<<FIM>>>
