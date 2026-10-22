import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Glyph } from "@/components/library/icons";
import { activeTab } from "@/components/library/shared/active-tab";
import { CHROME_INK } from "@/components/library/shared/grounds";
import { useFontLinks } from "@/components/library/shared/use-font-links";
import { DialogClose, Modal } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import {
  assetKeyOf,
  fontAsset,
  formatAddList,
  iconSetAsset,
  parseAddList,
  type AddSpec,
} from "@/lib/ai/additions";
import type { CatalogFont, CatalogIconSet } from "@/lib/ai/catalog";
import { appUrl } from "@/lib/ai/links";
import { addItems } from "@/lib/library/commands";
import { fontAssetHref } from "@/lib/library/fonts";
import { useLibrary } from "@/lib/library/store";
import type { Asset, Kind } from "@/lib/library/types";

/** What opened the dialog: a link with suggestions (from an AI), or the add command. */
export type ImportRequest =
  { mode: "link"; specs: AddSpec[]; reason: string } | { mode: "search"; kind: Kind };

type Loaded =
  | { state: "loading" }
  | { state: "error" }
  | { state: "done"; assets: Asset[]; missing: AddSpec[] };

const SEARCH_LIMIT = 12;

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(appUrl(window.location, path), { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function load(
  request: ImportRequest,
  kind: Kind,
  query: string,
  signal: AbortSignal,
): Promise<{ assets: Asset[]; missing: AddSpec[] }> {
  if (request.mode === "link") {
    const list = encodeURIComponent(formatAddList(request.specs));
    const body = await getJson<{ itens: Asset[]; naoEncontrados: string[] }>(
      `/api/adicionar?itens=${list}`,
      signal,
    );
    return { assets: body.itens, missing: parseAddList(body.naoEncontrados.join(",")) };
  }
  const q = encodeURIComponent(query.trim());
  const now = new Date().toISOString();
  if (kind === "font") {
    const body = await getJson<{ fontes: CatalogFont[] }>(
      `/api/fontes?limite=${SEARCH_LIMIT}&q=${q}`,
      signal,
    );
    return { assets: body.fontes.map((font) => fontAsset(font, now)), missing: [] };
  }
  const body = await getJson<{ conjuntos: CatalogIconSet[] }>(
    `/api/conjuntos?limite=${SEARCH_LIMIT}&q=${q}`,
    signal,
  );
  return { assets: body.conjuntos.map((set) => iconSetAsset(set, now)), missing: [] };
}

/**
 * Adds fonts and icon sets from the catalogs. From a link it lists the suggested
 * items, already chosen; from the add command it searches the catalog. Nothing is
 * added until the person confirms.
 */
export function ImportDialog({
  request,
  onClose,
}: {
  request: ImportRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;
  return <ImportBody request={request} onClose={onClose} />;
}

function ImportBody({ request, onClose }: { request: ImportRequest; onClose: () => void }) {
  const assets = useLibrary((state) => state.assets);
  const existing = useMemo(() => new Set(assets.map(assetKeyOf)), [assets]);
  const [kind, setKind] = useState<Kind>(request.mode === "search" ? request.kind : "font");
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });
  // Chosen items survive a new search, so a person can pick from several.
  const [chosen, setChosen] = useState<Map<string, Asset>>(() => new Map());

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setLoaded({ state: "loading" });
        load(request, kind, query, controller.signal).then(
          (result) => {
            setLoaded({ state: "done", ...result });
            if (request.mode !== "link") return;
            const have = new Set(useLibrary.getState().assets.map(assetKeyOf));
            const fresh = result.assets.filter((item) => !have.has(assetKeyOf(item)));
            setChosen(new Map(fresh.map((item) => [assetKeyOf(item), item])));
          },
          () => {
            if (!controller.signal.aborted) setLoaded({ state: "error" });
          },
        );
      },
      request.mode === "search" ? 200 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request, kind, query, attempt]);

  const rows = loaded.state === "done" ? loaded.assets : [];
  useFontLinks(rows.filter((item) => item.kind === "font").map(fontAssetHref));

  const toggle = (item: Asset) =>
    setChosen((current) => {
      const next = new Map(current);
      const key = assetKeyOf(item);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });

  const confirmed = useRef(false);
  const confirm = () => {
    confirmed.current = true;
    addItems([...chosen.values()], {
      fromAi: request.mode === "link",
      reason: request.mode === "link" ? request.reason : undefined,
    });
    onClose();
  };

  const count = chosen.size;
  const title =
    request.mode === "link"
      ? "Adicionar sugestões"
      : kind === "font"
        ? "Adicionar fontes"
        : "Adicionar conjuntos de ícones";
  const description =
    request.mode === "link"
      ? request.reason || "Uma IA sugeriu estes itens. Escolha o que entra na biblioteca."
      : kind === "font"
        ? "Famílias do Google Fonts."
        : "Conjuntos do Iconify.";

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description}
      // Opened from a link, nothing had focus: the active tab takes it.
      fallbackFocus={activeTab}
      // Confirming opens the first new item in front: its tab takes focus, not the opener.
      onCloseAutoFocus={(event) => {
        if (!confirmed.current) return;
        event.preventDefault();
        activeTab()?.focus();
      }}
      footer={
        <>
          <DialogClose className="h-9 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg">
            Cancelar
          </DialogClose>
          <button
            type="button"
            disabled={count === 0}
            onClick={confirm}
            className="h-9 rounded-md bg-proof px-3 text-sm font-medium text-proof-fg disabled:opacity-40"
          >
            {count === 0 ? "Adicionar" : `Adicionar ${count} ${count === 1 ? "item" : "itens"}`}
          </button>
        </>
      }
    >
      {request.mode === "search" ? (
        <div className="mb-3 flex flex-col gap-2">
          <Segmented<Kind>
            label="Catálogo"
            value={kind}
            onChange={setKind}
            options={[
              { value: "font", label: "Fontes" },
              { value: "icon", label: "Ícones" },
            ]}
          />
          <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-bg px-2 focus-within:border-proof/60">
            <Search className="size-4 shrink-0 text-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={kind === "font" ? "Nome da família" : "Nome ou prefixo do conjunto"}
              aria-label={kind === "font" ? "Buscar no Google Fonts" : "Buscar no Iconify"}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </label>
        </div>
      ) : null}

      <div aria-live="polite" aria-busy={loaded.state === "loading"}>
        {loaded.state === "loading" ? (
          <p className="py-6 text-center text-sm text-muted">Buscando no catálogo…</p>
        ) : loaded.state === "error" ? (
          <div className="py-6 text-center text-sm text-muted">
            <p>Não foi possível falar com o servidor.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-2 text-proof hover:underline"
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <>
            {rows.length === 0 && loaded.missing.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Nada com “{query.trim()}”. Tente outro nome.
              </p>
            ) : null}
            <ul className="flex flex-col gap-px">
              {rows.map((item) => {
                const key = assetKeyOf(item);
                const have = existing.has(key);
                return (
                  <li key={key}>
                    <ImportRow
                      item={item}
                      have={have}
                      checked={have || chosen.has(key)}
                      onToggle={() => toggle(item)}
                    />
                  </li>
                );
              })}
            </ul>
            {loaded.missing.length ? (
              <p className="mt-3 text-xs text-muted">
                Não achei nos catálogos:{" "}
                {loaded.missing
                  .map((spec) => `${spec.key} (${spec.kind === "font" ? "fonte" : "ícones"})`)
                  .join(", ")}
                .
              </p>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

function ImportRow({
  item,
  have,
  checked,
  onToggle,
}: {
  item: Asset;
  have: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const facts =
    item.kind === "font"
      ? [item.style, item.weights && `pesos ${item.weights}`, item.license]
      : [item.sizeLabel, item.style, item.license];
  return (
    <label
      className={
        have
          ? "flex items-center gap-3 rounded-lg px-2 py-2 text-muted"
          : "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-elevated"
      }
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={have}
        onChange={onToggle}
        className="size-4 shrink-0 accent-proof"
      />
      <span aria-hidden className="flex w-16 shrink-0 items-center gap-1.5">
        {item.kind === "icon" ? (
          item.samples
            .slice(0, 3)
            .map((name) => (
              <Glyph key={name} prefix={item.iconKey} name={name} size={16} color={CHROME_INK} />
            ))
        ) : (
          <span className="text-xl leading-none" style={{ fontFamily: item.family }}>
            Ag
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-sm"
          style={item.kind === "font" ? { fontFamily: item.family } : undefined}
        >
          {item.name}
        </span>
        <span className="flex flex-wrap gap-x-3 text-xs text-muted">
          {facts.filter(Boolean).map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
          {have ? <span className="text-subtle">Já está na biblioteca</span> : null}
        </span>
      </span>
    </label>
  );
}
