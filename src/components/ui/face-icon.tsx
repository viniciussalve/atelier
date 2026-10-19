import { useId, type SVGProps } from "react";
import type { Score } from "@/lib/library/types";
import { FACES } from "./face-data";

type Props = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & {
  level: Score;
  size?: number;
  /** Width of the cut-out features, in grid units; 2 matches the lucide icons. */
  strokeWidth?: number;
};

/**
 * One face of the carinhas set, filled: a disc in `currentColor` with the
 * features cut out by a mask, so the ground shows through. Always decorative:
 * the control or text around it carries the name ("Bom").
 */
export function FaceIcon({ level, size = 16, strokeWidth = 2, ...rest }: Props) {
  const mask = `face${useId().replace(/[^\w-]/g, "")}`;
  const face = FACES[level];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {/* Mask luminance only: white keeps the disc, black cuts it. Never a visible color. */}
      <mask id={mask}>
        <rect width="24" height="24" fill="#fff" />
        <g fill="none" stroke="#000">
          {face.dots.map((d) => (
            <path key={d} d={d} fill="#000" />
          ))}
          {face.strokes.map((d) => (
            <path key={d} d={d} />
          ))}
          {face.solids.map((d) => (
            <path key={d} d={d} fill="#000" />
          ))}
        </g>
      </mask>
      <circle cx={12} cy={12} r={9.75} fill="currentColor" mask={`url(#${mask})`} />
    </svg>
  );
}
