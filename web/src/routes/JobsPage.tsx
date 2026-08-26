import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Database,
  Radar,
  ScrollText,
  Search,
  X,
} from "lucide-react";

import { relativeTime } from "../lib/format";
import {
  isDorkResult,
  isDumpResult,
  isScanResult,
  type Job,
  type JobStatus,
  type JobType,
} from "../lib/types";
import { useJobStream } from "../hooks/useJobStream";
import { useCancelJob, useJobs } from "../hooks/useJobs";
import { EmptyState, ErrorBanner, PageHeader, ProgressBar, StatusPill } from "../components/ui";

const TYPE_META: Record<JobType, { icon: LucideIcon; label: string }> = {
  scan: { icon: Radar, label: "Scan" },
  dork: { icon: Search, label: "Dork" },
  dump: { icon: Database, label: "Dump" },
};

const FILTERS: { value: JobStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "done", label: "Done" },
  { value: "error", label: "Error" },
  { value: "cancelled", label: "Cancelled" },
];

export function JobsPage() {
  const { data: jobs, isLoading, isError } = useJobs({ refetchMs: 2500 });
  const cancel = useCancelJob();
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  const filtered = (jobs ?? []).filter((j) => filter === "all" || j.status === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Monitor"
        title="Background jobs"
        subtitle="Every scan, dork and dump the console has launched — with live progress and cancellation."
        icon={<ScrollText className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                  filter === f.value
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : "border-line bg-raised/50 text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {isError && <ErrorBanner message="Could not load jobs. Is the API reachable?" />}
      {isLoading && <p className="font-mono text-xs text-faint">Loading jobs…</p>}

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" />}
          title={jobs?.length ? "No jobs match this filter" : "No jobs yet"}
          hint="Launch a dork search, scan or dump — it will appear here with a live progress feed."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onCancel={(id) => cancel.mutate(id)}
              cancelling={cancel.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobRow({
  job,
  onCancel,
  cancelling,
}: {
  job: Job;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const running = job.status === "running" || job.status === "queued";
  // Subscribe to the live stream only while the job is active for smooth updates.
  const live = useJobStream(running ? job.id : null);

  const status = live?.status ?? job.status;
  const progress = running ? (live?.progress ?? job.progress) : job.progress;
  const message = (running ? live?.message : job.message) || job.message;
  const meta = TYPE_META[job.type];
  const Icon = meta?.icon ?? ScrollText;
  const isRunning = status === "running" || status === "queued";
  const tone =
    status === "error"
      ? "danger"
      : status === "done"
        ? "good"
        : isRunning
          ? "warn"
          : "accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-raised/60 text-accent">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-medium text-ink">
              {meta?.label ?? job.type}
            </span>
            <span className="chip !py-0.5 text-[10px]">#{job.id}</span>
            <span className="font-mono text-[11px] text-faint">
              {relativeTime(job.updated_at)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={progress} active={isRunning} tone={tone} />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted">
              {progress.toFixed(0)}%
            </span>
          </div>
          {message && (
            <div className="mt-1 truncate font-mono text-[11px] text-faint">{message}</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          {isRunning && (
            <button
              type="button"
              className="btn btn-danger !px-2 !py-1 text-xs"
              disabled={cancelling}
              onClick={() => onCancel(job.id)}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle details"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="grid gap-3 border-t border-line bg-raised/20 px-4 py-3 md:grid-cols-2">
          <div>
            <div className="label">Params</div>
            <pre className="max-h-40 overflow-auto rounded-md border border-line bg-bg/60 p-2.5 font-mono text-[11px] text-muted">
              {JSON.stringify(job.params, null, 2)}
            </pre>
          </div>
          <div>
            <div className="label">Result</div>
            <ResultSummary job={job} />
            {job.error && (
              <div className="mt-2 break-all rounded-md border border-danger/40 bg-danger/10 p-2 font-mono text-[11px] text-danger">
                {job.error}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ResultSummary({ job }: { job: Job }) {
  const r = job.result;
  if (!r)
    return <p className="font-mono text-[11px] text-faint">No result yet.</p>;
  if (isDorkResult(r))
    return (
      <p className="font-mono text-xs text-ink">
        <span className="text-accent">{r.urls.length}</span> candidate URLs
      </p>
    );
  if (isScanResult(r))
    return (
      <p className="font-mono text-xs text-ink">
        <span className="text-accent">{r.findings.length}</span> findings on{" "}
        <span className="text-muted">{r.url}</span>
      </p>
    );
  if (isDumpResult(r))
    return (
      <p className="font-mono text-xs text-ink">
        <span className="text-accent">{r.count}</span> rows from{" "}
        <span className="text-muted">
          {r.db}.{r.table}
        </span>{" "}
        ({r.columns.length} cols)
      </p>
    );
  return <p className="font-mono text-[11px] text-faint">Completed.</p>;
}
