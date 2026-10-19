import * as ToggleGroup from "@radix-ui/react-toggle-group";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is an icon. */
  title?: string;
  count?: number;
};

/** A single-choice switch that never ends up empty. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={label}
      className={cn("flex rounded-lg bg-bg p-0.5", className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={option.title}
          title={option.title}
          className="flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm text-muted transition-colors hover:text-fg data-[state=on]:bg-elevated data-[state=on]:text-fg"
        >
          {option.label}
          {option.count !== undefined ? (
            <span className="text-xs text-subtle tabular-nums">{option.count}</span>
          ) : null}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
