---
componente: font-interface
camada: library
arquivo: src/components/library/specimen/font-interface.tsx
export: fontinterface
---

# FontInterface

## Camada

library: peça do atelier, ligada aos stores e às regras da biblioteca.

## Arquivo

`src/components/library/specimen/font-interface.tsx`

## Export

`FontInterface`

## Props

### `FontInterface`

The font at work: six small screens, sized in em of the pane's "Corpo" (0.875em is 14 px at 16), each part in the weight the font has for its role.

| Prop | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `asset` | `Asset` | sim |  |
| `paneId` | `string` | sim |  |
| `settings` | `PaneSettings` | sim |  |

## Telas onde aparece

- Provas: `src/components/library/specimen/asset-tab.tsx`

## Quando usar

<!-- Texto gerado por IA. Revise antes de confiar. -->

Para ver uma fonte em uso numa interface: a aba Interface da prova mostra seis telas pequenas (conversa, formulário, tabela, métricas, menu com aviso e configurações), com texto, rótulos e títulos no peso que a fonte tem para cada papel, e a nota do critério Interface no topo.

Para o texto corrido e os tamanhos, use o `FontProof`; para o conjunto de caracteres, o `FontGlyphs`. Para ícones em uso, é a aba Componentes do `IconSpecimen`.

## Trecho de código

De `src/components/library/specimen/asset-tab.tsx`:

```tsx
<FontInterface asset={asset} paneId={paneId} settings={settings} />
```

<<<FIM>>>
