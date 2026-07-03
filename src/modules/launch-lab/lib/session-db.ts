import { supabase } from "@/integrations/supabase/client";
import { MAX_LAUNCH_LAB_SESSIONS } from "../constants";
import {
  createEmptySession,
  entryToSession,
  normalizeEntry,
  resolveActiveEntry,
  sessionToEntry,
  sortSessionsBySavedAt,
} from "./session-storage";
import { stripSocialBannersForPersistence, hydrateSocialBannersWithStoredImages } from "./social-banners";
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

export interface LaunchLabSessionRow {
  id: string;
  user_id: string;
  step: number;
  raw_pitch: string;
  pitch_analysis: PitchAnalysis | null;
  canvas: IdeaCanvasResult | null;
  context: LaunchLabContext;
  checked_steps: string[];
  launch_board: LaunchBoardState | null;
  social_banners: SocialBannersState | null;
  command_tab: string;
  product_name: string;
  overall_score: number | null;
  completed_at: string | null;
  saved_at: string;
  created_at: string;
  updated_at: string;
}

export interface LaunchLabPreferencesRow {
  user_id: string;
  active_session_id: string | null;
  sidebar_visible: boolean;
  updated_at: string;
}

const SESSION_LIST_SELECT =
  "id, user_id, step, raw_pitch, pitch_analysis, canvas, context, checked_steps, launch_board, command_tab, product_name, overall_score, completed_at, saved_at, created_at, updated_at";

const SESSION_SELECT = `${SESSION_LIST_SELECT}, social_banners`;

type LaunchLabSessionListRow = Omit<LaunchLabSessionRow, "social_banners">;

function rowToEntry(row: LaunchLabSessionRow | LaunchLabSessionListRow): SavedLaunchSession {
  return normalizeEntry({
    id: row.id,
    savedAt: row.saved_at,
    productName: row.product_name,
    overall: row.overall_score,
    step: row.step as LaunchLabStep,
    rawPitch: row.raw_pitch,
    pitchAnalysis: row.pitch_analysis,
    canvas: row.canvas,
    context: row.context,
    checkedSteps: Array.isArray(row.checked_steps) ? row.checked_steps : [],
    launchBoard: row.launch_board,
    socialBanners:
      "social_banners" in row ? stripSocialBannersForPersistence(row.social_banners) : null,
    commandTab: "command_tab" in row && row.command_tab ? (row.command_tab as SavedLaunchSession["commandTab"]) : undefined,
    completedAt: "completed_at" in row ? row.completed_at : null,
  });
}

export async function fetchSessionSocialBanners(
  sessionId: string,
): Promise<SocialBannersState | null> {
  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .select("social_banners")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  const row = data as { social_banners?: SocialBannersState | null } | null;
  return stripSocialBannersForPersistence(row?.social_banners ?? null);
}

