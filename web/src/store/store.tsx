import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { setStoredToken } from "../lib/api";
import type { DumpTechnique, InjectionContext } from "../lib/types";
import { useLocalStorage } from "../hooks/useLocalStorage";

/** A target confirmed injectable, handed off from Scan/Analyse to the Dumper. */
export interface DumpTarget {
  url: string;
  param: string;
  context: InjectionContext;
  technique: DumpTechnique;
  num_columns?: number;
  visible_index?: number;
}

export interface SchemaColumn {
  name: string;
  selected: boolean;
}
export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}
export interface SchemaDb {
  name: string;
  tables: SchemaTable[];
}

interface Store {
  token: string;
  setToken: (t: string) => void;

  disclaimerAccepted: boolean;
  acceptDisclaimer: () => void;
  resetDisclaimer: () => void;

  /** Candidate URLs handed from Dorks → Scan. */
  candidates: string[];
  setCandidates: (urls: string[]) => void;

  /** Injectable target handed from Scan/Analyse → Dumper. */
  dumpTarget: DumpTarget | null;
  setDumpTarget: (t: DumpTarget | null) => void;

  /** The Dumper's editable schema working set. */
  schema: SchemaDb[];
  setSchema: (s: SchemaDb[]) => void;
}

const StoreContext = createContext<Store | null>(null);

const KEYS = {
  token: "qcsqli.token",
  disclaimer: "qcsqli.disclaimer",
  candidates: "qcsqli.candidates",
  dumpTarget: "qcsqli.dumpTarget",
  schema: "qcsqli.schema",
} as const;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useLocalStorage<string>(KEYS.token, "");
  const [disclaimerAccepted, setDisclaimer] = useLocalStorage<boolean>(
    KEYS.disclaimer,
    false,
  );
  const [candidates, setCandidates] = useLocalStorage<string[]>(KEYS.candidates, []);
  const [dumpTarget, setDumpTarget] = useLocalStorage<DumpTarget | null>(
    KEYS.dumpTarget,
    null,
  );
  const [schema, setSchema] = useLocalStorage<SchemaDb[]>(KEYS.schema, []);

  const setToken = useCallback(
    (t: string) => {
      setStoredToken(t); // keep api.ts reader in sync immediately
      setTokenState(t);
    },
    [setTokenState],
  );

  const acceptDisclaimer = useCallback(() => setDisclaimer(true), [setDisclaimer]);
  const resetDisclaimer = useCallback(() => setDisclaimer(false), [setDisclaimer]);

  const value = useMemo<Store>(
    () => ({
      token,
      setToken,
      disclaimerAccepted,
      acceptDisclaimer,
      resetDisclaimer,
      candidates,
      setCandidates,
      dumpTarget,
      setDumpTarget,
      schema,
      setSchema,
    }),
    [
      token,
      setToken,
      disclaimerAccepted,
      acceptDisclaimer,
      resetDisclaimer,
      candidates,
      setCandidates,
      dumpTarget,
      setDumpTarget,
      schema,
      setSchema,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
