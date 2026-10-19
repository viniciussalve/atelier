import type { Score } from "@/lib/library/types";

/**
 * Geometry of the carinhas set on a 24 grid. `dots` are eyes drawn as a tiny
 * 12-gon that grows with the stroke (a circle with a stroke wider than itself
 * leaves a false ring in Skia), `strokes` are open lines and `solids` open mouths.
 */
export type FaceData = { dots: string[]; strokes: string[]; solids: string[] };

const EYES = [
  "M9.5 10L9.43 10.25L9.25 10.43L9 10.5L8.75 10.43L8.57 10.25L8.5 10L8.57 9.75L8.75 9.57L9 9.5L9.25 9.57L9.43 9.75Z",
  "M15.5 10L15.43 10.25L15.25 10.43L15 10.5L14.75 10.43L14.57 10.25L14.5 10L14.57 9.75L14.75 9.57L15 9.5L15.25 9.57L15.43 9.75Z",
];

export const FACES: Record<Score, FaceData> = {
  1: {
    dots: [],
    strokes: [
      "M7.5 10.5Q8.9 11.6 10.4 10.1",
      "M16.5 10.5Q15.1 11.6 13.6 10.1",
      "M8.25 16.75Q12 13.25 15.75 16.75",
    ],
    solids: [],
  },
  2: { dots: EYES, strokes: ["M9 16.25Q12 14 15 16.25"], solids: [] },
  3: { dots: EYES, strokes: ["M9 15.5L15 15.5"], solids: [] },
  4: {
    dots: EYES,
    strokes: [],
    solids: [
      "M8.75 14L15.25 14C15.25 15.795 13.795 17.25 12 17.25C10.205 17.25 8.75 15.795 8.75 14Z",
    ],
  },
  5: {
    dots: [],
    strokes: ["M7.75 10.5Q9 8.5 10.25 10.5", "M13.75 10.5Q15 8.5 16.25 10.5"],
    solids: [
      "M7.75 13.5L16.25 13.5C16.25 15.847 14.347 17.75 12 17.75C9.653 17.75 7.75 15.847 7.75 13.5Z",
    ],
  },
};
