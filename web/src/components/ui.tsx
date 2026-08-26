import type { ReactNode } from "react";

import type { JobStatus } from "../lib/types";
import { STATUS_META } from "../lib/format";

const TONE_CLASS: Record<string, string> = {
  accent: "border-accent/40 bg-accent/10 text-accent",
  warn: "border-warn/40 bg-warn/10 text-warn",
  danger: "border-danger/40 bg-danger/10 text-danger",
  good: "border-good/40 bg-good/10 text-good",
  muted: "border-line bg-raised/60 text-muted",
};

export function StatusPill({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status];
  const isRunning = status === "running";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${TONE_CLASS[meta.tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          meta.tone === "accent"
            ? "bg-accent"
            : meta.tone === "warn"
              ? "bg-warn"
              : meta.tone === "danger"
                ? "bg-danger"
                : meta.tone === "good"
                  ? "bg-good"
                  : "bg-muted"
        } ${isRunning ? "animate-blink" : ""}`}
      />
      {meta.label}
    </span>
  );
}

export function Tag({
  tone = "muted",
  children,
}: {
  tone?: "accent" | "warn" | "danger" | "good" | "muted";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[11px] ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  active?: boolean;
  tone?: "accent" | "warn" | "danger" | "good";
}

/** Progress bar with a shimmer sweep while the job is running. */
export function ProgressBar({ value, active = false, tone = "accent" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill =
    tone === "warn"
      ? "bg-warn"
      : tone === "danger"
        ? "bg-danger"
        : tone === "good"
          ? "bg-good"
          : "bg-accent";
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full border border-line bg-raised/60">
      <div
        className={`relative h-full rounded-full ${fill} transition-[width] duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      >
        {active && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 -left-1/3 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-line bg-surface/50 px-5 py-5 shadow-panel sm:px-6">
      <div className="pointer-events-none absolute inset-0 animate-grid-pan grid-backdrop opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 -top-1/2 h-[200%]">
        <div className="mx-auto h-px w-full max-w-4xl animate-scan bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </div>
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
              {icon}
            </div>
          )}
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface/30 px-6 py-14 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <div className="font-display text-sm font-medium text-muted">{title}</div>
      {hint && <div className="max-w-sm text-xs text-faint">{hint}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
      <span className="mt-0.5 shrink-0">!</span>
      <span className="break-all">{message}</span>
    </div>
  );
}
