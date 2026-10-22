---
componente: segmented
camada: ui
arquivo: src/components/ui/segmented.tsx
export: segmented
---

# Segmented

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/segmented.tsx`

## Export

`Segmented`

## Props

### `Segmented`

A single-choice switch that never ends up empty.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `value` | `T` | sim |  |
| `onChange` | `(value: T) => void` | sim |  |
| `options` | `SegmentedOption<T>[]` | sim |  |
| `label` | `string` | sim |  |
| `className` | `string` | não |  |

## Telas onde aparece

- Coleção: `src/components/library/browser/collection.tsx`
- Diálogo Adicionar: `src/components/library/import-dialog.tsx`
- Barra lateral: `src/components/library/sidebar/sidebar.tsx`
- Outro: `src/components/library/views/design-system-view.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para alternar entre poucas opções exclusivas, sempre visíveis numa barra, como grade ou lista, ou Fontes e Ícones. Uma opção fica sempre escolhida; aceita rótulo em texto ou ícone (com `title`) e contagem.

Para navegar entre conteúdos de um mesmo painel, use as `Tabs`. Para muitas opções, use o `DropdownMenu`.

## Trecho de código

De `src/components/library/browser/collection.tsx`:

```tsx
<Segmented<Display>
  label="Exibição"
  value={nav.display}
  onChange={(display) => setDisplay(kind, display)}
  className="w-20"
  options={[
    { value: "grid", label: <Grid2x2 className="size-4" />, title: "Grade" },
    { value: "list", label: <List className="size-4" />, title: "Lista" },
  ]}
/>
```

<<<FIM>>>
