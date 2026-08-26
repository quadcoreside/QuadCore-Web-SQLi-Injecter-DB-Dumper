import type { JobStatus, Technique } from "./types";

/** Parse a textarea into a clean list of non-empty trimmed lines. */
export function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Parse comma/whitespace separated column names. */
export function parseColumns(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function relativeTime(iso: string): string {
  const then = Date.parse(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  if (Number.isNaN(then)) return iso;
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const STATUS_META: Record<
  JobStatus,
  { label: string; tone: "accent" | "warn" | "danger" | "good" | "muted" }
> = {
  queued: { label: "Queued", tone: "muted" },
  running: { label: "Running", tone: "warn" },
  done: { label: "Done", tone: "good" },
  error: { label: "Error", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export const TECHNIQUE_META: Record<Technique, { label: string; hint: string }> = {
  error: { label: "Error-based", hint: "DBMS error surfaced in response" },
  boolean: { label: "Boolean-blind", hint: "True/false differential" },
  time: { label: "Time-blind", hint: "Response-delay oracle" },
  union: { label: "UNION", hint: "In-band column reflection" },
};

export function confidenceTone(c: number): "good" | "warn" | "danger" | "muted" {
  if (c >= 0.85) return "danger";
  if (c >= 0.6) return "warn";
  if (c > 0) return "good";
  return "muted";
}

/** Download helper — creates a blob and triggers a save. */
function download(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCsv(
  filename: string,
  columns: string[],
  rows: Array<Record<string, string>>,
): void {
  const header = columns.map(csvCell).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")).join("\n");
  download(filename, "text/csv;charset=utf-8", `${header}\n${body}`);
}

export function exportJson(filename: string, data: unknown): void {
  download(filename, "application/json", JSON.stringify(data, null, 2));
}

export function detailsToText(details: unknown): string {
  if (details == null) return "";
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}
