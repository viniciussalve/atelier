/**
 * A snapshot of the library that travels inside the "Link para IA": compact JSON,
 * compressed and base64url-encoded into `/ia?b=`. The library lives only in the
 * browser, so this is how an AI reading the link learns what the person evaluated.
 * Runs in the browser (encoding) and on the server (decoding).
 */
import { criteriaFor, overallScore, roundedScore } from "../library/criteria.ts";
import { folderPath } from "../library/folders.ts";
import { primaryFamily } from "../library/fonts.ts";
import type { Asset, LibraryData, Score, Verdict } from "../library/types.ts";

/** One item, with short keys: the link has to stay short. Empty fields are left out. */
export type SnapItem = {
  /** Name. */
  n: string;
  /** Font family or icon set prefix. */
  k?: string;
  v?: Exclude<Verdict, "">;
  /** Overall score as a face level (rounded weighted mean). */
  g?: Score;
  /** Face level per criterion id. */
  c?: Record<string, Score>;
  /** Note per criterion id. */
  o?: Record<string, string>;
  /** Tags. */
  t?: string[];
  /** Folder paths, "Sans serif / Interface". */
  p?: string[];
  /** Icon names the person tries in Amostras. */
  s?: string[];
  l?: string;
  /** Style. */
  y?: string;
  /** Weights. */
  w?: string;
  /** The item's notes. */
  x?: string;
};

export type Snapshot = {
  v: 1;
  /** When it was taken (ISO). */
  em: string;
  fontes: SnapItem[];
  icones: SnapItem[];
  /** Set when notes or items were left out to fit the link. */
  resumido?: true;
};

/** Characters of the encoded snapshot; keeps the whole `/ia` link near 6 KB. */
export const SNAPSHOT_BUDGET = 6000;
const MAX_ENCODED = 20_000;
const MAX_JSON_BYTES = 512 * 1024;

function snapItem(asset: Asset, folders: LibraryData["folders"]): SnapItem {
  const item: SnapItem = { n: asset.name };
  const key = asset.kind === "font" ? primaryFamily(asset.family) : asset.iconKey;
  if (key) item.k = key;
  if (asset.verdict) item.v = asset.verdict;
  const overall = roundedScore(overallScore(asset));
  if (overall) item.g = overall;
  const scores: Record<string, Score> = {};
  const notes: Record<string, string> = {};
  for (const def of criteriaFor(asset.kind)) {
    const entry = asset.criteria[def.id];
    if (entry?.value) scores[def.id] = entry.value;
    if (entry?.note) notes[def.id] = entry.note;
  }
  if (Object.keys(scores).length) item.c = scores;
  if (Object.keys(notes).length) item.o = notes;
  if (asset.tags.length) item.t = asset.tags;
  const paths = asset.folderIds
    .map((id) => folderPath(folders, id).join(" / "))
    .filter(Boolean)
    // A path that another one extends says nothing new: keep "Sans serif / Interface" only.
    .filter(
      (path, _, all) => !all.some((other) => other !== path && other.startsWith(`${path} / `)),
    );
  if (paths.length) item.p = paths;
  if (asset.kind === "icon" && asset.samples.length) item.s = asset.samples;
  if (asset.license) item.l = asset.license;
  if (asset.style) item.y = asset.style;
  if (asset.weights) item.w = asset.weights;
  if (asset.notes.trim()) item.x = asset.notes.trim();
  return item;
}

export function snapshotOf(
  library: Pick<LibraryData, "assets" | "folders">,
  now: string,
): Snapshot {
  const items = (kind: Asset["kind"]) =>
    library.assets
      .filter((asset) => asset.kind === kind)
      .map((asset) => snapItem(asset, library.folders));
  return { v: 1, em: now, fontes: items("font"), icones: items("icon") };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function readAll(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("snapshot too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function streamOf(bytes: Uint8Array<ArrayBuffer>): ReadableStream<BufferSource> {
  return new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

export async function encodeSnapshot(snapshot: Snapshot): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(snapshot));
  const compressed = streamOf(json).pipeThrough(new CompressionStream("deflate-raw"));
  return toBase64Url(await readAll(compressed, Number.POSITIVE_INFINITY));
}

function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<Snapshot>;
  const items = (list: unknown) =>
    Array.isArray(list) &&
    list.every((item) => item && typeof item === "object" && typeof item.n === "string");
  return snapshot.v === 1 && items(snapshot.fontes) && items(snapshot.icones);
}

/** The snapshot in a link, or null when the text is cut, tampered with or too large. */
export async function decodeSnapshot(text: string): Promise<Snapshot | null> {
  if (!text || text.length > MAX_ENCODED || !/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const inflated = streamOf(fromBase64Url(text)).pipeThrough(
      new DecompressionStream("deflate-raw"),
    );
    const json = new TextDecoder().decode(await readAll(inflated, MAX_JSON_BYTES));
    const value: unknown = JSON.parse(json);
    return isSnapshot(value) ? value : null;
  } catch {
    return null;
  }
}

/** The encoded snapshot from a pasted "Link para IA", or the bare value of its `b`. */
export function snapshotFromLink(link: string): string {
  const text = link.trim();
  if (/^[A-Za-z0-9_-]+$/.test(text)) return text;
  try {
    return new URL(text).searchParams.get("b") ?? "";
  } catch {
    return /[?&]b=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? "";
  }
}

const evaluated = (item: SnapItem) => Boolean(item.v || item.c);

/**
 * The encoded snapshot within `budget` characters. Over it, notes go first, then
 * items without any evaluation, then the remaining items from the end of the list.
 */
export async function fitSnapshot(
  library: Pick<LibraryData, "assets" | "folders">,
  now: string,
  budget = SNAPSHOT_BUDGET,
): Promise<{ encoded: string; trimmed: boolean }> {
  let snapshot = snapshotOf(library, now);
  let encoded = await encodeSnapshot(snapshot);
  if (encoded.length <= budget) return { encoded, trimmed: false };

  const map = (fn: (list: SnapItem[]) => SnapItem[]): Snapshot => ({
    ...snapshot,
    fontes: fn(snapshot.fontes),
    icones: fn(snapshot.icones),
    resumido: true,
  });
  const steps: ((list: SnapItem[]) => SnapItem[])[] = [
    (list) => list.map(({ x: _notes, o: _criterionNotes, ...rest }) => rest),
    (list) => list.filter(evaluated),
  ];
  for (const step of steps) {
    snapshot = map(step);
    encoded = await encodeSnapshot(snapshot);
    if (encoded.length <= budget) return { encoded, trimmed: true };
  }
  // Still too big: keep three quarters of each list until it fits.
  while (encoded.length > budget && snapshot.fontes.length + snapshot.icones.length > 0) {
    snapshot = map((list) => list.slice(0, Math.floor(list.length * 0.75)));
    encoded = await encodeSnapshot(snapshot);
  }
  return { encoded, trimmed: true };
}
