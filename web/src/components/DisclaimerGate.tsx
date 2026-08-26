import { useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

import { useStore } from "../store/store";
import { Reactor } from "./Reactor";

const TERMS = [
  "You will use QuadCore SQLi only against systems that you own, or for which you hold explicit, current, written authorization to test.",
  "Unauthorized access to computer systems is illegal in most jurisdictions and may carry criminal and civil liability. You accept full responsibility for how you use this tool.",
  "This tool performs active, intrusive requests (payload injection, data extraction). It can alter or exfiltrate data. Operate strictly within your agreed rules of engagement and scope.",
  "The authors and distributors provide this software as-is, without warranty, and accept no liability for misuse or resulting damages.",
];

/** Blocks the whole app until the operator accepts the authorized-use terms. */
export function DisclaimerGate({ children }: { children: ReactNode }) {
  const { disclaimerAccepted, acceptDisclaimer } = useStore();
  const [checked, setChecked] = useState(false);

  if (disclaimerAccepted) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-bg px-4 py-10">
      <div className="pointer-events-none absolute inset-0 animate-grid-pan grid-backdrop opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        className="panel relative w-full max-w-2xl overflow-hidden p-7"
      >
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="h-px w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-accent to-transparent" />
        </div>

        <div className="flex items-center gap-4">
          <Reactor size={52} />
          <div>
            <div className="eyebrow">QuadCore SQLi</div>
            <h1
              id="disclaimer-title"
              className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-ink"
            >
              <ShieldAlert className="h-6 w-6 text-warn" />
              Authorized testing only
            </h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted">
          QuadCore SQLi is professional security tooling for offensive testing. Before you
          continue, confirm that you understand and agree to the following terms of use.
        </p>

        <ol className="mt-5 space-y-3">
          {TERMS.map((term, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/90">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{term}</span>
            </li>
          ))}
        </ol>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-raised/50 p-3.5 transition-colors hover:border-accent/40">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#35E4C6]"
          />
          <span className="text-sm text-ink">
            I have read and agree to these terms. I am authorized to test the systems I will
            target.
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <span className="font-mono text-[11px] text-faint">
            Your acceptance is stored locally on this device.
          </span>
          <button
            type="button"
            disabled={!checked}
            onClick={acceptDisclaimer}
            className="btn btn-primary w-full px-6 sm:w-auto"
          >
            Accept &amp; enter console
          </button>
        </div>
      </motion.div>
    </div>
  );
}
