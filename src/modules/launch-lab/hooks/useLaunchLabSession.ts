import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_LAUNCH_LAB_SESSIONS, LAUNCH_LAB_ACTIVE_ID_KEY } from "../constants";
import type {
  IdeaCanvasResult,
  LaunchBoardState,
  LaunchLabContext,
  LaunchLabSession,
  LaunchLabStep,
  PitchAnalysis,
  SavedLaunchSession,
} from "../types";
import {
  createEmptySession,
  entryToSession,
  findEmptyUntitledSession,
  loadLaunchLabWorkspace,
  normalizeSession,
  persistActiveId,
  persistSessions,
  sessionRichness,
  sessionToEntry,
  sortSessionsBySavedAt,
} from "../lib/session-storage";

export function useLaunchLabSession() {
  const preferredActiveId =
    typeof localStorage !== "undefined" ? localStorage.getItem(LAUNCH_LAB_ACTIVE_ID_KEY) : null;
  const initial = useRef(loadLaunchLabWorkspace());
  const [session, setSession] = useState<LaunchLabSession>(initial.current.session);
  const [sessions, setSessions] = useState<SavedLaunchSession[]>(
    sortSessionsBySavedAt(initial.current.sessions),
  );

  useEffect(() => {
    if (
      preferredActiveId &&
      preferredActiveId !== initial.current.session.id &&
      sessionRichness(initial.current.session) > 0
    ) {
      toast.info("Restored your previous Launch Lab session");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSessions = useCallback((updater: (prev: SavedLaunchSession[]) => SavedLaunchSession[]) => {
    setSessions((prev) => {
      const next = sortSessionsBySavedAt(updater(prev).slice(0, MAX_LAUNCH_LAB_SESSIONS));
      persistSessions(next);
      return next;
    });
  }, []);

  useEffect(() => {
    syncSessions((prev) => {
      const entry = sessionToEntry(
        session,
        prev.find((s) => s.id === session.id)?.savedAt,
      );
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx < 0) return [entry, ...prev];
      const next = [...prev];
      next[idx] = entry;
      return sortSessionsBySavedAt(next);
    });
    persistActiveId(session.id);
  }, [session, syncSessions]);

  const setRawPitch = useCallback((rawPitch: string) => {
    setSession((prev) => ({ ...prev, rawPitch }));
  }, []);

  const setPitchAnalysis = useCallback((pitchAnalysis: PitchAnalysis | null) => {
    setSession((prev) => ({ ...prev, pitchAnalysis }));
  }, []);

  const setCanvas = useCallback((canvas: IdeaCanvasResult | null) => {
    setSession((prev) => ({ ...prev, canvas }));
  }, []);

  const setLaunchBoard = useCallback((launchBoard: LaunchBoardState | null) => {
    setSession((prev) => ({ ...prev, launchBoard }));
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

  const goToStep = useCallback((step: LaunchLabStep) => {
    setSession((prev) => ({ ...prev, step }));
  }, []);

  const newSession = useCallback(() => {
    const existingEmpty = findEmptyUntitledSession(sessions);
    if (existingEmpty) {
      if (existingEmpty.id !== session.id) {
        setSession(entryToSession(existingEmpty));
        persistActiveId(existingEmpty.id);
        toast.info("Switched to your empty session");
      }
      return;
    }

    const fresh = createEmptySession();
    setSession(fresh);
    syncSessions((prev) => [sessionToEntry(fresh), ...prev.filter((s) => s.id !== fresh.id)]);
    persistActiveId(fresh.id);
    toast.success("New Launch Lab session");
  }, [syncSessions, sessions, session.id]);

  const selectSession = useCallback(
    (id: string) => {
      if (id === session.id) return;
      const entry = sessions.find((s) => s.id === id);
      if (!entry) return;
      setSession(entryToSession(entry));
      persistActiveId(id);
    },
    [session.id, sessions],
  );

  const deleteSession = useCallback(
    (id: string) => {
      const next = sessions.filter((s) => s.id !== id);
      const wasActive = session.id === id;

      if (wasActive) {
        if (next.length > 0) {
          const loaded = entryToSession(next[0]);
          setSession(loaded);
          persistActiveId(loaded.id);
          persistSessions(next);
          setSessions(next);
        } else {
          const fresh = createEmptySession();
          const freshEntry = sessionToEntry(fresh);
          setSession(fresh);
          persistSessions([freshEntry]);
          setSessions([freshEntry]);
          persistActiveId(fresh.id);
        }
      } else {
        persistSessions(next);
        setSessions(next);
      }

      toast.success("Session removed");
    },
    [session.id, sessions],
  );

  const resetSession = useCallback(() => {
    const cleared = normalizeSession({ id: session.id });
    setSession(cleared);
    toast.success("Session cleared");
  }, [session.id]);

  const saveToHistory = useCallback(() => {
    if (!session.pitchAnalysis && !session.canvas) {
      toast.error("Nothing to save yet — analyze your pitch first.");
      return;
    }
    toast.success("Session saved");
  }, [session.pitchAnalysis, session.canvas]);

  return {
    session,
    sessions,
    history: sessions,
    setRawPitch,
    setPitchAnalysis,
    setCanvas,
    setLaunchBoard,
    setContext,
    toggleCheckedStep,
    goToStep,
    newSession,
    selectSession,
    deleteSession,
    resetSession,
    saveToHistory,
    loadFromHistory: selectSession,
    deleteFromHistory: deleteSession,
  };
}
