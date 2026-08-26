import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { HardDriveDownload } from "lucide-react";

import { confidenceTone, detailsToText, TECHNIQUE_META } from "../lib/format";
import type { DumpTechnique, Finding, InjectionContext } from "../lib/types";
import type { DumpTarget } from "../store/store";
import { EmptyState, Tag } from "./ui";

function toDumpTarget(url: string, f: Finding): DumpTarget {
  const details = (f.details ?? {}) as Record<string, unknown>;
  const technique: DumpTechnique = f.technique === "union" ? "union" : "blind";
  const num =
    typeof details.num_columns === "number" ? details.num_columns : undefined;
  const visible =
    typeof details.visible_index === "number" ? details.visible_index : undefined;
  return {
    url,
    param: f.param,
    context: f.context as InjectionContext,
    technique,
    num_columns: num,
    visible_index: visible,
  };
}

export function FindingsTable({
  url,
  findings,
  onSendToDumper,
}: {
  url: string;
  findings: Finding[];
  onSendToDumper?: (t: DumpTarget) => void;
}) {
  if (findings.length === 0) {
    return (
      <EmptyState
        title="No vulnerabilities detected"
        hint="No injection technique responded on the tested points for this target."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-raised/50 text-left">
            <Th>Param</Th>
            <Th>Context</Th>
            <Th>Technique</Th>
            <Th>Confidence</Th>
            <Th>Details</Th>
            {onSendToDumper && <Th className="text-right">Action</Th>}
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => {
            const tone = confidenceTone(f.confidence);
            const meta = TECHNIQUE_META[f.technique];
            return (
              <motion.tr
                key={`${f.param}-${f.context}-${f.technique}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="border-b border-line/60 last:border-0 hover:bg-raised/30"
              >
                <Td>
                  <span className="font-mono text-accent">{f.param}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-muted">{f.context}</span>
                </Td>
                <Td>
                  <Tag tone="accent">
                    <span title={meta?.hint}>{meta?.label ?? f.technique}</span>
                  </Tag>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-raised">
                      <div
                        className={`h-full ${
                          tone === "danger"
                            ? "bg-danger"
                            : tone === "warn"
                              ? "bg-warn"
                              : "bg-good"
                        }`}
                        style={{ width: `${Math.round(f.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {(f.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </Td>
                <Td>
                  <span
                    className="block max-w-[16rem] truncate font-mono text-xs text-faint"
                    title={detailsToText(f.details)}
                  >
                    {detailsToText(f.details) || "—"}
                  </span>
                </Td>
                {onSendToDumper && (
                  <Td className="text-right">
                    <button
                      type="button"
                      className="btn btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => onSendToDumper(toDumpTarget(url, f))}
                      title="Configure a dump from this finding"
                    >
                      <HardDriveDownload className="h-3.5 w-3.5" />
                      Dump
                    </button>
                  </Td>
                )}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}
