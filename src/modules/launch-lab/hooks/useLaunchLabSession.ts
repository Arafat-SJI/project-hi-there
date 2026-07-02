import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/cache";
import {
  deleteLaunchLabSession,
  insertLaunchLabSession,
  loadLaunchLabWorkspace,
  upsertLaunchLabPreferences,
  upsertLaunchLabSession,
} from "../lib/session-db";
import {
  createEmptySession,
  entryToSession,
  findEmptyUntitledSession,
  normalizeSession,
  sessionToEntry,
  sortSessionsBySavedAt,
} from "../lib/session-storage";
import type {
  IdeaCanvasResult,
  LaunchBoardState,
  LaunchLabContext,
  LaunchLabSession,
  LaunchLabStep,
  PitchAnalysis,
  SavedLaunchSession,
  SocialBannersState,
} from "../types";

const SAVE_DEBOUNCE_MS = 600;

function isAiPayloadChange(prev: LaunchLabSession | null, next: LaunchLabSession): boolean {
  if (!prev || prev.id !== next.id) return true;
  return (
    prev.step !== next.step ||
    prev.pitchAnalysis !== next.pitchAnalysis ||
    prev.canvas !== next.canvas ||
    prev.launchBoard !== next.launchBoard ||
    prev.socialBanners !== next.socialBanners ||
    prev.checkedSteps.join("|") !== next.checkedSteps.join("|")
  );
}

