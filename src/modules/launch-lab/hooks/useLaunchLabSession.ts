import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/cache";
import {
  hydrateSocialBannersWithStoredImages,
  stripSocialBannersForPersistence,
} from "../lib/social-banners";
import {
  clearSessionBannerImages,
  evictOtherSessionsBannerCache,
} from "../lib/banner-image-store";
import {
  deleteLaunchLabSession,
  fetchSessionSocialBanners,
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
  LaunchCommandTab,
  PitchAnalysis,
  SavedLaunchSession,
  SocialBannersState,
} from "../types";

const SAVE_DEBOUNCE_MS = 600;
const HYDRATED_CACHE_MAX = 3;

function stripSessionForCache(session: LaunchLabSession): LaunchLabSession {
  return {
    ...session,
    socialBanners: stripSocialBannersForPersistence(session.socialBanners),
  };
}

function isImmediatePersistChange(prev: LaunchLabSession | null, next: LaunchLabSession): boolean {
  if (!prev || prev.id !== next.id) return true;
  return (
    prev.step !== next.step ||
    prev.pitchAnalysis !== next.pitchAnalysis ||
    prev.canvas !== next.canvas ||
    prev.commandTab !== next.commandTab ||
    prev.completedAt !== next.completedAt ||
    prev.checkedSteps.join("|") !== next.checkedSteps.join("|")
  );
}

