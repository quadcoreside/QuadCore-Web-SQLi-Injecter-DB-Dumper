import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Database, HardDriveDownload, Play } from "lucide-react";

import { api, ApiError } from "../lib/api";
import {
  INJECTION_CONTEXTS,
  isDumpResult,
  type DumpTechnique,
  type InjectionContext,
} from "../lib/types";
import { useJobStream } from "../hooks/useJobStream";
import { useCancelJob } from "../hooks/useJobs";
import { useStore } from "../store/store";
import { DataTable } from "../components/DataTable";
import { LiveJobCard } from "../components/LiveJobCard";
import { SchemaTree, tableKey } from "../components/SchemaTree";
import { EmptyState, ErrorBanner, PageHeader } from "../components/ui";

interface TargetForm {
  url: string;
  param: string;
  context: InjectionContext;
  technique: DumpTechnique;
  num_columns: string;
  visible_index: string;
  concurrency: string;
}

const EMPTY_TARGET: TargetForm = {
  url: "",
  param: "",
  context: "numeric",
  technique: "union",
  num_columns: "",
  visible_index: "",
  concurrency: "5",
};

export function DumperPage() {
  const { dumpTarget, schema, setSchema } = useStore();
  const cancel = useCancelJob();

  const [form, setForm] = useState<TargetForm>(EMPTY_TARGET);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);

  // Prefill from a target handed over by Scan / Analyse.
  useEffect(() => {
    if (dumpTarget) {
      setForm((f) => ({
        ...f,
        url: dumpTarget.url,
        param: dumpTarget.param,
        context: dumpTarget.context,
        technique: dumpTarget.technique,
        num_columns: dumpTarget.num_columns?.toString() ?? f.num_columns,
        visible_index: dumpTarget.visible_index?.toString() ?? f.visible_index,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dumpTarget?.url, dumpTarget?.param]);

  const live = useJobStream(jobId);
  const dumpResult = live?.result && isDumpResult(live.result) ? live.result : null;
  const running = live?.status === "running" || live?.status === "queued";

  // Resolve the active table + its selected columns from the schema tree.
  const active = useMemo(() => {
    for (const db of schema) {
      for (const table of db.tables) {
        if (tableKey(db.name, table.name) === activeKey) {
          return {
            db: db.name,
            table: table.name,
            columns: table.columns.filter((c) => c.selected).map((c) => c.name),
          };
        }
      }
    }
    return null;
  }, [schema, activeKey]);

  const set = <K extends keyof TargetForm>(key: K, value: TargetForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isUnion = form.technique === "union";
  const canLaunch =
    !!form.url.trim() &&
    !!form.param.trim() &&
    !!active &&
    active.columns.length > 0 &&
    (!isUnion || (form.num_columns !== "" && form.visible_index !== ""));

  const create = useMutation({
    mutationFn: () => {
      if (!active) throw new Error("Select a table with at least one column.");
      return api.createJob("dump", {
        url: form.url.trim(),
        param: form.param.trim(),
        context: form.context,
        technique: form.technique,
        db: active.db,
        table: active.table,
        columns: active.columns,
        concurrency: Number(form.concurrency) || 5,
        ...(isUnion
          ? {
              num_columns: Number(form.num_columns),
              visible_index: Number(form.visible_index),
            }
          : {}),
      });
    },
    onSuccess: ({ id }) => setJobId(id),
  });

  const displayColumns = dumpResult?.columns ?? active?.columns ?? [];
  const rows = dumpResult?.rows ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Extraction"
        title="Data dumper"
        subtitle="Map the schema, pick the columns, and stream records out of a confirmed injectable target."
        icon={<HardDriveDownload className="h-5 w-5" />}
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Injection config */}
        <section className="panel p-5">
          <h2 className="mb-4 font-display text-sm font-medium text-ink">
            Injection target
          </h2>

          <label className="label" htmlFor="dump-url">
            URL
          </label>
          <input
            id="dump-url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://example.com/product.php?id=1"
            className="input"
            spellCheck={false}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="dump-param">
                Parameter
              </label>
              <input
                id="dump-param"
                value={form.param}
                onChange={(e) => set("param", e.target.value)}
                placeholder="id"
                className="input"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="label" htmlFor="dump-context">
                Context
              </label>
              <select
                id="dump-context"
                value={form.context}
                onChange={(e) => set("context", e.target.value as InjectionContext)}
                className="input"
              >
                {INJECTION_CONTEXTS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <span className="label">Technique</span>
            <div className="grid grid-cols-2 gap-2">
              {(["union", "blind"] as DumpTechnique[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("technique", t)}
                  className={`rounded-lg border px-3 py-2 font-mono text-xs transition-all ${
                    form.technique === t
                      ? "border-accent/50 bg-accent/15 text-accent shadow-glow"
                      : "border-line bg-raised/50 text-muted hover:text-ink"
                  }`}
                >
                  {t === "union" ? "UNION (in-band)" : "Blind (boolean)"}
                </button>
              ))}
            </div>
          </div>

          {isUnion && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="dump-numcols">
                  Column count
                </label>
                <input
                  id="dump-numcols"
                  type="number"
                  min={1}
                  value={form.num_columns}
                  onChange={(e) => set("num_columns", e.target.value)}
                  placeholder="e.g. 7"
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="dump-visidx">
                  Visible index
                </label>
                <input
                  id="dump-visidx"
                  type="number"
                  min={0}
                  value={form.visible_index}
                  onChange={(e) => set("visible_index", e.target.value)}
                  placeholder="e.g. 2"
                  className="input"
                />
              </div>
            </div>
          )}

          <div className="mt-3 w-1/2 pr-1.5">
            <label className="label" htmlFor="dump-conc">
              Concurrency
            </label>
            <input
              id="dump-conc"
              type="number"
              min={1}
              max={50}
              value={form.concurrency}
              onChange={(e) => set("concurrency", e.target.value)}
              className="input"
            />
          </div>
        </section>

        {/* Schema tree */}
        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" />
            <h2 className="font-display text-sm font-medium text-ink">Schema</h2>
            <span className="ml-auto font-mono text-[11px] text-faint">
              persisted locally
            </span>
          </div>
          <SchemaTree
            schema={schema}
            setSchema={setSchema}
            activeKey={activeKey}
            setActiveKey={setActiveKey}
          />
        </section>
      </div>

      {/* Launch bar */}
      <div className="mt-5 flex flex-col gap-3">
        {create.isError && (
          <ErrorBanner
            message={
              create.error instanceof ApiError
                ? create.error.message
                : create.error instanceof Error
                  ? create.error.message
                  : "Failed to start dump"
            }
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 panel px-4 py-3">
          <div className="font-mono text-xs text-muted">
            {active ? (
              <>
                Target:{" "}
                <span className="text-accent">
                  {active.db}.{active.table}
                </span>{" "}
                · {active.columns.length} column{active.columns.length === 1 ? "" : "s"}
              </>
            ) : (
              <span className="text-faint">Select a table in the schema to dump.</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canLaunch || create.isPending}
            onClick={() => create.mutate()}
          >
            <Play className="h-4 w-4" />
            {create.isPending ? "Launching…" : "Start dump"}
          </button>
        </div>
      </div>

      {/* Live job */}
      {jobId != null && (
        <div className="mt-5">
          <LiveJobCard
            jobId={jobId}
            live={live}
            title={active ? `${active.db}.${active.table}` : "Dump"}
            onCancel={(id) => cancel.mutate(id)}
            cancelling={cancel.isPending}
          />
        </div>
      )}

      {/* Rows */}
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">
            Extracted rows
            {dumpResult && (
              <span className="ml-2 font-mono text-sm font-normal text-muted">
                {dumpResult.count} record{dumpResult.count === 1 ? "" : "s"}
              </span>
            )}
          </h2>
        </div>

        {jobId == null ? (
          <EmptyState
            icon={<HardDriveDownload className="h-8 w-8" />}
            title="No dump running"
            hint="Configure the injection target, map a table, tick the columns to extract, then start a dump. Rows stream in here with search and export."
          />
        ) : (
          <DataTable
            columns={displayColumns}
            rows={rows}
            filenameBase={active ? `${active.db}.${active.table}` : "dump"}
            live={running}
          />
        )}
      </section>
    </div>
  );
}
