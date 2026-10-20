---
componente: atelier
camada: library
arquivo: src/components/library/atelier.tsx
export: atelier
---

# Atelier

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/atelier.tsx`

## Export

`Atelier`

## Props

### `Atelier`

The app shell: library sidebar, the workspace of panes, and the inspector. Both stores live in localStorage, so nothing renders until they are read; the server and the first client paint show the same empty frame.

Sem props.

## Telas onde aparece

- Rota /: `src/routes/index.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

É a tela inteira do app: barra lateral, painéis e inspetor, montada uma vez na rota `/`. Só faz sentido como raiz.

Não use dentro de outro componente nem para uma tela nova: monte a tela nova com as peças (`Sidebar`, `Workspace`, `Inspector`).

## Trecho de código

De `src/routes/index.tsx`:

```tsx
<Atelier />
```

<<<FIM>>>
