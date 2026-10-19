import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  shortcut?: string;
  active?: boolean;
  size?: "sm" | "md";
};

/** A square icon button whose label shows as a tooltip and names it for screen readers. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, active, size = "md", className, children, ...rest },
  ref,
) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "grid shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-fg disabled:pointer-events-none disabled:opacity-30 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted",
          size === "md" ? "size-8" : "size-7",
          active && "bg-elevated text-fg",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});
