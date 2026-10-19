import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A centered modal: focus stays inside, the page behind is hidden from assistive
 * tech, and Escape or a click outside closes it. `footer` stays visible while the
 * body scrolls.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed top-[10vh] left-1/2 z-50 flex max-h-[80vh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface text-fg shadow-[0_24px_64px_rgb(0_0_0/0.5)] outline-none",
            className,
          )}
        >
          <div className="px-5 pt-5 pb-3">
            <Dialog.Title className="text-base font-medium">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-1.5 text-sm text-muted">
                {description}
              </Dialog.Description>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const DialogClose = Dialog.Close;
