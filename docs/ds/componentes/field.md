---
componente: field
camada: library
arquivo: src/components/library/shared/field.tsx
export: field, property
---

# Field

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/shared/field.tsx`

## Export

`Field`, `Property`

## Props

### `Field`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `label` | `string` | sim |  |
| `children` | `ReactNode` | sim |  |

### `Property`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `label` | `string` | sim |  |
| `children` | `ReactNode` | sim |  |

## Telas onde aparece

- Inspetor: `src/components/library/inspector/details.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

`Field` é um campo de formulário com o rótulo em cima, para envolver um input ou um select. `Property` é uma linha de propriedade só de leitura, rótulo à esquerda e valor à direita, como nos detalhes do inspetor.

Não use `Property` para algo editável: use `Field`.

## Trecho de código

De `src/components/library/inspector/details.tsx`:

```tsx
<Field label="Nome">
  <input
    value={asset.name}
    onChange={(event) => updateAsset(asset.id, { name: event.target.value })}
    className="field"
  />
</Field>
```

<<<FIM>>>
