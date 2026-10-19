import { useSyncExternalStore } from "react";
import { DialogClose, Modal } from "@/components/ui/dialog";
import { copyState, subscribeCopy, updateCopy } from "./copy";

/** The notice and the copy-by-hand dialog; mounted once in the shell. */
export function CopyLayer() {
  const { notice, fallback } = useSyncExternalStore(subscribeCopy, copyState, copyState);
  return (
    <>
      <div
        role="status"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2"
      >
        {notice ? (
          <span className="block rounded-full border border-border bg-elevated px-3 py-1.5 text-sm text-fg shadow-[0_8px_24px_rgb(0_0_0/0.4)]">
            {notice}
          </span>
        ) : null}
      </div>
      {fallback ? (
        <Modal
          open
          onOpenChange={(open) => !open && updateCopy({ fallback: null })}
          title={fallback.title}
          description="O navegador não deixou copiar sozinho. O texto já está selecionado: copie com Ctrl+C (⌘C no Mac)."
          footer={
            <DialogClose className="h-9 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg">
              Fechar
            </DialogClose>
          }
        >
          <textarea
            readOnly
            autoFocus
            value={fallback.text}
            rows={fallback.text.length > 400 ? 12 : 4}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={fallback.title}
            className="field w-full resize-none font-mono text-xs"
          />
        </Modal>
      ) : null}
    </>
  );
}
