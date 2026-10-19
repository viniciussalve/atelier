import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SetGlyphs } from "@/components/library/icons";
import { Field, Property } from "@/components/library/shared/field";
import { PAPER_INK } from "@/components/library/shared/grounds";
import { VERDICT_SOLID } from "@/components/library/evaluation/tones";
import { VERDICTS, criteriaFor } from "@/lib/library/criteria";
import { formatDate } from "@/lib/library/format";
import { useActiveAsset } from "@/lib/library/hooks";
import { useLibrary } from "@/lib/library/store";
import type { Asset, Score } from "@/lib/library/types";
import { cn } from "@/lib/utils";

/** Right-hand panel for the item in the active pane; hidden while the collection is in front. */
export function Inspector() {
  const asset = useActiveAsset();
  if (!asset) return null;
  return (
    <aside
      aria-label="Inspetor"
      className="hidden min-h-0 w-72 shrink-0 flex-col border-l border-border bg-surface min-[860px]:flex"
    >
      <InspectorBody asset={asset} />
    </aside>
  );
}

export function InspectorBody({ asset }: { asset: Asset }) {
  const folders = useLibrary((state) => state.folders);
  const updateAsset = useLibrary((state) => state.updateAsset);
  const setScore = useLibrary((state) => state.setScore);
  const addTag = useLibrary((state) => state.addTag);
  const removeTag = useLibrary((state) => state.removeTag);
  const assignFolder = useLibrary((state) => state.assignFolder);
  const unassignFolder = useLibrary((state) => state.unassignFolder);
  const [tagDraft, setTagDraft] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);

  const kindFolders = folders.filter((folder) => folder.kind === asset.kind);
  const assigned = kindFolders.filter((folder) => asset.folderIds.includes(folder.id));
  const available = kindFolders.filter((folder) => !asset.folderIds.includes(folder.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="text-xs font-medium text-muted">Avaliação</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {VERDICTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={asset.verdict === entry.id}
              onClick={() =>
                updateAsset(asset.id, { verdict: asset.verdict === entry.id ? "" : entry.id })
              }
              className={cn(
                "h-8 rounded-md text-sm",
                asset.verdict === entry.id
                  ? VERDICT_SOLID[entry.id]
                  : "bg-elevated text-muted hover:text-fg",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {criteriaFor(asset.kind).map((criterion) => {
            const current = asset.criteria[criterion.id]?.value ?? null;
            return (
              <div key={criterion.id} className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">{criterion.label}</span>
                <span className="flex gap-1">
                  {([1, 2, 3, 4, 5] as Score[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${criterion.label}: ${value} de 5`}
                      onClick={() =>
                        setScore(asset.id, criterion.id, current === value ? null : value)
                      }
                      className={cn(
                        "grid size-6 place-items-center rounded-md text-xs tabular-nums",
                        current !== null && value <= current
                          ? "bg-proof text-proof-fg"
                          : "bg-elevated text-subtle",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg bg-paper px-4 py-5 text-center text-paper-fg">
        {asset.kind === "font" ? (
          <p className="text-xl leading-tight font-medium" style={{ fontFamily: asset.family }}>
            ABCDEFG
            <br />
            abcdefg
            <br />
            0123456
          </p>
        ) : (
          <div className="grid place-items-center py-3">
            <SetGlyphs
              prefix={asset.iconKey}
              names={asset.samples.slice(0, 4)}
              size={28}
              color={PAPER_INK}
            />
          </div>
        )}
      </div>
      <Field label="Nome">
        <input
          value={asset.name}
          onChange={(event) => updateAsset(asset.id, { name: event.target.value })}
          className="field"
        />
      </Field>
      <Field label="Notas">
        <textarea
          value={asset.notes}
          placeholder="O que a outra parte precisa saber sobre este item"
          onChange={(event) => updateAsset(asset.id, { notes: event.target.value })}
          className="field min-h-20 resize-y"
        />
      </Field>
      <Field label="Link">
        <input
          value={asset.url}
          placeholder="https://"
          onChange={(event) => updateAsset(asset.id, { url: event.target.value })}
          className="field"
        />
      </Field>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {asset.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-elevated px-2 text-xs"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remover ${tag}`}
                onClick={() => removeTag(asset.id, tag)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addTag(asset.id, tagDraft);
              setTagDraft("");
            }}
          >
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              placeholder="Nova tag"
              aria-label="Nova tag"
              className="h-7 w-24 rounded-full bg-elevated px-2 text-xs outline-none placeholder:text-subtle"
            />
          </form>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Pastas</p>
          <button
            type="button"
            aria-label="Adicionar a uma pasta"
            className="grid size-6 place-items-center rounded-full bg-elevated"
            onClick={() => setAddingFolder((value) => !value)}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assigned.length === 0 ? <span className="text-xs text-subtle">Sem pasta</span> : null}
          {assigned.map((folder) => (
            <span
              key={folder.id}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-elevated px-2 text-xs"
            >
              {folder.name}
              <button
                type="button"
                aria-label={`Tirar de ${folder.name}`}
                onClick={() => unassignFolder(asset.id, folder.id)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        {addingFolder ? (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
            {available.length === 0 ? (
              <p className="px-3 py-2 text-xs text-subtle">
                Já está em todas as pastas desta biblioteca.
              </p>
            ) : (
              available.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className="block h-8 w-full truncate px-3 text-left text-sm hover:bg-elevated"
                  onClick={() => {
                    assignFolder(asset.id, folder.id);
                    setAddingFolder(false);
                  }}
                >
                  {folder.name}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Propriedades</p>
        <Property label="Tipo">{asset.kind === "font" ? "Fonte" : "Conjunto de ícones"}</Property>
        <Property label="Estilo">{asset.style || "—"}</Property>
        <Property label="Tamanho">{asset.sizeLabel || "—"}</Property>
        <Property label="Formato">{asset.format || "—"}</Property>
        <Property label="Licença">{asset.license || "—"}</Property>
        <Property label="Importado">{formatDate(asset.importedAt)}</Property>
        <Property label="Modificado">{formatDate(asset.modifiedAt)}</Property>
      </div>
    </div>
  );
}
