---
componente: section
camada: library
arquivo: src/components/library/specimen/section.tsx
export: specimensection
---

# Section

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/section.tsx`

## Export

`SpecimenSection`

## Props

### `SpecimenSection`

One part of a specimen. When a criterion is judged on this part, its score sits in the section header, so it can be rated while looking at it.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `title` | `string` | sim |  |
| `section` | `SpecimenSection` | não |  |
| `asset` | `Asset` | sim |  |
| `paneId` | `string` | sim |  |
| `onPaper` | `boolean` | sim |  |
| `children` | `ReactNode` | sim |  |

## Telas onde aparece

- Provas: `src/components/library/specimen/font-specimen.tsx`
- Provas: `src/components/library/specimen/icon-specimen.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/specimen/font-specimen.tsx`:

```tsx
<SpecimenSection title="Título" section="titulo" {...section}>
  <h2
    className="max-w-[20ch] text-[2.5em] leading-[1.1] font-medium tracking-tight"
    style={face}
  >
    Clareza na conversa com o agente
  </h2>
</SpecimenSection>
```

<<<FIM>>>
