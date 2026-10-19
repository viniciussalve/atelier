import { useEffect, useState } from "react";
import { libraryBrief } from "@/lib/ai/brief";
import { appBase, appUrl } from "@/lib/ai/links";
import { fitSnapshot, snapshotOf } from "@/lib/ai/snapshot";
import { useLibrary } from "@/lib/library/store";

/** The "Link para IA" for the current library: `/ia?b=<snapshot>`. */
export async function buildAiLink(): Promise<string> {
  const { encoded } = await fitSnapshot(useLibrary.getState(), new Date().toISOString());
  return appUrl(window.location, `/ia?b=${encoded}`);
}

/**
 * The link, kept up to date as the library changes, so a click can copy it at
 * once: some browsers only allow copying right inside the click. Empty until the
 * first build.
 */
export function useAiLink(): string {
  const assets = useLibrary((state) => state.assets);
  const folders = useLibrary((state) => state.folders);
  const [link, setLink] = useState("");
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      void buildAiLink().then((next) => alive && setLink(next));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [assets, folders]);
  return link;
}

/** The same brief as text, for an AI that cannot open links. */
export function aiContextText(): string {
  const snapshot = snapshotOf(useLibrary.getState(), new Date().toISOString());
  return libraryBrief(snapshot, appBase(window.location));
}
