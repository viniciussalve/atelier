import { useEffect, useMemo } from "react";
import { fontAssetHref, primaryFamily } from "@/lib/library/fonts";
import { seedAssets } from "@/lib/library/seed";
import { useLibrary } from "@/lib/library/store";

/** Families the server already requests in the page head (`__root.tsx`). */
const IN_HEAD = new Set(
  seedAssets.filter((item) => item.kind === "font").map((item) => primaryFamily(item.family)),
);

/**
 * Adds one stylesheet link per href, once. Links are never removed: the browser
 * keeps the fonts cached and a later view may need them again.
 */
export function useFontLinks(hrefs: string[]) {
  const key = hrefs.join("\n");
  useEffect(() => {
    if (!key) return;
    const present = new Set(
      [...document.head.querySelectorAll("link[rel=stylesheet]")].map((link) =>
        link.getAttribute("href"),
      ),
    );
    for (const href of key.split("\n")) {
      if (present.has(href)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.append(link);
      present.add(href);
    }
  }, [key]);
}

/** Fonts added from the catalog load like the seeded ones. */
export function useLibraryFonts() {
  const assets = useLibrary((state) => state.assets);
  const hrefs = useMemo(
    () =>
      assets
        .filter((item) => item.kind === "font" && !IN_HEAD.has(primaryFamily(item.family)))
        .map(fontAssetHref),
    [assets],
  );
  useFontLinks(hrefs);
}
