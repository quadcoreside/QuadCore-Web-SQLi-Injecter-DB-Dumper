import type {
  DorkLibrary,
  DumpParams,
  DorkParams,
  Job,
  JobType,
  ScanParams,
} from "./types";

const TOKEN_KEY = "qcsqli.token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function headers(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const token = getToken();
  if (token) h["X-Token"] = token;
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

type CreateParamsFor<T extends JobType> = T extends "scan"
  ? ScanParams
  : T extends "dork"
    ? DorkParams
    : DumpParams;

export const api = {
  async createJob<T extends JobType>(
    type: T,
    params: CreateParamsFor<T>,
  ): Promise<{ id: number }> {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ type, params }),
    });
    return handle<{ id: number }>(res);
  },

  async listJobs(): Promise<Job[]> {
    const res = await fetch("/api/jobs", { headers: headers() });
    return handle<Job[]>(res);
  },

  async getJob(id: number): Promise<Job> {
    const res = await fetch(`/api/jobs/${id}`, { headers: headers() });
    return handle<Job>(res);
  },

  async cancelJob(id: number): Promise<{ cancelled: boolean }> {
    const res = await fetch(`/api/jobs/${id}/cancel`, {
      method: "POST",
      headers: headers(),
    });
    return handle<{ cancelled: boolean }>(res);
  },

  async dorkLibrary(): Promise<DorkLibrary> {
    const res = await fetch("/api/dorks/library", { headers: headers() });
    return handle<DorkLibrary>(res);
  },
};

/** Same-origin WebSocket URL for a job's live stream. */
export function jobStreamUrl(id: number): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/jobs/${id}/stream`;
}
