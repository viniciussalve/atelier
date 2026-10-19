import { VERDICT_LABEL } from "@/lib/library/criteria";
import type { EvaluationStatus, Verdict } from "@/lib/library/types";

/** Dot fill per verdict; no verdict is a hollow ring. */
export const VERDICT_DOT: Record<Verdict, string> = {
  usar: "bg-good",
  revisar: "bg-warn",
  evitar: "bg-bad",
  "": "ring-1 ring-inset ring-subtle",
};

/** Tinted chip per verdict. */
export const VERDICT_CHIP: Record<Exclude<Verdict, "">, string> = {
  usar: "bg-good/15 text-good",
  revisar: "bg-warn/15 text-warn",
  evitar: "bg-bad/15 text-bad",
};

/** Solid fill for the selected verdict button. */
export const VERDICT_SOLID: Record<Exclude<Verdict, "">, string> = {
  usar: "bg-good text-ink",
  revisar: "bg-warn text-ink",
  evitar: "bg-bad text-ink",
};

export const STATUS_TEXT: Record<EvaluationStatus, string> = {
  "nao-avaliado": "text-subtle",
  "em-avaliacao": "text-proof",
  decidido: "text-fg",
};

/** Accessible name for an item control: "Inter, usar". */
export function withVerdict(name: string, verdict: Verdict) {
  return verdict ? `${name}, ${VERDICT_LABEL[verdict].toLowerCase()}` : name;
}
