---
componente: copy-layer
camada: library
arquivo: src/components/library/shared/copy-layer.tsx
export: copylayer
---

# CopyLayer

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/shared/copy-layer.tsx`

## Export

`CopyLayer`

## Props

### `CopyLayer`

The notice and the copy-by-hand dialog; mounted once in the shell.

Sem props.

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

É o aviso de "copiado" e o diálogo de copiar à mão quando o navegador não deixa copiar sozinho. Já fica montado uma vez na raiz do app.

Não monte de novo: para copiar algo, chame a função de copiar do código compartilhado, que usa esta camada.

## Trecho de código

De `src/components/library/atelier.tsx`:

```tsx
<CopyLayer />
```

<<<FIM>>>
