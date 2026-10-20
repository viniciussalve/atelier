---
componente: inspector
camada: library
arquivo: src/components/library/inspector/inspector.tsx
export: inspector
---

# Inspector

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/inspector/inspector.tsx`

## Export

`Inspector`

## Props

### `Inspector`

The evaluation and details of the item in the active pane. A column on wide screens, a modal drawer on narrow ones; hidden while the collection is in front.

Sem props.

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

É a coluna do inspetor: a avaliação e os detalhes do item do painel ativo. Em telas largas é uma coluna; em telas estreitas, uma gaveta. Começa fechado e abre pelo botão "Avaliar".

Não use para mostrar avaliação dentro de um card ou de uma linha: para isso há os `badges`.

## Trecho de código

De `src/components/library/atelier.tsx`:

```tsx
<Inspector />
```

<<<FIM>>>
