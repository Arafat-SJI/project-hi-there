import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_CONTEXT,
  LAUNCH_LAB_HISTORY_KEY,
  LAUNCH_LAB_STORAGE_KEY,
} from "../constants";
import type {
  IdeaCanvasResult,
  LaunchLabContext,
  LaunchLabSession,
  PitchAnalysis,
  SavedLaunchSession,
} from "../types";

const INITIAL_SESSION: LaunchLabSession = {
  step: 1,
  rawPitch: "",
  pitchAnalysis: null,
  canvas: null,
  context: { ...DEFAULT_CONTEXT },
  checkedSteps: [],
};

function loadSession(): LaunchLabSession {
  try {
    const raw = localStorage.getItem(LAUNCH_LAB_STORAGE_KEY);
    if (!raw) return INITIAL_SESSION;
    const parsed = JSON.parse(raw) as LaunchLabSession;
    return { ...INITIAL_SESSION, ...parsed, context: { ...DEFAULT_CONTEXT, ...parsed.context } };
  } catch {
    return INITIAL_SESSION;
  }
}

function loadHistory(): SavedLaunchSession[] {
  try {
    const raw = localStorage.getItem(LAUNCH_LAB_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedLaunchSession[];
  } catch {
    return [];
  }
}

export function useLaunchLabSession() {
  const [session, setSession] = useState<LaunchLabSession>(loadSession);
  const [history, setHistory] = useState<SavedLaunchSession[]>(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem(LAUNCH_LAB_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore quota errors
    }
  }, [session]);

  const setRawPitch = useCallback((rawPitch: string) => {
    setSession((prev) => ({ ...prev, rawPitch }));
  }, []);

  const setPitchAnalysis = useCallback((pitchAnalysis: PitchAnalysis | null) => {
    setSession((prev) => ({ ...prev, pitchAnalysis }));
  }, []);

  const setCanvas = useCallback((canvas: IdeaCanvasResult | null) => {
    setSession((prev) => ({ ...prev, canvas }));
  }, []);

  const setContext = useCallback((patch: Partial<LaunchLabContext>) => {
    setSession((prev) => ({ ...prev, context: { ...prev.context, ...patch } }));
  }, []);

  const toggleCheckedStep = useCallback((id: string) => {
    setSession((prev) => {
      const has = prev.checkedSteps.includes(id);
      return {
        ...prev,
        checkedSteps: has
          ? prev.checkedSteps.filter((x) => x !== id)
          : [...prev.checkedSteps, id],
      };
    });
  }, []);

  const goToStep = useCallback((step: 1 | 2) => {
    setSession((prev) => ({ ...prev, step }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(INITIAL_SESSION);
    localStorage.removeItem(LAUNCH_LAB_STORAGE_KEY);
  }, []);

  const saveToHistory = useCallback(() => {
    setSession((prev) => {
      if (!prev.pitchAnalysis && !prev.canvas) {
        toast.error("Nothing to save yet — analyze your pitch first.");
        return prev;
      }
      const entry: SavedLaunchSession = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        productName: prev.context.productName || "Untitled",
        overall: prev.pitchAnalysis?.overall ?? null,
        rawPitch: prev.rawPitch,
        pitchAnalysis: prev.pitchAnalysis,
        canvas: prev.canvas,
        context: prev.context,
        checkedSteps: prev.checkedSteps,
      };
      setHistory((h) => {
        const next = [entry, ...h].slice(0, 12);
        localStorage.setItem(LAUNCH_LAB_HISTORY_KEY, JSON.stringify(next));
        return next;
      });
      toast.success("Session saved to history");
      return prev;
    });
  }, []);

  const loadFromHistory = useCallback((id: string) => {
    setHistory((h) => {
      const entry = h.find((x) => x.id === id);
      if (!entry) return h;
      setSession({
        step: entry.canvas ? 2 : 1,
        rawPitch: entry.rawPitch,
        pitchAnalysis: entry.pitchAnalysis,
        canvas: entry.canvas,
        context: entry.context,
        checkedSteps: entry.checkedSteps,
      });
      toast.success(`Loaded "${entry.productName}"`);
      return h;
    });
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    setHistory((h) => {
      const next = h.filter((x) => x.id !== id);
      localStorage.setItem(LAUNCH_LAB_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    toast.success("Session removed");
  }, []);

  return {
    session,
    history,
    setRawPitch,
    setPitchAnalysis,
    setCanvas,
    setContext,
    toggleCheckedStep,
    goToStep,
    resetSession,
    saveToHistory,
    loadFromHistory,
    deleteFromHistory,
  };
}
