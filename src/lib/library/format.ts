/** Local date and time as "2026/10/19 14:05", or a dash when unreadable. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The address when it can open in a new tab: http or https only, never an app path or script. */
export function externalLink(url: string): string | null {
  return /^https?:\/\//i.test(url) ? url : null;
}
