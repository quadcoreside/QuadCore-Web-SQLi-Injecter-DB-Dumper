import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crosshair, HardDriveDownload, Microscope, Play } from "lucide-react";

import { api, ApiError } from "../lib/api";
import { TECHNIQUE_META, confidenceTone } from "../lib/format";
import {
  INJECTION_CONTEXTS,
  isScanResult,
  type Finding,
  type InjectionContext,
} from "../lib/types";
import { useJobStream } from "../hooks/useJobStream";
import { useCancelJob } from "../hooks/useJobs";
import { useStore, type DumpTarget } from "../store/store";
import { LiveJobCard } from "../components/LiveJobCard";
import { MultiSelect } from "../components/MultiSelect";
import { EmptyState, ErrorBanner, PageHeader, Tag } from "../components/ui";

export function AnalysePage() {
  const navigate = useNavigate();
  const { setDumpTarget } = useStore();
  const cancel = useCancelJob();

  const [url, setUrl] = useState("");
  const [contexts, setContexts] = useState<InjectionContext[]>([]);
  const [jobId, setJobId] = useState<number | null>(null);

  const live = useJobStream(jobId);
  const create = useMutation({
    mutationFn: () =>
      api.createJob("scan", {
        url: url.trim(),
        ...(contexts.length ? { contexts } : {}),
      }),
    onSuccess: ({ id }) => setJobId(id),
  });

  const result = live?.result && isScanResult(live.result) ? live.result : null;
  const done = live?.status === "done";

  // Group findings by parameter.
  const byParam = useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of result?.findings ?? []) {
      const list = map.get(f.param) ?? [];
      list.push(f);
      map.set(f.param, list);
    }
    return [...map.entries()];
  }, [result]);

  const dbms = useMemo(() => detectDbms(result?.findings ?? []), [result]);
  const topConfidence = Math.max(0, ...(result?.findings ?? []).map((f) => f.confidence));

  const sendToDumper = (param: string, findings: Finding[]) => {
    const best = [...findings].sort((a, b) => b.confidence - a.confidence)[0];
    const details = (best.details ?? {}) as Record<string, unknown>;
    const target: DumpTarget = {
      url: result?.url ?? url.trim(),
      param,
      context: best.context as InjectionContext,
      technique: best.technique === "union" ? "union" : "blind",
      num_columns:
        typeof details.num_columns === "number" ? details.num_columns : undefined,
      visible_index:
        typeof details.visible_index === "number" ? details.visible_index : undefined,
    };
    setDumpTarget(target);
    navigate("/dumper");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Deep analysis"
        title="Analyse a target"
        subtitle="Run a focused scan on one URL and inspect every detected injection point in detail."
        icon={<Microscope className="h-5 w-5" />}
      />

      <section className="panel p-5">
        <label className="label" htmlFor="analyse-url">
          Target URL
        </label>
        <input
          id="analyse-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/view.php?id=1&cat=3"
          className="input"
          spellCheck={false}
        />

        <div className="mt-4">
          <span className="label">Injection contexts</span>
          <MultiSelect
            options={INJECTION_CONTEXTS}
            selected={contexts}
            onChange={setContexts}
          />
        </div>

        {create.isError && (
          <div className="mt-4">
            <ErrorBanner
              message={
                create.error instanceof ApiError
                  ? create.error.message
                  : "Failed to start analysis"
              }
            />
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!url.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            <Play className="h-4 w-4" />
            {create.isPending ? "Launching…" : "Analyse"}
          </button>
        </div>
      </section>

      {jobId != null && (
        <div className="mt-5">
          <LiveJobCard
            jobId={jobId}
            live={live}
            title={result?.url ?? url}
            onCancel={(id) => cancel.mutate(id)}
            cancelling={cancel.isPending}
          />
        </div>
      )}

      {done && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-5"
        >
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Injection points" value={String(byParam.length)} />
            <Stat label="Findings" value={String(result.findings.length)} />
            <Stat
              label="Top confidence"
              value={`${Math.round(topConfidence * 100)}%`}
              tone={confidenceTone(topConfidence)}
            />
            <Stat label="Likely DBMS" value={dbms ?? "unknown"} mono />
          </div>

          {byParam.length === 0 ? (
            <EmptyState
              icon={<Crosshair className="h-8 w-8" />}
              title="No injectable parameters found"
              hint="The engine did not confirm any technique on this URL. Try adding more contexts or verify the target is in scope."
            />
          ) : (
            <div className="space-y-4">
              {byParam.map(([param, findings]) => (
                <ParamPanel
                  key={param}
                  param={param}
                  findings={findings}
                  onSendToDumper={() => sendToDumper(param, findings)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ParamPanel({
  param,
  findings,
  onSendToDumper,
}: {
  param: string;
  findings: Finding[];
  onSendToDumper: () => void;
}) {
  const best = [...findings].sort((a, b) => b.confidence - a.confidence)[0];
  const tone = confidenceTone(best.confidence);
  const details = (best.details ?? {}) as Record<string, unknown>;
  const detailEntries = Object.entries(details).filter(
    ([, v]) => typeof v !== "object",
  );

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <Crosshair className={`h-4 w-4 ${tone === "danger" ? "text-danger" : "text-accent"}`} />
          <div>
            <div className="font-mono text-sm text-accent">{param}</div>
            <div className="font-mono text-[11px] text-faint">context: {best.context}</div>
          </div>
        </div>
        <button type="button" className="btn btn-primary text-xs" onClick={onSendToDumper}>
          <HardDriveDownload className="h-3.5 w-3.5" />
          Configure dump
        </button>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <div className="label">Techniques</div>
          <div className="flex flex-wrap gap-2">
            {findings.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-line bg-raised/50 px-2.5 py-1.5"
              >
                <Tag tone="accent">{TECHNIQUE_META[f.technique]?.label ?? f.technique}</Tag>
                <span className="font-mono text-[11px] text-muted">
                  {Math.round(f.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Signals</div>
          {detailEntries.length === 0 ? (
            <p className="font-mono text-xs text-faint">No extra signals reported.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-2">
              {detailEntries.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-md border border-line bg-raised/40 px-2.5 py-1.5"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-faint">
                    {k}
                  </dt>
                  <dd className="font-mono text-xs text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "danger" | "muted";
  mono?: boolean;
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-warn"
        : tone === "good"
          ? "text-good"
          : "text-ink";
  return (
    <div className="panel px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1 ${mono ? "font-mono text-lg" : "font-display text-2xl font-bold"} ${color}`}
      >
        {value}
      </div>
    </div>
  );
}

/** Best-effort DBMS hint pulled from finding details. */
function detectDbms(findings: Finding[]): string | null {
  for (const f of findings) {
    const details = f.details;
    if (details && typeof details === "object") {
      const d = details as Record<string, unknown>;
      if (typeof d.dbms === "string") return d.dbms;
    }
    const text = JSON.stringify(f.details ?? "").toLowerCase();
    if (text.includes("mysql")) return "MySQL";
    if (text.includes("mariadb")) return "MariaDB";
    if (text.includes("postgres")) return "PostgreSQL";
    if (text.includes("mssql") || text.includes("sql server")) return "MSSQL";
    if (text.includes("sqlite")) return "SQLite";
    if (text.includes("oracle")) return "Oracle";
  }
  return null;
}
