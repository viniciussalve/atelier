import { useState } from "react";

/** One Iconify glyph, or a dashed placeholder when the set has no icon by that name. */
export function Glyph({
  prefix,
  name,
  size,
  color,
}: {
  prefix: string;
  name: string;
  size: number;
  color: string;
}) {
  const src = `https://api.iconify.design/${prefix}/${name}.svg?color=${color.replace("#", "%23")}`;
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) {
    return (
      <span
        role="img"
        aria-label={`${name}: não encontrado`}
        title="Não encontrado neste conjunto"
        className="inline-grid place-items-center rounded-[3px] border border-dashed border-current/40 text-[9px] opacity-60"
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }
  return (
    <img
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      src={src}
      onError={() => setFailed(src)}
      style={{ width: size, height: size }}
    />
  );
}

export function SetGlyphs({
  prefix,
  names,
  size,
  color,
}: {
  prefix: string;
  names: string[];
  size: number;
  color: string;
}) {
  if (!prefix || names.length === 0) return null;
  return (
    <span className={names.length > 1 ? "inline-grid grid-cols-2 gap-2" : "inline-flex"}>
      {names.map((name) => (
        <Glyph key={name} prefix={prefix} name={name} size={size} color={color} />
      ))}
    </span>
  );
}
