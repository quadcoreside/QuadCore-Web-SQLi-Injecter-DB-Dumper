import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Library, Play, Plus, Search, Send } from "lucide-react";

import { api, ApiError } from "../lib/api";
import { linesToList } from "../lib/format";
import { isDorkResult } from "../lib/types";
import { useJobStream } from "../hooks/useJobStream";
import { useCancelJob } from "../hooks/useJobs";
import { useStore } from "../store/store";
import { CopyButton } from "../components/CopyButton";
import { LiveJobCard } from "../components/LiveJobCard";
import { EmptyState, ErrorBanner, PageHeader } from "../components/ui";

export function DorksPage() {
  const navigate = useNavigate();
  const { setCandidates } = useStore();
  const cancel = useCancelJob();

  const [dorksText, setDorksText] = useState("");
  const [pages, setPages] = useState(1);
  const [searxng, setSearxng] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const library = useQuery({ queryKey: ["dorks-library"], queryFn: api.dorkLibrary });
  const live = useJobStream(jobId);

  const create = useMutation({
    mutationFn: () =>
      api.createJob("dork", {
        dorks: linesToList(dorksText),
        pages,
        ...(searxng.trim() ? { searxng_url: searxng.trim() } : {}),
      }),
    onSuccess: ({ id }) => {
      setSelected(new Set());
      setJobId(id);
    },
  });

  const dorkList = linesToList(dorksText);
  const urls = useMemo(
    () => (live?.result && isDorkResult(live.result) ? live.result.urls : []),
    [live?.result],
  );

  const addDork = (dork: string) => {
    if (dorkList.includes(dork)) return;
    setDorksText((prev) => (prev.trim() ? `${prev.trim()}\n${dork}` : dork));
  };

  const toggleUrl = (url: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const sendToScan = (targets: string[]) => {
    if (!targets.length) return;
    setCandidates(targets);
    navigate("/scan");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Discovery"
        title="Dork search"
        subtitle="Query SearXNG with dork templates to surface parameterized URLs worth probing."
        icon={<Search className="h-5 w-5" />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Form */}
        <section className="panel p-5">
          <label className="label" htmlFor="dorks">
            Dork queries — one per line
          </label>
          <textarea
            id="dorks"
            value={dorksText}
            onChange={(e) => setDorksText(e.target.value)}
            placeholder={'inurl:product.php?id=\ninurl:news.php?id= site:example.com'}
            rows={7}
            className="input resize-y"
            spellCheck={false}
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="pages">
                Pages per dork
              </label>
              <input
                id="pages"
                type="number"
                min={1}
                max={20}
                value={pages}
                onChange={(e) => setPages(Math.max(1, Number(e.target.value) || 1))}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="searxng">
                SearXNG URL (optional)
              </label>
              <input
                id="searxng"
                value={searxng}
                onChange={(e) => setSearxng(e.target.value)}
                placeholder="http://searxng:8080"
                className="input"
                spellCheck={false}
              />
            </div>
          </div>

          {create.isError && (
            <div className="mt-4">
              <ErrorBanner
                message={
                  create.error instanceof ApiError
                    ? create.error.message
                    : "Failed to start dork job"
                }
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-faint">
              {dorkList.length} dork{dorkList.length === 1 ? "" : "s"} queued
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!dorkList.length || create.isPending}
              onClick={() => create.mutate()}
            >
              <Play className="h-4 w-4" />
              {create.isPending ? "Launching…" : "Run search"}
            </button>
          </div>
        </section>

        {/* Curated library */}
        <section className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Library className="h-4 w-4 text-accent" />
            <h2 className="font-display text-sm font-medium text-ink">Curated dork library</h2>
          </div>

          {library.isLoading && (
            <p className="font-mono text-xs text-faint">Loading library…</p>
          )}
          {library.isError && <ErrorBanner message="Could not load the dork library" />}

          <div className="max-h-[22rem] space-y-4 overflow-y-auto pr-1">
            {library.data &&
              Object.entries(library.data.categories).map(([category, dorks]) => (
                <div key={category}>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {category}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {dorks.map((dork) => {
                      const added = dorkList.includes(dork);
                      return (
                        <button
                          key={dork}
                          type="button"
                          onClick={() => addDork(dork)}
                          disabled={added}
                          className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left font-mono text-xs transition-all ${
                            added
                              ? "border-accent/30 bg-accent/5 text-accent/60"
                              : "border-line bg-raised/50 text-muted hover:border-accent/40 hover:text-ink"
                          }`}
                        >
                          <span className="truncate">{dork}</span>
                          {added ? (
                            <span className="text-[10px]">added</span>
                          ) : (
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* Live job */}
      {jobId != null && (
        <div className="mt-5">
          <LiveJobCard
            jobId={jobId}
            live={live}
            title="Dork search"
            onCancel={(id) => cancel.mutate(id)}
            cancelling={cancel.isPending}
          />
        </div>
      )}

      {/* Candidate URLs */}
      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Candidate URLs
            {urls.length > 0 && (
              <span className="ml-2 font-mono text-sm font-normal text-muted">
                {urls.length} found
              </span>
            )}
          </h2>
          {urls.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() =>
                  setSelected((prev) =>
                    prev.size === urls.length ? new Set() : new Set(urls),
                  )
                }
              >
                {selected.size === urls.length ? "Clear all" : "Select all"}
              </button>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                disabled={selected.size === 0}
                onClick={() => sendToScan([...selected])}
              >
                <Send className="h-3.5 w-3.5" />
                Send selected ({selected.size})
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs"
                onClick={() => sendToScan(urls)}
              >
                Send all to scan
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {urls.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="No candidates yet"
            hint="Queue one or more dorks and run a search. Results with query parameters will appear here, ready to send to the scanner."
          />
        ) : (
          <ul className="space-y-1.5">
            {urls.map((url, i) => (
              <motion.li
                key={url}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.4) }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  selected.has(url)
                    ? "border-accent/40 bg-accent/5"
                    : "border-line bg-surface/50 hover:border-accent/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(url)}
                  onChange={() => toggleUrl(url)}
                  className="h-4 w-4 accent-[#35E4C6]"
                />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                  {url}
                </span>
                <CopyButton value={url} />
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
