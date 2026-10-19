import { GROUNDS } from "@/components/library/shared/grounds";
import type { PaneSettings } from "@/lib/library/workspace-model";
import { cn } from "@/lib/utils";

export function GroundPicker({
  value,
  onChange,
}: {
  value: PaneSettings["ground"];
  onChange: (value: PaneSettings["ground"]) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Fundo da prova" className="flex gap-1">
      {GROUNDS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={value === item.id}
          aria-label={item.label}
          title={item.label}
          onClick={() => onChange(item.id)}
          className={cn(
            "grid size-6 place-items-center rounded-md border text-[11px] font-medium",
            item.surface,
            value === item.id ? "border-proof ring-1 ring-proof" : "border-border",
          )}
        >
          A
        </button>
      ))}
    </div>
  );
}

export function SizeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-20 accent-proof @md:w-28"
      />
      <span className="w-9 text-fg tabular-nums">{value} px</span>
    </label>
  );
}
