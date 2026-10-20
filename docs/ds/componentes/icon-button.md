---
componente: icon-button
camada: ui
arquivo: src/components/ui/icon-button.tsx
export: iconbutton
---

# IconButton

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/icon-button.tsx`

## Export

`IconButton`

## Props

### `IconButton`

A square icon button whose label shows as a tooltip and names it for screen readers.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `label` | `string` | sim |  |
| `shortcut` | `string` | não |  |
| `active` | `boolean` | não |  |
| `size` | `"sm" \| "md"` | não |  |

Também aceita as props herdadas: 290 de `react`.

## Telas onde aparece

- Inspetor: `src/components/library/inspector/inspector.tsx`
- Barra lateral: `src/components/library/sidebar/sidebar.tsx`
- Provas: `src/components/library/specimen/asset-tab.tsx`
- Painéis: `src/components/library/workspace/pane.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para um botão quadrado só com ícone, como fechar, dividir ou abrir o menu de um painel. O rótulo aparece como dica ao passar o mouse e dá o nome para leitores de tela, então ele é obrigatório.

Se o botão tem texto visível, use um botão comum. Para só mostrar uma dica num elemento que não é botão, use o `Tooltip`.

## Trecho de código

De `src/components/library/inspector/inspector.tsx`:

```tsx
<IconButton label="Fechar o inspetor" size="sm" onClick={onClose}>
  <PanelRightClose className="size-4" />
</IconButton>
```

<<<FIM>>>
