---
componente: sidebar
camada: library
arquivo: src/components/library/sidebar/sidebar.tsx
export: sidebar
---

# Sidebar

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/sidebar/sidebar.tsx`

## Export

`Sidebar`

## Props

### `Sidebar`

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `open` | `boolean` | sim |  |
| `onClose` | `() => void` | sim |  |
| `onNavigate` | `() => void` | sim |  |
| `onQuickOpen` | `() => void` | sim |  |

## Telas onde aparece

- Atelier (raiz da tela): `src/components/library/atelier.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

_Pendente: texto a ser escrito por IA._

## Trecho de código

De `src/components/library/atelier.tsx`:

```tsx
<Sidebar
  open={navOpen}
  onClose={closeNav}
  onNavigate={closeNav}
  onQuickOpen={() => {
    setNavOpen(false);
    setPaletteOpen(true);
  }}
/>
```

<<<FIM>>>
