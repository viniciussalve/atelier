import type { PreviewGround } from "@/lib/library/types";

export type Ground = {
  id: PreviewGround;
  label: string;
  /** Tailwind classes for the specimen surface. */
  surface: string;
  dark: boolean;
  /** Glyph color on this ground, and on an inverted button. Mirrors the @theme tokens in styles.css. */
  ink: string;
  inverseInk: string;
};

const DARK_INK = "#1c1e24"; // --color-paper-fg
const LIGHT_INK = "#eceef2"; // --color-fg

export const GROUNDS: Ground[] = [
  {
    id: "paper",
    label: "Papel",
    surface: "bg-paper text-paper-fg",
    dark: false,
    ink: DARK_INK,
    inverseInk: LIGHT_INK,
  },
  {
    id: "mist",
    label: "Névoa",
    surface: "bg-mist text-paper-fg",
    dark: false,
    ink: DARK_INK,
    inverseInk: LIGHT_INK,
  },
  {
    id: "sand",
    label: "Areia",
    surface: "bg-sand text-paper-fg",
    dark: false,
    ink: DARK_INK,
    inverseInk: LIGHT_INK,
  },
  {
    id: "ink",
    label: "Tinta",
    surface: "bg-ink text-fg",
    dark: true,
    ink: LIGHT_INK,
    inverseInk: DARK_INK,
  },
  {
    id: "navy",
    label: "Marinho",
    surface: "bg-navy text-fg",
    dark: true,
    ink: LIGHT_INK,
    inverseInk: DARK_INK,
  },
];

export function groundOf(id: PreviewGround): Ground {
  return GROUNDS.find((ground) => ground.id === id) ?? GROUNDS[0];
}

export const PAPER_INK = DARK_INK;

/** Glyph color on the app chrome (dark surfaces). */
export const CHROME_INK = LIGHT_INK;
