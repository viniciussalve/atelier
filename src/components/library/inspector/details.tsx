import { useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { Field, Property } from "@/components/library/shared/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { folderPath } from "@/lib/library/folders";
import { externalLink, formatDate } from "@/lib/library/format";
import { useLibrary } from "@/lib/library/store";
import type { Asset } from "@/lib/library/types";

const chip = "inline-flex h-7 items-center gap-1 rounded-md bg-elevated pr-1 pl-2 text-xs";

/** Everything about an item that is not its evaluation. */
export function Details({ asset }: { asset: Asset }) {
  const folders = useLibrary((state) => state.folders);
  const updateAsset = useLibrary((state) => state.updateAsset);
  const addTag = useLibrary((state) => state.addTag);
  const removeTag = useLibrary((state) => state.removeTag);
  const assignFolder = useLibrary((state) => state.assignFolder);
  const unassignFolder = useLibrary((state) => state.unassignFolder);
  const [tagDraft, setTagDraft] = useState("");

  const kindFolders = folders.filter((folder) => folder.kind === asset.kind);
  const assigned = kindFolders.filter((folder) => asset.folderIds.includes(folder.id));
  const available = kindFolders
    .filter((folder) => !asset.folderIds.includes(folder.id))
    .map((folder) => ({ folder, path: folderPath(folders, folder.id).join(" / ") }))
    .sort((a, b) => a.path.localeCompare(b.path, "pt-BR"));
  const link = externalLink(asset.url);

  return (
    <div className="space-y-5">
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
          placeholder="O que a outra pessoa precisa saber sobre este item"
          onChange={(event) => updateAsset(asset.id, { notes: event.target.value })}
          className="field min-h-20 resize-y"
        />
      </Field>
      <div>
        <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
          <label htmlFor={`link-${asset.id}`}>Link</label>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-normal hover:text-fg"
            >
              Abrir <ExternalLink className="size-3" />
            </a>
          ) : null}
        </span>
        <input
          id={`link-${asset.id}`}
          value={asset.url}
          placeholder="https://"
          onChange={(event) => updateAsset(asset.id, { url: event.target.value })}
          className="field"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {asset.tags.map((tag) => (
            <span key={tag} className={chip}>
              {tag}
              <button
                type="button"
                aria-label={`Remover a tag ${tag}`}
                onClick={() => removeTag(asset.id, tag)}
                className="grid size-5 place-items-center rounded text-muted hover:text-fg"
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
              className="h-7 w-24 rounded-md border border-dashed border-border bg-transparent px-2 text-xs outline-none placeholder:text-subtle focus:border-proof/60"
            />
          </form>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted">Pastas</p>
        <div className="flex flex-wrap gap-1.5">
          {assigned.map((folder) => (
            <span key={folder.id} className={chip}>
              {folderPath(folders, folder.id).join(" / ")}
              <button
                type="button"
                aria-label={`Tirar de ${folder.name}`}
                onClick={() => unassignFolder(asset.id, folder.id)}
                className="grid size-5 place-items-center rounded text-muted hover:text-fg"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <Popover>
            <PopoverTrigger className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-border px-2 text-xs text-muted hover:text-fg">
              <Plus className="size-3" /> Adicionar à pasta
            </PopoverTrigger>
            <PopoverContent className="w-60 p-1">
              {available.length === 0 ? (
                <p className="px-2 py-2 text-sm text-muted">Já está em todas as pastas.</p>
              ) : (
                available.map(({ folder, path }) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => assignFolder(asset.id, folder.id)}
                    className="block h-8 w-full truncate rounded-md px-2 text-left text-sm hover:bg-surface"
                  >
                    {path}
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted">Propriedades</p>
        <Property label="Tipo">{asset.kind === "font" ? "Fonte" : "Conjunto de ícones"}</Property>
        <Property label="Estilo">{asset.style || "—"}</Property>
        {asset.kind === "font" ? <Property label="Pesos">{asset.weights || "—"}</Property> : null}
        <Property label="Tamanho">{asset.sizeLabel || "—"}</Property>
        <Property label="Formato">{asset.format || "—"}</Property>
        <Property label="Licença">{asset.license || "—"}</Property>
        <Property label="Importado">{formatDate(asset.importedAt)}</Property>
        <Property label="Modificado">{formatDate(asset.modifiedAt)}</Property>
      </div>
    </div>
  );
}
