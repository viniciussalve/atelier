import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({
  className,
  align = "start",
  ...rest
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={6}
        collisionPadding={8}
        className={cn(
          "z-50 rounded-lg border border-border bg-elevated p-2 text-sm text-fg shadow-[0_12px_32px_rgb(0_0_0/0.45)] outline-none",
          className,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
}