export function useLaunchLabSession(projectId?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";
  const [session, setSession] = useState<LaunchLabSession | null>(null);
  const [sessions, setSessions] = useState<SavedLaunchSession[]>([]);
  const [sharedSessions, setSharedSessions] = useState<SavedLaunchSession[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const sessionsRef = useRef<SavedLaunchSession[]>([]);
  const sharedSessionsRef = useRef<SavedLaunchSession[]>([]);
  const prevUserIdRef = useRef(userId);
  const sessionRef = useRef<LaunchLabSession | null>(null);
  const lastPersistedSessionRef = useRef<LaunchLabSession | null>(null);
  const hydratedCacheRef = useRef<Map<string, LaunchLabSession>>(new Map());
  const prefetchingRef = useRef<Set<string>>(new Set());
  const lastSyncedWorkspaceKeyRef = useRef<string | null>(null);

  const navigateToProject = useCallback(
    (id: string, replace = false) => {
      navigate(`/launch-lab/${id}`, { replace });
    },
    [navigate],
  );

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    sharedSessionsRef.current = sharedSessions;
  }, [sharedSessions]);

  useEffect(() => {
    sessionRef.current = session;
    if (session) {
      const cached = stripSessionForCache(session);
      hydratedCacheRef.current.set(session.id, cached);
      if (hydratedCacheRef.current.size > HYDRATED_CACHE_MAX) {
        const keep = new Set(
          [session.id, ...sessionsRef.current.slice(0, HYDRATED_CACHE_MAX).map((s) => s.id)],
        );
        for (const key of hydratedCacheRef.current.keys()) {
          if (!keep.has(key)) hydratedCacheRef.current.delete(key);
        }
      }
      evictOtherSessionsBannerCache(session.id);
    }
  }, [session]);

  const workspaceQuery = useQuery({
    queryKey: queryKeys.launchLab.workspace(userId, projectId),
    queryFn: () => loadLaunchLabWorkspace(userId, projectId),
    enabled: !!userId,
    staleTime: 1000 * 30,
    retry: 1,
  });

  useEffect(() => {
    if (!workspaceQuery.data) return;

    const {
      session: loadedSession,
      sessions: loadedSessions,
      sharedSessions: loadedSharedSessions,
      sidebarVisible: visible,
    } = workspaceQuery.data;

    if (projectId && loadedSession.id !== projectId) return;

    const syncKey = `${projectId ?? "default"}:${loadedSession.id}:${workspaceQuery.dataUpdatedAt}`;
    if (lastSyncedWorkspaceKeyRef.current === syncKey) return;
    lastSyncedWorkspaceKeyRef.current = syncKey;

    setSession(loadedSession);
    setSessions(sortSessionsBySavedAt(loadedSessions));
    setSharedSessions(loadedSharedSessions);
    setSidebarVisible(visible);
    lastPersistedSessionRef.current = loadedSession;
    hydratedRef.current = true;
    hydratedCacheRef.current.set(loadedSession.id, stripSessionForCache(loadedSession));
  }, [workspaceQuery.data, workspaceQuery.dataUpdatedAt, projectId]);

  useEffect(() => {
    lastSyncedWorkspaceKeyRef.current = null;
  }, [projectId]);

  const resolvedSession = useMemo(() => {
    if (session) return session;
    const data = workspaceQuery.data;
    if (!data) return null;
    if (projectId && data.session.id !== projectId) return null;
    return data.session;
  }, [session, workspaceQuery.data, projectId]);

  const resolvedSessions = useMemo(() => {
    if (sessions.length > 0) return sessions;
    const data = workspaceQuery.data;
    return data ? sortSessionsBySavedAt(data.sessions) : [];
  }, [sessions, workspaceQuery.data]);

  const resolvedSharedSessions = useMemo(() => {
    if (sharedSessions.length > 0) return sharedSessions;
    return workspaceQuery.data?.sharedSessions ?? [];
  }, [sharedSessions, workspaceQuery.data]);

  const findSessionEntry = useCallback(
    (id: string) =>
      resolvedSessions.find((s) => s.id === id) ?? resolvedSharedSessions.find((s) => s.id === id),
    [resolvedSessions, resolvedSharedSessions],
  );

  const resolvedSidebarVisible = workspaceQuery.data?.sidebarVisible ?? sidebarVisible;

  useEffect(() => {
    if (workspaceQuery.isError) {
      toast.error("Could not load Launch Lab sessions");
    }
  }, [workspaceQuery.isError]);

  useEffect(() => {
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;
    hydratedRef.current = false;
    lastSyncedWorkspaceKeyRef.current = null;
    setSession(null);
    setSessions([]);
    setSharedSessions([]);
    lastPersistedSessionRef.current = null;
    hydratedCacheRef.current.clear();
    prefetchingRef.current.clear();
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
      if (!isImmediatePersistChange(lastPersistedSessionRef.current, current)) return;
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
    if (session.ownerId && session.ownerId !== userId) return;

    const savedAt = sessionsRef.current.find((s) => s.id === session.id)?.savedAt;
    const entry = sessionToEntry(session, savedAt);
    const immediate = isImmediatePersistChange(lastPersistedSessionRef.current, session);

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
    if (session.ownerId && session.ownerId !== userId) return;

    upsertLaunchLabPreferences(userId, { active_session_id: session.id }).catch(() => {
      /* non-blocking */
    });
  }, [session?.id, session?.ownerId, userId]);

  const flushPendingSaveForSwitch = useCallback(() => {
    const current = sessionRef.current;
    if (!current || !hydratedRef.current || !userId) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!isImmediatePersistChange(lastPersistedSessionRef.current, current)) return;
    const savedAt = sessionsRef.current.find((s) => s.id === current.id)?.savedAt;
    lastPersistedSessionRef.current = current;
    void upsertLaunchLabSession(userId, current, savedAt).catch(() => {
      /* best-effort before switch */
    });
  }, [userId]);

  const patchSession = useCallback(
    (patch: (prev: LaunchLabSession) => LaunchLabSession) => {
      setSession((prev) => {
        const base = prev ?? resolvedSession;
        if (!base) return prev;
        return patch(base);
      });
    },
    [resolvedSession],
  );

  const setRawPitch = useCallback((rawPitch: string) => {
    patchSession((prev) => ({ ...prev, rawPitch }));
  }, [patchSession]);

  const setPitchAnalysis = useCallback((pitchAnalysis: PitchAnalysis | null) => {
    patchSession((prev) => ({ ...prev, pitchAnalysis }));
  }, [patchSession]);

  const setCanvas = useCallback((canvas: IdeaCanvasResult | null) => {
    patchSession((prev) => ({ ...prev, canvas }));
  }, [patchSession]);

  const setLaunchBoard = useCallback((launchBoard: LaunchBoardState | null) => {
    patchSession((prev) => ({ ...prev, launchBoard }));
  }, [patchSession]);

  const hydrateSessionState = useCallback(
    async (
      entry: SavedLaunchSession,
      options?: { loadBannerImages?: boolean },
    ): Promise<LaunchLabSession> => {
      let socialBanners = entry.socialBanners ?? null;
      if (!socialBanners) {
        try {
          socialBanners = await fetchSessionSocialBanners(entry.id);
        } catch {
          /* non-blocking */
        }
      }
      const base = entryToSession({ ...entry, socialBanners: stripSocialBannersForPersistence(socialBanners) });
      const hydratedBanners = options?.loadBannerImages
        ? await hydrateSocialBannersWithStoredImages(base.id, base.socialBanners)
        : base.socialBanners;
      const ownerId = entry.isShared ? entry.ownerId : (entry.ownerId ?? userId);
      return { ...base, socialBanners: hydratedBanners, ownerId };
    },
    [userId],
  );

  const hydrateAndCache = useCallback(
    async (entry: SavedLaunchSession): Promise<LaunchLabSession> => {
      const loaded = await hydrateSessionState(entry, { loadBannerImages: false });
      hydratedCacheRef.current.set(loaded.id, loaded);
      return loaded;
    },
    [hydrateSessionState],
  );

  const prefetchSession = useCallback(
    (id: string) => {
      if (hydratedCacheRef.current.has(id) || prefetchingRef.current.has(id)) return;
      const entry =
        sessionsRef.current.find((s) => s.id === id) ??
        sharedSessionsRef.current.find((s) => s.id === id);
      if (!entry) return;
      prefetchingRef.current.add(id);
      void hydrateAndCache(entry).finally(() => {
        prefetchingRef.current.delete(id);
      });
    },
    [hydrateAndCache],
  );

  const setSocialBanners = useCallback((socialBanners: SocialBannersState | null) => {
    patchSession((prev) => ({ ...prev, socialBanners }));
  }, [patchSession]);

  const setContext = useCallback((patch: Partial<LaunchLabContext>) => {
    patchSession((prev) => ({ ...prev, context: { ...prev.context, ...patch } }));
  }, [patchSession]);

  const setCommandTab = useCallback((commandTab: LaunchCommandTab) => {
    patchSession((prev) => ({ ...prev, commandTab }));
  }, [patchSession]);

  const toggleCheckedStep = useCallback((id: string) => {
    patchSession((prev) => {
      const has = prev.checkedSteps.includes(id);
      return {
        ...prev,
        checkedSteps: has
          ? prev.checkedSteps.filter((x) => x !== id)
          : [...prev.checkedSteps, id],
      };
    });
  }, [patchSession]);

  const goToStep = useCallback((step: LaunchLabStep) => {
    patchSession((prev) => ({ ...prev, step }));
  }, [patchSession]);

  const markLaunchComplete = useCallback(() => {
    patchSession((prev) => ({
      ...prev,
      step: 4,
      completedAt: prev.completedAt ?? new Date().toISOString(),
    }));
  }, [patchSession]);

  const isReadOnly = !!resolvedSession?.ownerId && resolvedSession.ownerId !== userId;

  const newSession = useCallback(async () => {
    if (!userId || !resolvedSession) return;

    const existingEmpty = findEmptyUntitledSession(resolvedSessions);
    if (existingEmpty) {
      if (existingEmpty.id !== resolvedSession.id) {
        flushPendingSaveForSwitch();
        const loaded =
          hydratedCacheRef.current.get(existingEmpty.id) ?? entryToSession(existingEmpty);
        setSession(loaded);
        lastPersistedSessionRef.current = loaded;
        navigateToProject(existingEmpty.id);
        toast.info("Switched to your empty session");
      }
      return;
    }

    flushPendingSaveForSwitch();
    const fresh = createEmptySession();
    try {
      const entry = await insertLaunchLabSession(userId, fresh);
      setSession(fresh);
      lastPersistedSessionRef.current = fresh;
      hydratedCacheRef.current.set(fresh.id, fresh);
      setSessions((prev) => sortSessionsBySavedAt([entry, ...prev.filter((s) => s.id !== fresh.id)]));
      navigateToProject(fresh.id);
      toast.success("New Launch Lab session");
    } catch {
      toast.error("Could not create session");
    }
  }, [userId, resolvedSession, resolvedSessions, flushPendingSaveForSwitch, navigateToProject]);

  const selectSession = useCallback(
    (id: string) => {
      const activeId = sessionRef.current?.id ?? resolvedSession?.id;
      if (activeId && id === activeId) return;
      const entry = findSessionEntry(id);
      if (!entry) return;

      flushPendingSaveForSwitch();

      const cached = hydratedCacheRef.current.get(id);
      if (cached) {
        setSession(cached);
        lastPersistedSessionRef.current = cached;
        navigateToProject(id);
        return;
      }

      const quick = entryToSession(entry);
      setSession(quick);
      lastPersistedSessionRef.current = quick;
      navigateToProject(id);

      const targetId = id;
      void hydrateAndCache(entry).then((loaded) => {
        if (sessionRef.current?.id === targetId) {
          setSession(loaded);
          lastPersistedSessionRef.current = loaded;
        }
      });
    },
    [resolvedSession, findSessionEntry, flushPendingSaveForSwitch, hydrateAndCache, navigateToProject],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      if (!userId || !resolvedSession) return;

      const next = resolvedSessions.filter((s) => s.id !== id);
      const wasActive = resolvedSession.id === id;

      try {
        await deleteLaunchLabSession(userId, id);
        void clearSessionBannerImages(id);
        hydratedCacheRef.current.delete(id);

        if (wasActive) {
          if (next.length > 0) {
            const nextEntry = next[0];
            const cached = hydratedCacheRef.current.get(nextEntry.id);
            const quick = cached ?? entryToSession(nextEntry);
            setSession(quick);
            lastPersistedSessionRef.current = quick;
            setSessions(next);
            navigateToProject(nextEntry.id);
            const targetId = nextEntry.id;
            void hydrateAndCache(nextEntry).then((loaded) => {
              if (sessionRef.current?.id === targetId) {
                setSession(loaded);
                lastPersistedSessionRef.current = loaded;
              }
            });
          } else {
            const fresh = createEmptySession();
            const entry = await insertLaunchLabSession(userId, fresh);
            setSession(fresh);
            lastPersistedSessionRef.current = fresh;
            hydratedCacheRef.current.set(fresh.id, fresh);
            setSessions([entry]);
            navigateToProject(fresh.id);
          }
        } else {
          setSessions(next);
        }

        toast.success("Session removed");
      } catch {
        toast.error("Could not delete session");
      }
    },
    [userId, resolvedSession, resolvedSessions, hydrateAndCache, navigateToProject],
  );

  const resetSession = useCallback(() => {
    if (!resolvedSession) return;
    const cleared = normalizeSession({ id: resolvedSession.id });
    setSession(cleared);
    toast.success("Session cleared");
  }, [resolvedSession]);

  const saveToHistory = useCallback(() => {
    if (!resolvedSession?.pitchAnalysis && !resolvedSession?.canvas) {
      toast.error("Nothing to save yet — analyze your pitch first.");
      return;
    }
    toast.success("Session saved");
  }, [resolvedSession?.pitchAnalysis, resolvedSession?.canvas]);

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
    session: resolvedSession,
    sessions: resolvedSessions,
    sharedSessions: resolvedSharedSessions,
    history: resolvedSessions,
    sidebarVisible: resolvedSidebarVisible,
    isLoading: workspaceQuery.isPending || (!resolvedSession && !workspaceQuery.isError),
    isError: workspaceQuery.isError,
    isSaving: persistSessionMutation.isPending,
    isReadOnly,
    setRawPitch,
    setPitchAnalysis,
    setCanvas,
    setLaunchBoard,
    setSocialBanners,
    setCommandTab,
    setContext,
    toggleCheckedStep,
    goToStep,
    markLaunchComplete,
    newSession,
    selectSession,
    prefetchSession,
    deleteSession,
    resetSession,
    saveToHistory,
    loadFromHistory: selectSession,
    deleteFromHistory: deleteSession,
    persistSidebarVisible,
    persistSessionNow,
  };
}