export function useLaunchLabSession() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [session, setSession] = useState<LaunchLabSession | null>(null);
  const [sessions, setSessions] = useState<SavedLaunchSession[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const sessionsRef = useRef<SavedLaunchSession[]>([]);
  const prevUserIdRef = useRef(userId);
  const sessionRef = useRef<LaunchLabSession | null>(null);
  const lastPersistedSessionRef = useRef<LaunchLabSession | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const workspaceQuery = useQuery({
    queryKey: queryKeys.launchLab.workspace(userId),
    queryFn: () => loadLaunchLabWorkspace(userId),
    enabled: !!userId,
    staleTime: 1000 * 30,
    retry: 1,
  });

  useEffect(() => {
    if (!workspaceQuery.data || hydratedRef.current) return;
    hydratedRef.current = true;
    setSession(workspaceQuery.data.session);
    setSessions(sortSessionsBySavedAt(workspaceQuery.data.sessions));
    setSidebarVisible(workspaceQuery.data.sidebarVisible);
    lastPersistedSessionRef.current = workspaceQuery.data.session;
  }, [workspaceQuery.data]);

  useEffect(() => {
    if (workspaceQuery.isError) {
      toast.error("Could not load Launch Lab sessions");
    }
  }, [workspaceQuery.isError]);

  useEffect(() => {
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;
    hydratedRef.current = false;
    setSession(null);
    setSessions([]);
    lastPersistedSessionRef.current = null;
  }, [userId]);

  const persistSessionMutation = useMutation({
    mutationFn: async ({
      nextSession,
      savedAt,
    }: {
      nextSession: LaunchLabSession;
      savedAt?: string;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      return upsertLaunchLabSession(userId, nextSession, savedAt);
    },
    onSuccess: (entry) => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === entry.id);
        if (idx < 0) return sortSessionsBySavedAt([entry, ...prev]);
        const next = [...prev];
        next[idx] = entry;
        return sortSessionsBySavedAt(next);
      });
      lastPersistedSessionRef.current = entryToSession(entry);
    },
    onError: () => {
      toast.error("Failed to save session — check your connection");
    },
  });

  const persistSessionNow = useCallback(
    (nextSession: LaunchLabSession, savedAt?: string) => {
      if (!userId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      persistSessionMutation.mutate({ nextSession, savedAt });
    },
    [persistSessionMutation, userId],
  );

  const schedulePersist = useCallback(
    (nextSession: LaunchLabSession, savedAt?: string, immediate = false) => {
      if (!userId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      const run = () => {
        persistSessionMutation.mutate({ nextSession, savedAt });
      };

      if (immediate) {
        run();
        return;
      }

      saveTimerRef.current = setTimeout(run, SAVE_DEBOUNCE_MS);
    },
    [persistSessionMutation, userId],
  );

  useEffect(() => {
    const flushPendingSave = () => {
      const current = sessionRef.current;
      if (!current || !hydratedRef.current || !userId) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (!isAiPayloadChange(lastPersistedSessionRef.current, current)) return;
      const savedAt = sessionsRef.current.find((s) => s.id === current.id)?.savedAt;
      void upsertLaunchLabSession(userId, current, savedAt).catch(() => {
        /* best-effort on unload */
      });
    };

    window.addEventListener("pagehide", flushPendingSave);
    return () => {
      window.removeEventListener("pagehide", flushPendingSave);
      flushPendingSave();
    };
  }, [userId]);

  useEffect(() => {
    if (!session || !hydratedRef.current || !userId) return;

    const savedAt = sessionsRef.current.find((s) => s.id === session.id)?.savedAt;
    const entry = sessionToEntry(session, savedAt);
    const immediate = isAiPayloadChange(lastPersistedSessionRef.current, session);

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx < 0) return sortSessionsBySavedAt([entry, ...prev]);
      const next = [...prev];
      next[idx] = entry;
      return sortSessionsBySavedAt(next);
    });

    schedulePersist(session, savedAt, immediate);
  }, [session, userId, schedulePersist]);

  useEffect(() => {
    if (!session || !hydratedRef.current || !userId) return;
    upsertLaunchLabPreferences(userId, { active_session_id: session.id }).catch(() => {
      /* non-blocking */
    });
  }, [session?.id, userId]);

  const setActiveSessionId = useCallback(
    async (id: string) => {
      if (!userId) return;
      await upsertLaunchLabPreferences(userId, { active_session_id: id });
    },
    [userId],
  );

  const setRawPitch = useCallback((rawPitch: string) => {
    setSession((prev) => (prev ? { ...prev, rawPitch } : prev));
  }, []);

  const setPitchAnalysis = useCallback((pitchAnalysis: PitchAnalysis | null) => {
    setSession((prev) => (prev ? { ...prev, pitchAnalysis } : prev));
  }, []);

  const setCanvas = useCallback((canvas: IdeaCanvasResult | null) => {
    setSession((prev) => (prev ? { ...prev, canvas } : prev));
  }, []);

  const setLaunchBoard = useCallback((launchBoard: LaunchBoardState | null) => {
    setSession((prev) => (prev ? { ...prev, launchBoard } : prev));
  }, []);

  const setSocialBanners = useCallback((socialBanners: SocialBannersState | null) => {
    setSession((prev) => (prev ? { ...prev, socialBanners } : prev));
  }, []);

  const setContext = useCallback((patch: Partial<LaunchLabContext>) => {
    setSession((prev) => (prev ? { ...prev, context: { ...prev.context, ...patch } } : prev));
  }, []);

  const toggleCheckedStep = useCallback((id: string) => {
    setSession((prev) => {
      if (!prev) return prev;
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
    setSession((prev) => (prev ? { ...prev, step } : prev));
  }, []);

  const newSession = useCallback(async () => {
    if (!userId || !session) return;

    const existingEmpty = findEmptyUntitledSession(sessions);
    if (existingEmpty) {
      if (existingEmpty.id !== session.id) {
        const loaded = entryToSession(existingEmpty);
        setSession(loaded);
        lastPersistedSessionRef.current = loaded;
        await setActiveSessionId(existingEmpty.id);
        toast.info("Switched to your empty session");
      }
      return;
    }

    const fresh = createEmptySession();
    try {
      const entry = await insertLaunchLabSession(userId, fresh);
      setSession(fresh);
      lastPersistedSessionRef.current = fresh;
      setSessions((prev) => sortSessionsBySavedAt([entry, ...prev.filter((s) => s.id !== fresh.id)]));
      await setActiveSessionId(fresh.id);
      toast.success("New Launch Lab session");
    } catch {
      toast.error("Could not create session");
    }
  }, [userId, session, sessions, setActiveSessionId]);

  const selectSession = useCallback(
    async (id: string) => {
      if (!session || id === session.id) return;
      const entry = sessions.find((s) => s.id === id);
      if (!entry) return;
      const loaded = entryToSession(entry);
      setSession(loaded);
      lastPersistedSessionRef.current = loaded;
      await setActiveSessionId(id);
    },
    [session, sessions, setActiveSessionId],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      if (!userId || !session) return;

      const next = sessions.filter((s) => s.id !== id);
      const wasActive = session.id === id;

      try {
        await deleteLaunchLabSession(userId, id);

        if (wasActive) {
          if (next.length > 0) {
            const loaded = entryToSession(next[0]);
            setSession(loaded);
            lastPersistedSessionRef.current = loaded;
            await setActiveSessionId(loaded.id);
            setSessions(next);
          } else {
            const fresh = createEmptySession();
            const entry = await insertLaunchLabSession(userId, fresh);
            setSession(fresh);
            lastPersistedSessionRef.current = fresh;
            setSessions([entry]);
            await setActiveSessionId(fresh.id);
          }
        } else {
          setSessions(next);
        }

        toast.success("Session removed");
      } catch {
        toast.error("Could not delete session");
      }
    },
    [userId, session, sessions, setActiveSessionId],
  );

  const resetSession = useCallback(() => {
    if (!session) return;
    const cleared = normalizeSession({ id: session.id });
    setSession(cleared);
    toast.success("Session cleared");
  }, [session]);

  const saveToHistory = useCallback(() => {
    if (!session?.pitchAnalysis && !session?.canvas) {
      toast.error("Nothing to save yet — analyze your pitch first.");
      return;
    }
    toast.success("Session saved");
  }, [session?.pitchAnalysis, session?.canvas]);

  const persistSidebarVisible = useCallback(
    async (visible: boolean) => {
      setSidebarVisible(visible);
      if (!userId) return;
      try {
        await upsertLaunchLabPreferences(userId, { sidebar_visible: visible });
      } catch {
        toast.error("Could not save sidebar preference");
      }
    },
    [userId],
  );

  return {
    session,
    sessions,
    history: sessions,
    sidebarVisible,
    isLoading: workspaceQuery.isLoading || (!session && !workspaceQuery.isError),
    isError: workspaceQuery.isError,
    isSaving: persistSessionMutation.isPending,
    setRawPitch,
    setPitchAnalysis,
    setCanvas,
    setLaunchBoard,
    setSocialBanners,
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
    persistSidebarVisible,
    persistSessionNow,
  };
}
