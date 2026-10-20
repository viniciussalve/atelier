---
componente: controls
camada: library
arquivo: src/components/library/specimen/controls.tsx
export: groundpicker, sizeslider
---

# Controls

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/controls.tsx`

## Export

`GroundPicker`, `SizeSlider`

## Props

### `GroundPicker`

Radix radio group: one Tab stop, the arrows move and choose.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `value` | `PreviewGround` | sim |  |
| `onChange` | `(value: PreviewGround) => void` | sim |  |

### `SizeSlider`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `label` | `string` | sim |  |
| `value` | `number` | sim |  |
| `min` | `number` | sim |  |
| `max` | `number` | sim |  |
| `step` | `number` | não |  |
| `onChange` | `(value: number) => void` | sim |  |

## Telas onde aparece

- Coleção: `src/components/library/browser/collection.tsx`
- Provas: `src/components/library/specimen/asset-tab.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/specimen/asset-tab.tsx`:

```tsx
<GroundPicker value={settings.ground} onChange={(next) => onSettings({ ground: next })} />
```

<<<FIM>>>
