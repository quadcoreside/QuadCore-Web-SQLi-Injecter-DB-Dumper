import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Play, Radar } from "lucide-react";

import { api, ApiError } from "../lib/api";
import { linesToList } from "../lib/format";
import {
  INJECTION_CONTEXTS,
  isScanResult,
  type InjectionContext,
} from "../lib/types";
import { useJobStream } from "../hooks/useJobStream";
import { useCancelJob } from "../hooks/useJobs";
import { useStore, type DumpTarget } from "../store/store";
import { FindingsTable } from "../components/FindingsTable";
import { LiveJobCard } from "../components/LiveJobCard";
import { MultiSelect } from "../components/MultiSelect";
import { EmptyState, ErrorBanner, PageHeader } from "../components/ui";

interface ScanEntry {
  jobId: number;
  url: string;
}

export function ScanPage() {
  const navigate = useNavigate();
  const { candidates, setCandidates, setDumpTarget } = useStore();
  const cancel = useCancelJob();

  const [urlsText, setUrlsText] = useState("");
  const [contexts, setContexts] = useState<InjectionContext[]>([]);
  const [entries, setEntries] = useState<ScanEntry[]>([]);

  // Consume candidate URLs handed over from the Dorks page.
  useEffect(() => {
    if (candidates.length) {
      setUrlsText((prev) => {
        const merged = [...linesToList(prev), ...candidates];
        return Array.from(new Set(merged)).join("\n");
      });
      setCandidates([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useMutation({
    mutationFn: async (urls: string[]) => {
      const created: ScanEntry[] = [];
      for (const url of urls) {
        const { id } = await api.createJob("scan", {
          url,
          ...(contexts.length ? { contexts } : {}),
        });
        created.push({ jobId: id, url });
      }
      return created;
    },
    onSuccess: (created) => setEntries((prev) => [...created, ...prev]),
  });

  const urlList = linesToList(urlsText);

  const sendToDumper = (t: DumpTarget) => {
    setDumpTarget(t);
    navigate("/dumper");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Detection"
        title="Scan targets"
        subtitle="Probe each parameter for error, boolean, time and UNION injection. Launch one URL or a whole batch."
        icon={<Radar className="h-5 w-5" />}
      />

      <section className="panel p-5">
        <label className="label" htmlFor="targets">
          Target URLs — one per line
        </label>
        <textarea
          id="targets"
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder="https://example.com/product.php?id=1"
          rows={5}
          className="input resize-y"
          spellCheck={false}
        />

        <div className="mt-4">
          <span className="label">Injection contexts</span>
          <MultiSelect
            options={INJECTION_CONTEXTS}
            selected={contexts}
            onChange={setContexts}
          />
          <p className="mt-1.5 font-mono text-[11px] text-faint">
            Leave empty to let the engine test every context automatically.
          </p>
        </div>

        {create.isError && (
          <div className="mt-4">
            <ErrorBanner
              message={
                create.error instanceof ApiError
                  ? create.error.message
                  : "Failed to launch scan"
              }
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-faint">
            {urlList.length} target{urlList.length === 1 ? "" : "s"}
            {contexts.length ? ` · ${contexts.length} contexts` : " · all contexts"}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!urlList.length || create.isPending}
            onClick={() => create.mutate(urlList)}
          >
            <Play className="h-4 w-4" />
            {create.isPending
              ? "Launching…"
              : `Scan ${urlList.length || ""} target${urlList.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {entries.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="No scans running"
            hint="Paste targets above (or arrive here from a dork search) and launch a scan. Live progress and findings will stream in below."
          />
        ) : (
          entries.map((entry) => (
            <ScanJobRow
              key={entry.jobId}
              entry={entry}
              onCancel={(id) => cancel.mutate(id)}
              cancelling={cancel.isPending}
              onSendToDumper={sendToDumper}
            />
          ))
        )}
      </section>
    </div>
  );
}

function ScanJobRow({
  entry,
  onCancel,
  cancelling,
  onSendToDumper,
}: {
  entry: ScanEntry;
  onCancel: (id: number) => void;
  cancelling: boolean;
  onSendToDumper: (t: DumpTarget) => void;
}) {
  const live = useJobStream(entry.jobId);
  const findings = useMemo(
    () => (live?.result && isScanResult(live.result) ? live.result.findings : []),
    [live?.result],
  );
  const done = live?.status === "done";

  return (
    <div className="space-y-2">
      <LiveJobCard
        jobId={entry.jobId}
        live={live}
        title={entry.url}
        onCancel={onCancel}
        cancelling={cancelling}
      />
      {done && (
        <div className="pl-1">
          <FindingsTable
            url={entry.url}
            findings={findings}
            onSendToDumper={onSendToDumper}
          />
        </div>
      )}
    </div>
  );
}
