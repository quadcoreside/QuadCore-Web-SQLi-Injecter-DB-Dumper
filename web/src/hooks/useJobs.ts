import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";
import type { Job } from "../lib/types";

/** Poll the full jobs list. Refetches often so the monitor feels live. */
export function useJobs(options?: { refetchMs?: number }) {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: api.listJobs,
    refetchInterval: options?.refetchMs ?? 3000,
  });
}

export function useJob(id: number | null) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id as number),
    enabled: id != null,
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.cancelJob(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", id] });
    },
  });
}

/** Convenience: count of jobs currently running or queued (drives the reactor). */
export function activeJobCount(jobs: Job[] | undefined): number {
  if (!jobs) return 0;
  return jobs.filter((j) => j.status === "running" || j.status === "queued").length;
}
