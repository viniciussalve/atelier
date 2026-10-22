---
componente: tabs
camada: ui
arquivo: src/components/ui/tabs.tsx
export: tabs, tabslist, tabstrigger, tabscontent
---

# Tabs

## Camada

ui: peça base, sem regra do atelier (em geral um wrapper do Radix).

## Arquivo

`src/components/ui/tabs.tsx`

## Export

`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

## Props

### `Tabs`

Também aceita as props herdadas: 278 de `react`, 6 de `@radix-ui/react-tabs`, 1 de `@radix-ui/react-primitive`.

### `TabsList`

Também aceita as props herdadas: 279 de `react`, 1 de `@radix-ui/react-primitive`, 1 de `@radix-ui/react-tabs`.

### `TabsTrigger`

Underlined text tabs, for switching views inside a panel.

Também aceita as props herdadas: 288 de `react`, 1 de `@radix-ui/react-tabs`, 1 de `@radix-ui/react-primitive`.

### `TabsContent`

Também aceita as props herdadas: 280 de `react`, 2 de `@radix-ui/react-tabs`, 1 de `@radix-ui/react-primitive`.

## Telas onde aparece

- Provas: `src/components/library/specimen/asset-tab.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para navegar entre seções do mesmo painel, como as partes da prova (Prova, Interface, Glifos). São abas de texto sublinhadas: `TabsList` agrupa, `TabsTrigger` é cada aba e `TabsContent` é o conteúdo.

Para as abas de itens abertos num painel, isso é a `TabStrip`. Para uma escolha de exibição, use o `Segmented`.

## Trecho de código

De `src/components/library/specimen/asset-tab.tsx`:

```tsx
<Tabs
  value={tab}
  onValueChange={(next) =>
    onSettings(
      asset.kind === "font"
        ? { fontTab: next as FontSpecimenTab }
        : { iconTab: next as IconSpecimenTab },
    )
  }
>
  <TabsList aria-label="Partes da prova">
    {/* … */}
  </TabsList>
</Tabs>
```

<<<FIM>>>
