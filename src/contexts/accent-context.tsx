"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  applyAccentToDocument,
  getAccent,
  getNextAccent,
  isAccentId,
  type AccentId,
} from "@/lib/accents";

type AccentContextValue = {
  accent: AccentId;
  hex: string;
  label: string;
  setAccent: (id: AccentId) => void;
  cycleAccent: () => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

function readStoredAccent(): AccentId {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    return isAccentId(stored) ? stored : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>(readStoredAccent);

  useEffect(() => {
    applyAccentToDocument(accent);
  }, [accent]);

  const setAccent = useCallback((id: AccentId) => {
    setAccentState(id);
    applyAccentToDocument(id);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
    } catch {
      // Ignore quota / private-mode failures
    }
  }, []);

  const cycleAccent = useCallback(() => {
    setAccentState((current) => {
      const next = getNextAccent(current);
      applyAccentToDocument(next);
      try {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
      } catch {
        // Ignore quota / private-mode failures
      }
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const meta = getAccent(accent);
    return {
      accent,
      hex: meta.hex,
      label: meta.label,
      setAccent,
      cycleAccent,
    };
  }, [accent, setAccent, cycleAccent]);

  return (
    <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
  );
}

export function useAccent() {
  const context = useContext(AccentContext);
  if (!context) {
    throw new Error("useAccent must be used within an AccentProvider");
  }
  return context;
}
