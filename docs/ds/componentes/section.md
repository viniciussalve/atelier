---
componente: section
camada: library
arquivo: src/components/library/specimen/section.tsx
export: specimensection, specimenscreen
---

# Section

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/section.tsx`

## Export

`SpecimenSection`, `SpecimenScreen`

## Props

### `SpecimenSection`

One part of a specimen. When a criterion is judged on this part, its score opens the section, so it can be rated while looking at it; otherwise the title does.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `title` | `string` | sim |  |
| `section` | `SpecimenSection` | não |  |
| `asset` | `Asset` | sim |  |
| `paneId` | `string` | sim |  |
| `onPaper` | `boolean` | sim |  |
| `children` | `ReactNode` | sim |  |

### `SpecimenScreen`

One small screen of a specimen: its name in the app's own type, then the screen in a frame.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `title` | `string` | sim |  |
| `children` | `ReactNode` | sim |  |

## Telas onde aparece

- Provas: `src/components/library/specimen/font-interface.tsx`
- Provas: `src/components/library/specimen/font-specimen.tsx`
- Provas: `src/components/library/specimen/icon-specimen.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para uma parte de uma prova (um texto, os pesos, os tamanhos). Quando um critério é avaliado nessa parte, a carinha dele fica no cabeçalho da seção, para dar nota olhando o que ela mede.

Use dentro das provas de fonte e de ícones; não serve como seção genérica de página.

## Trecho de código

De `src/components/library/specimen/font-specimen.tsx`:

```tsx
<SpecimenSection title="Título" section="titulo" {...section}>
  <h2
    className="max-w-[20ch] text-[2.5em] leading-[1.1] font-medium tracking-tight"
    style={face}
  >
    {HEADLINE}
  </h2>
</SpecimenSection>
```

<<<FIM>>>
