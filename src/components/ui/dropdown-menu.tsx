import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuSub = Menu.Sub;
export const DropdownMenuRadioGroup = Menu.RadioGroup;

const panel =
  "z-50 min-w-44 rounded-lg border border-border bg-elevated p-1 text-sm text-fg shadow-[0_12px_32px_rgb(0_0_0/0.45)]";
const row =
  "relative flex h-8 cursor-default items-center gap-2 rounded-md px-2 outline-none select-none data-[disabled]:opacity-40 data-[highlighted]:bg-surface";

export function DropdownMenuContent({
  className,
  align = "start",
  ...rest
}: ComponentPropsWithoutRef<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={4}
        collisionPadding={8}
        className={cn(panel, className)}
        {...rest}
      />
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  tone,
  ...rest
}: ComponentPropsWithoutRef<typeof Menu.Item> & { tone?: "danger" }) {
  return (
    <Menu.Item
      className={cn(
        row,
        "[&_svg]:size-3.5 [&_svg]:text-muted",
        tone === "danger" && "text-bad [&_svg]:text-bad",
        className,
      )}
      {...rest}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem className={cn(row, "pl-7", className)} {...rest}>
      <Menu.ItemIndicator className="absolute left-2 grid place-items-center">
        <Check className="size-3.5 text-proof" />
      </Menu.ItemIndicator>
      {children}
    </Menu.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem className={cn(row, "pl-7", className)} {...rest}>
      <Menu.ItemIndicator className="absolute left-2 grid place-items-center">
        <Check className="size-3.5 text-proof" />
      </Menu.ItemIndicator>
      {children}
    </Menu.RadioItem>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Menu.Label className="px-2 pt-1.5 pb-1 text-xs text-muted">{children}</Menu.Label>;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="my-1 h-px bg-border" />;
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof Menu.SubTrigger>) {
  return (
    <Menu.SubTrigger
      className={cn(
        row,
        "data-[state=open]:bg-surface [&_svg]:size-3.5 [&_svg]:text-muted",
        className,
      )}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </Menu.SubTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof Menu.SubContent>) {
  return (
    <Menu.Portal>
      <Menu.SubContent
        sideOffset={4}
        collisionPadding={8}
        className={cn(panel, className)}
        {...rest}
      />
    </Menu.Portal>
  );
}
