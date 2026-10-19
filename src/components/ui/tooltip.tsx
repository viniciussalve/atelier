import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  content,
  shortcut,
  side = "bottom",
  children,
}: {
  content: ReactNode;
  shortcut?: string;
  side?: TooltipPrimitive.TooltipContentProps["side"];
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-50 flex max-w-64 items-center gap-2 rounded-md border border-border bg-elevated px-2 py-1 text-xs text-fg"
        >
          {content}
          {shortcut ? <kbd className="font-sans text-muted">{shortcut}</kbd> : null}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
