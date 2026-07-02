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
  product_name: string;
  overall_score: number | null;
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

const SESSION_SELECT =
  "id, user_id, step, raw_pitch, pitch_analysis, canvas, context, checked_steps, launch_board, social_banners, product_name, overall_score, saved_at, created_at, updated_at";

function rowToEntry(row: LaunchLabSessionRow): SavedLaunchSession {
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
    socialBanners: row.social_banners,
  });
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
    social_banners: session.socialBanners,
    product_name: entry.productName,
    overall_score: entry.overall,
    saved_at: entry.savedAt,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchLaunchLabSessions(userId: string): Promise<SavedLaunchSession[]> {
  const { data, error } = await supabase
    .from("launch_lab_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(MAX_LAUNCH_LAB_SESSIONS);

  if (error) throw error;
  return sortSessionsBySavedAt((data as LaunchLabSessionRow[] | null)?.map(rowToEntry) ?? []);
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

export async function loadLaunchLabWorkspace(userId: string): Promise<{
  session: LaunchLabSession;
  sessions: SavedLaunchSession[];
  sidebarVisible: boolean;
}> {
  const [sessions, preferences] = await Promise.all([
    fetchLaunchLabSessions(userId),
    fetchLaunchLabPreferences(userId),
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
      session: entryToSession(entry),
      sessions: resolvedSessions,
      sidebarVisible: true,
    };
  }

  const activeEntry = resolveActiveEntry(resolvedSessions, preferences?.active_session_id ?? null);

  if (preferences?.active_session_id !== activeEntry.id) {
    await upsertLaunchLabPreferences(userId, { active_session_id: activeEntry.id });
  }

  return {
    session: entryToSession(activeEntry),
    sessions: resolvedSessions,
    sidebarVisible: preferences?.sidebar_visible ?? true,
  };
}
