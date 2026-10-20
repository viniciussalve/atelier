---
componente: icon-specimen
camada: library
arquivo: src/components/library/specimen/icon-specimen.tsx
export: iconspecimen
---

# IconSpecimen

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/icon-specimen.tsx`

## Export

`IconSpecimen`

## Props

### `IconSpecimen`

An icon set's proof, one tab at a time: samples, sizes, or the set in use.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `paneId` | `string` | sim |  |
| `settings` | `PaneSettings` | sim |  |
| `tab` | `IconSpecimenTab` | sim |  |

## Telas onde aparece

- Provas: `src/components/library/specimen/asset-tab.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

A prova de um conjunto de ícones, uma aba por vez: amostras (aceita nomes novos e mostra tracejado o que o conjunto não tem), tamanhos e o conjunto em componentes.

Para a prova de uma fonte, use as partes de `font-specimen`.

## Trecho de código

De `src/components/library/specimen/asset-tab.tsx`:

```tsx
<IconSpecimen
  asset={asset}
  paneId={paneId}
  settings={settings}
  tab={tab as IconSpecimenTab}
/>
```

<<<FIM>>>
