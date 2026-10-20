---
componente: details
camada: library
arquivo: src/components/library/inspector/details.tsx
export: details
---

# Details

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/inspector/details.tsx`

## Export

`Details`

## Props

### `Details`

Everything about an item that is not its evaluation.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |

## Telas onde aparece

- Inspetor: `src/components/library/inspector/inspector.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para os detalhes de um item que não são a avaliação: nome, notas, tags, pastas (com "Adicionar à pasta") e as propriedades (tipo, licença, estilo, formato, pesos, tamanho, datas). Fica no inspetor, abaixo da avaliação.

Não use para a nota e o veredito: isso é o `Scorecard`.

## Trecho de código

De `src/components/library/inspector/inspector.tsx`:

```tsx
<Details key={`detalhes-${asset.id}`} asset={asset} />
```

<<<FIM>>>
