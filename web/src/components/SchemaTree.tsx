import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Columns3,
  Database,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";

import { parseColumns } from "../lib/format";
import type { SchemaColumn, SchemaDb } from "../store/store";

export function tableKey(db: string, table: string): string {
  return `${db}::${table}`;
}

interface SchemaTreeProps {
  schema: SchemaDb[];
  setSchema: (s: SchemaDb[]) => void;
  activeKey: string | null;
  setActiveKey: (key: string) => void;
}

/**
 * Editable schema working set. There is no server-side enumeration endpoint in
 * the API, so the operator constructs the Database → Table → Column tree here
 * (from prior recon), selects a table to dump, and ticks the columns to extract.
 */
export function SchemaTree({ schema, setSchema, activeKey, setActiveKey }: SchemaTreeProps) {
  const [newDb, setNewDb] = useState("");

  const addDb = () => {
    const name = newDb.trim();
    if (!name || schema.some((d) => d.name === name)) return;
    setSchema([...schema, { name, tables: [] }]);
    setNewDb("");
  };

  const removeDb = (dbName: string) =>
    setSchema(schema.filter((d) => d.name !== dbName));

  const updateDb = (dbName: string, fn: (db: SchemaDb) => SchemaDb) =>
    setSchema(schema.map((d) => (d.name === dbName ? fn(d) : d)));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newDb}
          onChange={(e) => setNewDb(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addDb()}
          placeholder="database name"
          className="input !py-1.5 text-xs"
          spellCheck={false}
        />
        <button type="button" className="btn btn-ghost text-xs" onClick={addDb}>
          <Database className="h-3.5 w-3.5" />
          Add DB
        </button>
      </div>

      {schema.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center font-mono text-xs text-faint">
          Add a database to start mapping the schema.
        </p>
      ) : (
        <div className="space-y-2">
          {schema.map((db) => (
            <DbNode
              key={db.name}
              db={db}
              activeKey={activeKey}
              setActiveKey={setActiveKey}
              onRemove={() => removeDb(db.name)}
              onUpdate={(fn) => updateDb(db.name, fn)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DbNode({
  db,
  activeKey,
  setActiveKey,
  onRemove,
  onUpdate,
}: {
  db: SchemaDb;
  activeKey: string | null;
  setActiveKey: (k: string) => void;
  onRemove: () => void;
  onUpdate: (fn: (db: SchemaDb) => SchemaDb) => void;
}) {
  const [open, setOpen] = useState(true);
  const [newTable, setNewTable] = useState("");

  const addTable = () => {
    const name = newTable.trim();
    if (!name || db.tables.some((t) => t.name === name)) return;
    onUpdate((d) => ({ ...d, tables: [...d.tables, { name, columns: [] }] }));
    setNewTable("");
  };

  return (
    <div className="rounded-lg border border-line bg-raised/30">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-muted">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Database className="h-4 w-4 text-accent" />
        <span className="flex-1 font-mono text-sm text-ink">{db.name}</span>
        <span className="font-mono text-[10px] text-faint">{db.tables.length} tables</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-faint hover:text-danger"
          title="Remove database"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="space-y-1.5 border-t border-line/60 px-2.5 py-2 pl-8">
          {db.tables.map((table) => (
            <TableNode
              key={table.name}
              dbName={db.name}
              table={table}
              active={activeKey === tableKey(db.name, table.name)}
              onActivate={() => setActiveKey(tableKey(db.name, table.name))}
              onRemove={() =>
                onUpdate((d) => ({
                  ...d,
                  tables: d.tables.filter((t) => t.name !== table.name),
                }))
              }
              onUpdate={(fn) =>
                onUpdate((d) => ({
                  ...d,
                  tables: d.tables.map((t) => (t.name === table.name ? fn(t) : t)),
                }))
              }
            />
          ))}

          <div className="flex gap-2 pt-1">
            <input
              value={newTable}
              onChange={(e) => setNewTable(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTable()}
              placeholder="table name"
              className="input !py-1 text-xs"
              spellCheck={false}
            />
            <button type="button" className="btn btn-ghost !py-1 text-xs" onClick={addTable}>
              <Table2 className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableNode({
  dbName,
  table,
  active,
  onActivate,
  onRemove,
  onUpdate,
}: {
  dbName: string;
  table: { name: string; columns: SchemaColumn[] };
  active: boolean;
  onActivate: () => void;
  onRemove: () => void;
  onUpdate: (fn: (t: { name: string; columns: SchemaColumn[] }) => {
    name: string;
    columns: SchemaColumn[];
  }) => void;
}) {
  const [open, setOpen] = useState(true);
  const [newCols, setNewCols] = useState("");

  const addColumns = () => {
    const names = parseColumns(newCols);
    if (!names.length) return;
    onUpdate((t) => {
      const existing = new Set(t.columns.map((c) => c.name));
      const added = names
        .filter((n) => !existing.has(n))
        .map((n) => ({ name: n, selected: true }));
      return { ...t, columns: [...t.columns, ...added] };
    });
    setNewCols("");
  };

  const toggleCol = (name: string) =>
    onUpdate((t) => ({
      ...t,
      columns: t.columns.map((c) =>
        c.name === name ? { ...c, selected: !c.selected } : c,
      ),
    }));

  const selectedCount = table.columns.filter((c) => c.selected).length;

  return (
    <div
      className={`rounded-md border ${
        active ? "border-accent/50 bg-accent/5" : "border-line/60 bg-surface/40"
      }`}
      title={tableKey(dbName, table.name)}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-muted">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <input
          type="radio"
          name="active-table"
          checked={active}
          onChange={onActivate}
          className="h-3.5 w-3.5 accent-[#35E4C6]"
          title="Select this table to dump"
        />
        <Table2 className={`h-3.5 w-3.5 ${active ? "text-accent" : "text-muted"}`} />
        <button
          type="button"
          onClick={onActivate}
          className={`flex-1 text-left font-mono text-xs ${active ? "text-accent" : "text-ink"}`}
        >
          {table.name}
        </button>
        <span className="font-mono text-[10px] text-faint">{selectedCount} cols</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-faint hover:text-danger"
          title="Remove table"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="border-t border-line/40 px-2 py-2 pl-7">
          {table.columns.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {table.columns.map((col) => (
                <label
                  key={col.name}
                  className={`flex cursor-pointer items-center gap-1.5 rounded border px-1.5 py-1 font-mono text-[11px] transition-colors ${
                    col.selected
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-line bg-raised/40 text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={col.selected}
                    onChange={() => toggleCol(col.name)}
                    className="h-3 w-3 accent-[#35E4C6]"
                  />
                  <Columns3 className="h-3 w-3" />
                  {col.name}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newCols}
              onChange={(e) => setNewCols(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addColumns()}
              placeholder="id, username, password"
              className="input !py-1 text-xs"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn btn-ghost !py-1 text-xs"
              onClick={addColumns}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