function sessionToPayload(session: LaunchLabSession, userId: string, savedAt?: string) {
  const entry = sessionToEntry(session, savedAt);
  return {
    id: session.id,
    user_id: userId,
    step: session.step,
    raw_pitch: session.rawPitch,
    pitch_analysis: session.pitchAnalysis,
    canvas: session.canvas,
    context: session.context,
    checked_steps: session.checkedSteps ?? [],
    launch_board: session.launchBoard,
    social_banners: stripSocialBannersForPersistence(session.socialBanners),
    command_tab: session.commandTab,
    product_name: entry.productName,
    overall_score: entry.overall,
    saved_at: entry.savedAt,
    completed_at: session.completedAt,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchSharedLaunchLabSessions(userId: string): Promise<SavedLaunchSession[]> {
  const { data: shareRows, error: shareError } = await supabase
    .from("launch_lab_session_shares")
    .select("session_id, created_at, shared_by_user_id")
    .eq("shared_with_user_id", userId)
    .order("created_at", { ascending: false });

  if (shareError) throw shareError;
  if (!shareRows?.length) return [];

  const shareMeta = new Map(
    shareRows.map((row) => [
      row.session_id,
      { sharedAt: row.created_at, ownerId: row.shared_by_user_id },
    ]),
  );
  const sessionIds = shareRows.map((row) => row.session_id);

  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .select(SESSION_LIST_SELECT)
    .in("id", sessionIds);

  if (error) throw error;

  const entries =
    (data as LaunchLabSessionListRow[] | null)?.map((row) => {
      const meta = shareMeta.get(row.id);
      return {
        ...rowToEntry(row),
        isShared: true,
        ownerId: row.user_id,
        sharedAt: meta?.sharedAt ?? null,
      };
    }) ?? [];

  return entries.sort((a, b) => {
    const aTime = a.sharedAt ? new Date(a.sharedAt).getTime() : 0;
    const bTime = b.sharedAt ? new Date(b.sharedAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function fetchLaunchLabSessions(userId: string): Promise<SavedLaunchSession[]> {
  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .select(SESSION_LIST_SELECT)
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(MAX_LAUNCH_LAB_SESSIONS);

  if (error) throw error;
  return sortSessionsBySavedAt(
    (data as LaunchLabSessionListRow[] | null)?.map(rowToEntry) ?? [],
  );
}

export async function fetchLaunchLabPreferences(
  userId: string,
): Promise<LaunchLabPreferencesRow | null> {
  const { data, error } = await supabase
    .from("launch_lab_preferences")
    .select("user_id, active_session_id, sidebar_visible, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as LaunchLabPreferencesRow | null;
}

export async function upsertLaunchLabSession(
  userId: string,
  session: LaunchLabSession,
  savedAt?: string,
): Promise<SavedLaunchSession> {
  const payload = sessionToPayload(session, userId, savedAt);

  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .upsert(payload as never, { onConflict: "id" })
    .select(SESSION_SELECT)
    .single();

  if (error) throw error;
  await trimLaunchLabSessions(userId);
  return rowToEntry(data as LaunchLabSessionRow);
}

export async function insertLaunchLabSession(
  userId: string,
  session: LaunchLabSession,
): Promise<SavedLaunchSession> {
  const payload = sessionToPayload(session, userId);

  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .insert(payload as never)
    .select(SESSION_SELECT)
    .single();

  if (error) throw error;
  await trimLaunchLabSessions(userId);
  return rowToEntry(data as LaunchLabSessionRow);
}

export async function deleteLaunchLabSession(userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("launch_lab_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("id", sessionId);

  if (error) throw error;
}

async function trimLaunchLabSessions(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data || data.length <= MAX_LAUNCH_LAB_SESSIONS) return;

  const excessIds = data.slice(MAX_LAUNCH_LAB_SESSIONS).map((row) => row.id);
  await supabase
    .from("launch_lab_sessions")
    .delete()
    .eq("user_id", userId)
    .in("id", excessIds);
}

export async function upsertLaunchLabPreferences(
  userId: string,
  patch: Partial<Pick<LaunchLabPreferencesRow, "active_session_id" | "sidebar_visible">>,
): Promise<LaunchLabPreferencesRow> {
  const current = await fetchLaunchLabPreferences(userId);

  const payload = {
    user_id: userId,
    active_session_id: patch.active_session_id ?? current?.active_session_id ?? null,
    sidebar_visible: patch.sidebar_visible ?? current?.sidebar_visible ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("launch_lab_preferences")
    .upsert(payload as never, { onConflict: "user_id" })
    .select("user_id, active_session_id, sidebar_visible, updated_at")
    .single();

  if (error) throw error;
  return data as LaunchLabPreferencesRow;
}

export async function loadLaunchLabWorkspace(
  userId: string,
  preferredProjectId?: string,
): Promise<{
  session: LaunchLabSession;
  sessions: SavedLaunchSession[];
  sharedSessions: SavedLaunchSession[];
  sidebarVisible: boolean;
}> {
  const [sessions, preferences, sharedSessions] = await Promise.all([
    fetchLaunchLabSessions(userId),
    fetchLaunchLabPreferences(userId),
    fetchSharedLaunchLabSessions(userId),
  ]);

  let resolvedSessions = sessions;

  if (resolvedSessions.length === 0) {
    const fresh = createEmptySession();
    const entry = await insertLaunchLabSession(userId, fresh);
    resolvedSessions = [entry];
    await upsertLaunchLabPreferences(userId, {
      active_session_id: entry.id,
      sidebar_visible: true,
    });
    return {
      session: await hydrateSessionEntry(entry, userId),
      sessions: resolvedSessions,
      sharedSessions,
      sidebarVisible: true,
    };
  }

  const preferredOwned = preferredProjectId
    ? resolvedSessions.find((entry) => entry.id === preferredProjectId)
    : undefined;
  const preferredShared = preferredProjectId
    ? sharedSessions.find((entry) => entry.id === preferredProjectId)
    : undefined;

  if (preferredProjectId && !preferredOwned && !preferredShared) {
    const sharedSession = await fetchLaunchLabSessionById(preferredProjectId);
    if (sharedSession) {
      return {
        session: sharedSession,
        sessions: resolvedSessions,
        sharedSessions,
        sidebarVisible: preferences?.sidebar_visible ?? true,
      };
    }
    throw new Error("Launch Lab project not found or you do not have access.");
  }

  const activeEntry =
    preferredOwned ??
    preferredShared ??
    resolvedSessions.find((entry) => entry.id === preferences?.active_session_id) ??
    sharedSessions.find((entry) => entry.id === preferences?.active_session_id) ??
    resolveActiveEntry(resolvedSessions, null);

  const socialBanners = await fetchSessionSocialBanners(activeEntry.id);
  const activeWithBanners: SavedLaunchSession = {
    ...activeEntry,
    socialBanners,
  };

  resolvedSessions = resolvedSessions.map((entry) =>
    entry.id === activeWithBanners.id ? activeWithBanners : entry,
  );

  const isOwnedActive = resolvedSessions.some((entry) => entry.id === activeEntry.id);
  if (isOwnedActive && preferences?.active_session_id !== activeEntry.id) {
    await upsertLaunchLabPreferences(userId, { active_session_id: activeEntry.id });
  }

  const ownerId = activeEntry.isShared ? activeEntry.ownerId : userId;

  return {
    session: await hydrateSessionEntry(activeWithBanners, ownerId),
    sessions: resolvedSessions,
    sharedSessions,
    sidebarVisible: preferences?.sidebar_visible ?? true,
  };
}

export async function fetchLaunchLabSessionById(sessionId: string): Promise<LaunchLabSession | null> {
  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as LaunchLabSessionRow;
  const entry = rowToEntry(row);
  const socialBanners = stripSocialBannersForPersistence(row.social_banners);
  return hydrateSessionEntry({ ...entry, socialBanners }, row.user_id);
}

async function hydrateSessionEntry(
  entry: SavedLaunchSession,
  ownerId?: string,
  options?: { loadBannerImages?: boolean },
): Promise<LaunchLabSession> {
  const session = entryToSession(entry);
  const socialBanners = options?.loadBannerImages
    ? await hydrateSocialBannersWithStoredImages(session.id, session.socialBanners)
    : session.socialBanners;
  return { ...session, socialBanners, ownerId: ownerId ?? session.ownerId };
}
