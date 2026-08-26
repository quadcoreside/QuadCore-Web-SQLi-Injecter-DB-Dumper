import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { KeyRound, Menu, ShieldCheck, X } from "lucide-react";

import { activeJobCount, useJobs } from "../hooks/useJobs";
import { useStore } from "../store/store";
import { Reactor } from "./Reactor";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const { data: jobs } = useJobs();
  const { token } = useStore();
  const active = activeJobCount(jobs);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Rail — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface/60 backdrop-blur lg:block">
        <Sidebar active={active > 0} />
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-line bg-surface">
            <button
              type="button"
              className="btn btn-ghost absolute right-3 top-3 !p-2"
              onClick={() => setMobileNav(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar active={active > 0} onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            type="button"
            className="btn btn-ghost !p-2 lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link to="/jobs" className="flex items-center gap-2" title="Reactor activity">
            <Reactor size={30} active={active > 0} />
            <div className="hidden flex-col leading-none sm:flex">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Reactor
              </span>
              <span
                className={`font-mono text-xs ${active > 0 ? "text-warn" : "text-accent"}`}
              >
                {active > 0 ? `${active} active` : "idle"}
              </span>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/settings"
              className={`chip transition-colors ${
                token ? "text-good" : "text-muted hover:text-ink"
              }`}
              title={token ? "API token set" : "No API token"}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{token ? "token set" : "no token"}</span>
            </Link>
            <span className="chip text-accent" title="Authorized-use tool">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">authorized</span>
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
