import * as Dialog from "@radix-ui/react-dialog";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { returnFocus } from "@/components/ui/return-focus";
import { cn } from "@/lib/utils";

/**
 * A centered modal: focus stays inside, the page behind is hidden from assistive
 * tech, and Escape or a click outside closes it. `footer` stays visible while the
 * body scrolls. On close, focus goes back to what had it when the modal opened.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  fallbackFocus,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Takes focus on close when what opened the modal left the page or was the body. */
  fallbackFocus?: () => HTMLElement | null;
  /** Runs first on close; `event.preventDefault()` there to place focus yourself. */
  onCloseAutoFocus?: (event: Event) => void;
}) {
  // Without a Dialog.Trigger, Radix leaves focus on the body when the modal closes,
  // so remember what had it. Here and not in onOpenAutoFocus, which Radix skips
  // when a field inside has autoFocus: the portal mounts the content only after
  // this effect, so focus is still on the opener.
  const opener = useRef<Element | null>(null);
  useLayoutEffect(() => {
    if (open) opener.current = document.activeElement;
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            if (event.defaultPrevented) return;
            event.preventDefault();
            returnFocus(opener.current, fallbackFocus);
          }}
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
