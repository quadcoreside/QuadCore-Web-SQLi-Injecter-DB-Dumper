import { motion } from "framer-motion";
import { Radio, Wifi, WifiOff, X } from "lucide-react";

import type { LiveJob } from "../hooks/useJobStream";
import { ProgressBar, StatusPill } from "./ui";

interface LiveJobCardProps {
  jobId: number;
  live: LiveJob | null;
  title: string;
  onCancel?: (id: number) => void;
  cancelling?: boolean;
}

/** Reusable live-status panel for a single running/finished job. */
export function LiveJobCard({ jobId, live, title, onCancel, cancelling }: LiveJobCardProps) {
  const status = live?.status ?? "queued";
  const progress = live?.progress ?? 0;
  const running = status === "running" || status === "queued";
  const tone =
    status === "error" ? "danger" : status === "done" ? "good" : running ? "warn" : "accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Radio
            className={`h-4 w-4 ${running ? "animate-pulse-ring text-warn" : "text-accent"}`}
          />
          <span className="font-display text-sm font-medium text-ink">{title}</span>
          <span className="chip !py-0.5 text-[11px]">#{jobId}</span>
        </div>
        <div className="flex items-center gap-2">
          <TransportBadge transport={live?.transport} />
          <StatusPill status={status} />
          {onCancel && running && (
            <button
              type="button"
              className="btn btn-danger !px-2 !py-1 text-xs"
              disabled={cancelling}
              onClick={() => onCancel(jobId)}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={progress} active={running} tone={tone} />
        </div>
        <span className="w-14 text-right font-mono text-xs tabular-nums text-muted">
          {progress.toFixed(0)}%
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-faint">
          {live?.message || (running ? "working…" : " ")}
        </span>
      </div>

      {live?.error && (
        <div className="mt-2 break-all rounded-md border border-danger/40 bg-danger/10 px-2 py-1 font-mono text-xs text-danger">
          {live.error}
        </div>
      )}
    </motion.div>
  );
}

function TransportBadge({ transport }: { transport?: LiveJob["transport"] }) {
  if (!transport || transport === "closed") return null;
  if (transport === "ws")
    return (
      <span className="chip !py-0.5 text-good" title="Live via WebSocket">
        <Wifi className="h-3 w-3" /> live
      </span>
    );
  if (transport === "polling")
    return (
      <span className="chip !py-0.5 text-warn" title="WebSocket dropped — polling">
        <WifiOff className="h-3 w-3" /> poll
      </span>
    );
  return (
    <span className="chip !py-0.5" title="Connecting to stream">
      connecting…
    </span>
  );
}
