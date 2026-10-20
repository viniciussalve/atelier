---
componente: tab-strip
camada: library
arquivo: src/components/library/workspace/tab-strip.tsx
export: tabstrip
---

# TabStrip

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/workspace/tab-strip.tsx`

## Export

`TabStrip`

## Props

### `TabStrip`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `pane` | `Pane` | sim |  |
| `focused` | `boolean` | sim |  |

## Telas onde aparece

- Painéis: `src/components/library/workspace/pane.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

É a faixa de abas de um painel: clicar abre, clique duplo fixa a prévia, arrastar reordena ou leva a aba para outro painel, e as setas, Home e End movem entre abas. Só faz sentido dentro do painel.

Para abas de conteúdo dentro de uma aba (as partes da prova), use as `Tabs`.

## Trecho de código

De `src/components/library/workspace/pane.tsx`:

```tsx
<TabStrip pane={pane} focused={focused} />
```

<<<FIM>>>
