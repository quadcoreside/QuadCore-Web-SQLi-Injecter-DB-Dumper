import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Database,
  Microscope,
  Radar,
  ScrollText,
  Search,
  Settings,
} from "lucide-react";

import { LogoLockup } from "./Reactor";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const NAV: NavItem[] = [
  { to: "/dorks", label: "Dorks", icon: Search, hint: "Discover candidates" },
  { to: "/scan", label: "Scan", icon: Radar, hint: "Detect injection points" },
  { to: "/analyse", label: "Analyse", icon: Microscope, hint: "Deep single-URL" },
  { to: "/dumper", label: "Dumper", icon: Database, hint: "Extract records" },
  { to: "/jobs", label: "Jobs", icon: ScrollText, hint: "Background monitor" },
];

export function Sidebar({
  active,
  onNavigate,
}: {
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <LogoLockup active={active} />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-faint">
          Operations
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                isActive
                  ? "border-accent/40 bg-accent/10 text-ink shadow-glow"
                  : "border-transparent text-muted hover:border-line hover:bg-raised/50 hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                <item.icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-accent" : "text-muted group-hover:text-accent"}`}
                />
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-medium">{item.label}</span>
                  <span className="text-[10px] text-faint">{item.hint}</span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
              isActive
                ? "border-accent/40 bg-accent/10 text-ink"
                : "border-transparent text-muted hover:border-line hover:bg-raised/50 hover:text-ink"
            }`
          }
        >
          <Settings className="h-4 w-4" />
          <span className="font-display text-sm font-medium">Settings</span>
        </NavLink>
        <p className="px-3 pt-2 font-mono text-[10px] leading-relaxed text-faint">
          Authorized testing only. Operate strictly within your scope of engagement.
        </p>
      </div>
    </div>
  );
}
