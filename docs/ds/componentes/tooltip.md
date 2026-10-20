---
componente: tooltip
camada: ui
arquivo: src/components/ui/tooltip.tsx
export: tooltip, tooltipprovider
---

# Tooltip

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/tooltip.tsx`

## Export

`Tooltip`, `TooltipProvider`

## Props

### `Tooltip`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `content` | `ReactNode` | sim |  |
| `shortcut` | `string` | não |  |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | não |  |
| `children` | `ReactNode` | sim |  |

### `TooltipProvider`

Também aceita as props herdadas: 4 de `@radix-ui/react-tooltip`.

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`
- Coleção: `src/components/library/browser/collection.tsx`
- Avaliação: `src/components/library/evaluation/score-control.tsx`
- Base (ui): `src/components/ui/icon-button.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/browser/collection.tsx`:

```tsx
<Tooltip content="Recentes sempre mostra o último aberto primeiro">
  <span className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-sm text-subtle">
    <ArrowUpDown className="size-3.5" />
    {label}
  </span>
</Tooltip>
```

<<<FIM>>>
