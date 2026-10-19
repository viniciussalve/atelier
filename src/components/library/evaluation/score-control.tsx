import { useEffect, useRef, useState } from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Info, PenLine } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaceIcon } from "@/components/ui/face-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { SCALE } from "@/lib/library/criteria";
import type { CriterionDef, CriterionScore, Score } from "@/lib/library/types";
import { cn } from "@/lib/utils";

const VALUES: Score[] = [1, 2, 3, 4, 5];
export const NOTE_LIMIT = 140;

type Props = {
  criterion: CriterionDef;
  entry: CriterionScore | undefined;
  onScore: (value: Score | null) => void;
  onNote: (note: string) => void;
};

/**
 * A 1–5 score for one criterion, as five faces from Muito ruim to Ótimo. Clicking
 * the current face clears it; arrow keys move between faces. Only the chosen
 * face lights up, with a ring, so the state never rests on color alone.
 *
 * `inline` sits in a specimen section header, drawn like a proof mark in the
 * margin, so the criterion is judged while looking at what it is about.
 */
export function ScoreControl({
  variant,
  onPaper = false,
  ...props
}: Props & { variant: "inline" | "full"; onPaper?: boolean }) {
  return variant === "inline" ? (
    <InlineScore onPaper={onPaper} {...props} />
  ) : (
    <FullScore {...props} />
  );
}

function Segments({
  criterion,
  value,
  onScore,
  size,
  onPaper,
}: {
  criterion: CriterionDef;
  value: Score | null;
  onScore: (value: Score | null) => void;
  size: "sm" | "md";
  onPaper: boolean;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value ? String(value) : ""}
      onValueChange={(next) => onScore(next ? (Number(next) as Score) : null)}
      aria-label={`Nota para ${criterion.label}`}
      className="flex gap-0.5"
    >
      {VALUES.map((option) => {
        const chosen = option === value;
        return (
          <Tooltip key={option} content={SCALE[option]} side="top">
            <ToggleGroup.Item
              value={String(option)}
              aria-label={`${criterion.label}: ${SCALE[option]}`}
              className={cn(
                "grid place-items-center rounded-[5px] transition-colors",
                size === "md" ? "h-8 flex-1" : "size-6",
                onPaper
                  ? chosen
                    ? "bg-proof-ink/10 text-proof-ink ring-1 ring-proof-ink/70"
                    : "text-current/30 hover:text-current/60"
                  : chosen
                    ? "bg-proof/15 text-proof ring-1 ring-proof/70"
                    : "text-subtle hover:bg-elevated hover:text-muted",
              )}
            >
              <FaceIcon level={option} size={size === "md" ? 20 : 18} />
            </ToggleGroup.Item>
          </Tooltip>
        );
      })}
    </ToggleGroup.Root>
  );
}

function NoteEditor({
  criterion,
  note,
  onNote,
  autoFocus,
}: {
  criterion: CriterionDef;
  note: string;
  onNote: (note: string) => void;
  autoFocus?: boolean;
}) {
  // Edit locally and save on pause, so typing does not rewrite the item per keystroke.
  const [draft, setDraft] = useState(note);
  useEffect(() => setDraft(note), [note]);
  useEffect(() => {
    if (draft === note) return;
    const timer = setTimeout(() => onNote(draft), 400);
    return () => clearTimeout(timer);
  }, [draft, note, onNote]);

  // Closing the popover (Escape) unmounts the editor before the pause ends, and
  // leaving the page drops the timer without unmounting anything: save in both.
  const pending = useRef({ draft, note, onNote });
  useEffect(() => {
    pending.current = { draft, note, onNote };
  });
  useEffect(() => {
    const flush = () => {
      const { draft: last, note: saved, onNote: save } = pending.current;
      if (last !== saved) save(last);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return (
    <label className="block">
      <span className="sr-only">Nota sobre {criterion.label}</span>
      <textarea
        autoFocus={autoFocus}
        value={draft}
        maxLength={NOTE_LIMIT}
        rows={2}
        placeholder="O que você viu aqui"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => draft !== note && onNote(draft)}
        className="field resize-none text-sm"
      />
      <span className="mt-1 block text-right text-[11px] text-subtle tabular-nums">
        {draft.length}/{NOTE_LIMIT}
      </span>
    </label>
  );
}

function InlineScore({ criterion, entry, onScore, onNote, onPaper }: Props & { onPaper: boolean }) {
  const value = entry?.value ?? null;
  const note = entry?.note ?? "";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg py-1 pr-1 pl-2",
        onPaper ? "bg-proof-ink/[0.07] text-proof-ink" : "bg-proof/10 text-proof",
      )}
    >
      <span className="text-xs font-medium">{criterion.label}</span>
      <Segments criterion={criterion} value={value} onScore={onScore} size="sm" onPaper={onPaper} />
      <Popover>
        <PopoverTrigger
          aria-label={note ? `Nota sobre ${criterion.label}: ${note}` : `Anotar ${criterion.label}`}
          className="relative grid size-6 place-items-center rounded-[5px] hover:bg-current/10"
        >
          <PenLine className="size-3.5" />
          {note ? (
            <span
              aria-hidden
              className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-current"
            />
          ) : null}
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2">
          <p className="text-xs text-muted">{criterion.hint}</p>
          <NoteEditor criterion={criterion} note={note} onNote={onNote} autoFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FullScore({ criterion, entry, onScore, onNote }: Props) {
  const value = entry?.value ?? null;
  const note = entry?.note ?? "";
  const [writing, setWriting] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{criterion.label}</span>
        <span className="text-xs text-subtle">peso {criterion.weight}</span>
        <Popover>
          <PopoverTrigger
            aria-label={`O que observar em ${criterion.label}`}
            className="self-center text-subtle hover:text-fg"
          >
            <Info className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent side="left" className="w-64 text-sm text-muted">
            {criterion.hint}
          </PopoverContent>
        </Popover>
        <span className={cn("ml-auto text-xs", value ? "text-proof" : "text-subtle")}>
          {value ? SCALE[value] : "Sem nota"}
        </span>
      </div>
      <Segments criterion={criterion} value={value} onScore={onScore} size="md" onPaper={false} />
      {note || writing ? (
        <NoteEditor
          criterion={criterion}
          note={note}
          onNote={onNote}
          autoFocus={writing && !note}
        />
      ) : (
        <button
          type="button"
          onClick={() => setWriting(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg"
        >
          <PenLine className="size-3" /> Anotar
        </button>
      )}
    </div>
  );
}
