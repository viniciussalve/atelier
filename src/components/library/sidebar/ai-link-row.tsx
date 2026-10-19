import { useEffect, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { buildAiLink } from "@/components/library/shared/ai-link";
import { copyText } from "@/components/library/shared/copy";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Pinned at the top of the bar: copies the "Link para IA", which carries the
 * library and the instructions an AI needs. The label says when it is copied.
 */
export function AiLinkRow({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    const text = link || (await buildAiLink());
    if (await copyText(text, { title: "Link para IA" })) setCopied(true);
  };

  return (
    <div className="mb-3">
      <Tooltip content="Copia um link com sua biblioteca e instruções para a IA" side="right">
        <button
          type="button"
          aria-label="Copiar link para IA"
          onClick={() => void copy()}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-muted transition-colors hover:bg-elevated/60 hover:text-fg"
        >
          <Sparkles className="size-4 text-subtle" />
          <span className="flex-1 text-left">{copied ? "Link copiado" : "Link para IA"}</span>
          {copied ? (
            <Check aria-hidden className="size-3.5 text-proof" />
          ) : (
            <Copy aria-hidden className="size-3.5 text-subtle" />
          )}
        </button>
      </Tooltip>
      <span role="status" className="sr-only">
        {copied ? "Link para IA copiado" : ""}
      </span>
    </div>
  );
}
