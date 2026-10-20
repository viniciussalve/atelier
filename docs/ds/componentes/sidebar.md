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

É a barra lateral do app: a escolha da biblioteca (Fontes ou Ícones), as vistas rápidas e o explorador de pastas. Abaixo de 860 px vira uma gaveta. Já fica montada uma vez na raiz.

Não monte de novo: uma vista nova entra na lista de vistas dela.

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
