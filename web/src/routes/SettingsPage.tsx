import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, RotateCcw, Settings, Trash2 } from "lucide-react";

import { useStore } from "../store/store";
import { PageHeader } from "../components/ui";

export function SettingsPage() {
  const {
    token,
    setToken,
    resetDisclaimer,
    setCandidates,
    setDumpTarget,
    setSchema,
  } = useStore();

  const [draft, setDraft] = useState(token);
  const [reveal, setReveal] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setToken(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const clearWorkingSet = () => {
    setCandidates([]);
    setDumpTarget(null);
    setSchema([]);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Local console preferences. Nothing here leaves your browser except the API token, sent as X-Token on requests."
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h2 className="font-display text-sm font-medium text-ink">API token</h2>
          </div>
          <p className="mb-4 text-xs text-muted">
            Set this only if the server was started with a token. It is stored in this
            browser and sent as the <span className="font-mono text-accent">X-Token</span>{" "}
            header on every request.
          </p>

          <label className="label" htmlFor="token">
            Token
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="token"
                type={reveal ? "text" : "password"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="paste server token…"
                className="input pr-9"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                aria-label={reveal ? "Hide token" : "Show token"}
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="button" className="btn btn-primary" onClick={save}>
              {saved ? <Check className="h-4 w-4" /> : null}
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className={`chip ${token ? "text-good" : "text-muted"}`}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${token ? "bg-good" : "bg-muted"}`}
              />
              {token ? "token active" : "no token set"}
            </span>
            {token && (
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => {
                  setToken("");
                  setDraft("");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear token
              </button>
            )}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-1 font-display text-sm font-medium text-ink">
            Session &amp; data
          </h2>
          <p className="mb-4 text-xs text-muted">
            Manage the data this console keeps in local storage.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-raised/40 px-3.5 py-3">
              <div>
                <div className="text-sm text-ink">Working set</div>
                <div className="text-xs text-faint">
                  Candidate URLs, the dump target and the saved schema tree.
                </div>
              </div>
              <button type="button" className="btn btn-ghost text-xs" onClick={clearWorkingSet}>
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-raised/40 px-3.5 py-3">
              <div>
                <div className="text-sm text-ink">Authorized-use disclaimer</div>
                <div className="text-xs text-faint">
                  Show the acceptance gate again on next load.
                </div>
              </div>
              <button type="button" className="btn btn-ghost text-xs" onClick={resetDisclaimer}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-warn/30 bg-warn/5 px-3.5 py-3 text-xs text-warn/90">
            Reminder: only operate this tool against systems you own or are explicitly
            authorized to test.
          </div>
        </section>
      </div>
    </div>
  );
}
