// Mirrors the FastAPI job contract (see api/routes.py, api/jobs/*).

export type JobType = "scan" | "dork" | "dump";

export type JobStatus = "queued" | "running" | "done" | "error" | "cancelled";

export type Technique = "error" | "boolean" | "time" | "union";

export type InjectionContext =
  | "numeric"
  | "single_quote"
  | "double_quote"
  | "paren_single"
  | "paren_numeric";

export type DumpTechnique = "union" | "blind";

export interface Finding {
  param: string;
  context: string;
  technique: Technique;
  confidence: number;
  details?: unknown;
}

export interface ScanResult {
  url: string;
  findings: Finding[];
}

export interface DorkResult {
  urls: string[];
}

export interface DumpResult {
  db: string;
  table: string;
  columns: string[];
  rows: Array<Record<string, string>>;
  count: number;
}

export type JobResult = ScanResult | DorkResult | DumpResult | null;

export interface Job {
  id: number;
  type: JobType;
  status: JobStatus;
  progress: number;
  message: string;
  result: JobResult;
  error: string | null;
  params: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DorkLibrary {
  categories: Record<string, string[]>;
}

// ---- Job creation params ----

export interface ScanParams {
  url: string;
  contexts?: InjectionContext[];
}

export interface DorkParams {
  dorks: string[];
  pages?: number;
  searxng_url?: string;
}

export interface DumpParams {
  url: string;
  param: string;
  context: InjectionContext;
  technique: DumpTechnique;
  num_columns?: number;
  visible_index?: number;
  db: string;
  table: string;
  columns: string[];
  concurrency?: number;
}

export type JobParams = ScanParams | DorkParams | DumpParams;

// ---- Live stream events (WebSocket /api/jobs/{id}/stream) ----

export interface JobEvent {
  event: "status" | "progress" | "done" | "error" | "cancelled";
  status?: JobStatus;
  progress?: number;
  message?: string;
  result?: JobResult;
  error?: string;
}

// ---- Type guards on job results ----

export function isScanResult(r: JobResult): r is ScanResult {
  return !!r && "findings" in r;
}

export function isDorkResult(r: JobResult): r is DorkResult {
  return !!r && "urls" in r;
}

export function isDumpResult(r: JobResult): r is DumpResult {
  return !!r && "rows" in r;
}

// ---- Display metadata ----

export const INJECTION_CONTEXTS: { value: InjectionContext; label: string }[] = [
  { value: "numeric", label: "Numeric" },
  { value: "single_quote", label: "Single quote" },
  { value: "double_quote", label: "Double quote" },
  { value: "paren_single", label: "Paren + single" },
  { value: "paren_numeric", label: "Paren + numeric" },
];
