import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  Search,
} from "lucide-react";

import { exportCsv, exportJson } from "../lib/format";

interface DataTableProps {
  columns: string[];
  rows: Array<Record<string, string>>;
  filenameBase: string;
  live?: boolean;
}

const PAGE_SIZES = [25, 50, 100];

/** Searchable, paginated rows table with CSV/JSON export. */
export function DataTable({ columns, rows, filenameBase, live }: DataTableProps) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q)),
    );
  }, [rows, columns, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <div className="panel overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-raised/40 px-4 py-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search rows…"
            className="input !py-1.5 !pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {live && (
            <span className="chip !py-1 text-warn">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-warn" />
              streaming
            </span>
          )}
          <span className="font-mono text-xs text-muted">
            {filtered.length}
            {filtered.length !== rows.length && ` / ${rows.length}`} rows
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="input !w-auto !py-1.5 text-xs"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1.5 text-xs"
            disabled={filtered.length === 0}
            onClick={() => exportCsv(`${filenameBase}.csv`, columns, filtered)}
            title="Export filtered rows as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1.5 text-xs"
            disabled={filtered.length === 0}
            onClick={() => exportJson(`${filenameBase}.json`, filtered)}
            title="Export filtered rows as JSON"
          >
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 font-mono text-[10px] text-faint">#</th>
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-10 text-center font-mono text-xs text-faint"
                >
                  {rows.length === 0 ? "Awaiting rows…" : "No rows match your search."}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={start + i}
                  className="border-b border-line/50 last:border-0 odd:bg-raised/20 hover:bg-raised/40"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-faint">
                    {start + i + 1}
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c}
                      className="max-w-[22rem] truncate px-3 py-2 font-mono text-xs text-ink"
                      title={String(row[c] ?? "")}
                    >
                      {row[c] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <span className="font-mono text-[11px] text-faint">
          Page {safePage + 1} / {pageCount}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
