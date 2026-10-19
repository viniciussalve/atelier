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
  const paint = color.replace("#", "%23");
  return (
    <span className={names.length > 1 ? "inline-grid grid-cols-2 gap-2" : "inline-flex"}>
      {names.map((name) => (
        <img
          key={name}
          alt=""
          width={size}
          height={size}
          src={`https://api.iconify.design/${prefix}/${name}.svg?color=${paint}`}
          style={{ width: size, height: size }}
        />
      ))}
    </span>
  );
}
