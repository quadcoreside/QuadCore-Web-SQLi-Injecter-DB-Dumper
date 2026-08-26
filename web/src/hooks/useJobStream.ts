import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { api, jobStreamUrl } from "../lib/api";
import type { JobEvent, JobResult, JobStatus } from "../lib/types";

export interface LiveJob {
  status: JobStatus;
  progress: number;
  message: string;
  result: JobResult;
  error: string | null;
  /** Transport currently feeding updates. */
  transport: "connecting" | "ws" | "polling" | "closed";
}

const TERMINAL: JobStatus[] = ["done", "error", "cancelled"];

/**
 * Live view of a single job. Opens a WebSocket to /api/jobs/{id}/stream and
 * falls back to polling GET /api/jobs/{id} if the socket errors or drops before
 * the job reaches a terminal state.
 */
export function useJobStream(jobId: number | null): LiveJob | null {
  const qc = useQueryClient();
  const [live, setLive] = useState<LiveJob | null>(null);
  const liveRef = useRef<LiveJob | null>(null);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  useEffect(() => {
    if (jobId == null) {
      setLive(null);
      return;
    }

    let ws: WebSocket | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;
    let terminal = false;

    const patch = (p: Partial<LiveJob>) =>
      setLive((prev) => {
        const base: LiveJob = prev ?? {
          status: "queued",
          progress: 0,
          message: "",
          result: null,
          error: null,
          transport: "connecting",
        };
        return { ...base, ...p };
      });

    const finish = () => {
      terminal = true;
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startPolling = () => {
      if (pollTimer || terminal || disposed) return;
      patch({ transport: "polling" });
      const tick = async () => {
        try {
          const job = await api.getJob(jobId);
          patch({
            status: job.status,
            progress: job.progress,
            message: job.message,
            result: job.result,
            error: job.error,
          });
          if (TERMINAL.includes(job.status)) {
            finish();
            stopPolling();
          }
        } catch {
          /* keep polling — transient network error */
        }
      };
      void tick();
      pollTimer = setInterval(tick, 1500);
    };

    // Seed immediately so the panel shows current state before events arrive.
    api
      .getJob(jobId)
      .then((job) => {
        if (disposed) return;
        patch({
          status: job.status,
          progress: job.progress,
          message: job.message,
          result: job.result,
          error: job.error,
        });
        if (TERMINAL.includes(job.status)) {
          finish();
          patch({ transport: "closed" });
        }
      })
      .catch(() => {
        /* the socket / poller will retry */
      });

    try {
      ws = new WebSocket(jobStreamUrl(jobId));
      ws.onopen = () => {
        if (!terminal) patch({ transport: "ws" });
      };
      ws.onmessage = (ev) => {
        let data: JobEvent;
        try {
          data = JSON.parse(ev.data) as JobEvent;
        } catch {
          return;
        }
        switch (data.event) {
          case "status":
            patch({ status: data.status ?? "running" });
            break;
          case "progress":
            patch({
              status: "running",
              progress: data.progress ?? liveRef.current?.progress ?? 0,
              message: data.message ?? "",
            });
            break;
          case "done":
            patch({ status: "done", progress: 100, result: data.result ?? null });
            finish();
            break;
          case "error":
            patch({ status: "error", error: data.error ?? "Job failed" });
            finish();
            break;
          case "cancelled":
            patch({ status: "cancelled" });
            finish();
            break;
        }
      };
      ws.onerror = () => {
        if (!terminal) startPolling();
      };
      ws.onclose = () => {
        if (disposed) return;
        if (!terminal) startPolling();
        else patch({ transport: "closed" });
      };
    } catch {
      startPolling();
    }

    return () => {
      disposed = true;
      stopPolling();
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      }
    };
  }, [jobId, qc]);

  return live;
}
