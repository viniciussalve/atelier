import { libraryBrief } from "@/lib/ai/brief";
import { aiLinkUrl, appBase } from "@/lib/ai/links";
import { fitSnapshot, snapshotOf } from "@/lib/ai/snapshot";
import { useLibrary } from "@/lib/library/store";

/**
 * The "Link para IA" for the library as it is now: `/ia?b=<snapshot>`. Built on
 * each copy, so it has the latest change; pass the promise straight to
 * `copyText` inside the click.
 */
export async function buildAiLink(): Promise<string> {
  const { encoded } = await fitSnapshot(useLibrary.getState(), new Date().toISOString());
  return aiLinkUrl(window.location, encoded);
}

/** The same brief as text, for an AI that cannot open links. */
export async function buildAiContext(): Promise<string> {
  const snapshot = snapshotOf(useLibrary.getState(), new Date().toISOString());
  return libraryBrief(snapshot, appBase(window.location));
}
