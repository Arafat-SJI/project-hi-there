import {
  DEFAULT_CONTEXT,
  LAUNCH_LAB_ACTIVE_ID_KEY,
  LAUNCH_LAB_HISTORY_KEY,
  LAUNCH_LAB_SESSIONS_KEY,
  LAUNCH_LAB_SIDEBAR_VISIBLE_KEY,
  LAUNCH_LAB_STORAGE_KEY,
  MAX_LAUNCH_LAB_SESSIONS,
} from "../constants";
import { deriveSessionTitle } from "./session-title";
import type { IdeaCanvasResult, LaunchBoardState, LaunchLabSession, LaunchLabStep, PitchAnalysis, PitchScores, SavedLaunchSession } from "../types";

function safeStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hasValidCanvas(canvas: IdeaCanvasResult | null | undefined): boolean {
  return !!canvas?.clusters;
}

function normalizePitchAnalysis(analysis: PitchAnalysis | null | undefined): PitchAnalysis | null {
  if (!analysis || typeof analysis !== "object") return null;

  const scores = analysis.scores as Partial<PitchScores> | undefined;
  const normalizedScores: PitchScores = {
    clarity: Number(scores?.clarity ?? 0),
    structure: Number(scores?.structure ?? 0),
    value: Number(scores?.value ?? 0),
    cta: Number(scores?.cta ?? 0),
  };

  return {
    ...analysis,
    scores: normalizedScores,
    overall: Number(analysis.overall ?? 0),
    ready_for_planning: !!analysis.ready_for_planning,
    improved_pitch: safeStr(analysis.improved_pitch),
    fixes: Array.isArray(analysis.fixes) ? analysis.fixes : [],
    objections: Array.isArray(analysis.objections) ? analysis.objections : [],
    weak_moments: Array.isArray(analysis.weak_moments) ? analysis.weak_moments : [],
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : undefined,
    practice_questions: Array.isArray(analysis.practice_questions)
      ? analysis.practice_questions
      : undefined,
  };
}

function normalizeCanvas(canvas: IdeaCanvasResult | null | undefined): IdeaCanvasResult | null {
  if (!canvas?.clusters) return null;

  return {
    clusters: {
      problems: Array.isArray(canvas.clusters.problems) ? canvas.clusters.problems : [],
      ideas: Array.isArray(canvas.clusters.ideas) ? canvas.clusters.ideas : [],
      risks: Array.isArray(canvas.clusters.risks) ? canvas.clusters.risks : [],
      next_steps: Array.isArray(canvas.clusters.next_steps) ? canvas.clusters.next_steps : [],
    },
    synthesis: safeStr(canvas.synthesis),
    kpis: Array.isArray(canvas.kpis) ? canvas.kpis : undefined,
    milestones: Array.isArray(canvas.milestones) ? canvas.milestones : undefined,
    elevator_hooks: Array.isArray(canvas.elevator_hooks) ? canvas.elevator_hooks : undefined,
  };
}

function resolveStep(session: Partial<LaunchLabSession>): LaunchLabStep {
  const savedStep = session.step;
  if (savedStep === 3 && hasValidCanvas(session.canvas)) return 3;
  if (hasValidCanvas(session.canvas)) return savedStep === 3 ? 3 : 2;
  if (savedStep === 2 && session.pitchAnalysis) return 2;
  return 1;
}

export function normalizeSession(
  session: Partial<LaunchLabSession> & { id?: string },
): LaunchLabSession {
  const base = createEmptySession(session.id);
  const canvas = normalizeCanvas(session.canvas);
  const pitchAnalysis = normalizePitchAnalysis(session.pitchAnalysis);
  return {
    ...base,
    ...session,
    id: session.id || base.id,
    step: resolveStep({ ...session, canvas, pitchAnalysis }),
    rawPitch: safeStr(session.rawPitch),
    pitchAnalysis,
    canvas,
    context: {
      ...DEFAULT_CONTEXT,
      ...(session.context ?? {}),
      productName: safeStr(session.context?.productName),
    },
    checkedSteps: Array.isArray(session.checkedSteps) ? session.checkedSteps : [],
    launchBoard: session.launchBoard ?? null,
  };
}

export function normalizeEntry(entry: Partial<SavedLaunchSession> & { id?: string }): SavedLaunchSession {
  const session = normalizeSession({
    id: entry.id,
    step: entry.step ?? (hasValidCanvas(entry.canvas ?? null) ? 2 : 1),
    rawPitch: entry.rawPitch,
    pitchAnalysis: entry.pitchAnalysis ?? null,
    canvas: entry.canvas ?? null,
    context: entry.context,
    checkedSteps: entry.checkedSteps,
    launchBoard: entry.launchBoard ?? null,
  });

  return {
    ...sessionToEntry(session, entry.savedAt),
    savedAt: entry.savedAt ?? new Date().toISOString(),
  };
}

export function createEmptySession(id?: string): LaunchLabSession {
  return {
    id: id ?? crypto.randomUUID(),
    step: 1,
    rawPitch: "",
    pitchAnalysis: null,
    canvas: null,
    context: { ...DEFAULT_CONTEXT },
    checkedSteps: [],
    launchBoard: null,
  };
}

export function sessionToEntry(session: LaunchLabSession, savedAt?: string): SavedLaunchSession {
  return {
    id: session.id,
    savedAt: savedAt ?? new Date().toISOString(),
    productName: deriveSessionTitle(session),
    overall: session.pitchAnalysis?.overall ?? null,
    rawPitch: safeStr(session.rawPitch),
    pitchAnalysis: session.pitchAnalysis,
    canvas: session.canvas,
    context: session.context,
    checkedSteps: session.checkedSteps ?? [],
    step: session.step,
    launchBoard: session.launchBoard ?? null,
  };
}

export function entryToSession(entry: SavedLaunchSession): LaunchLabSession {
  return normalizeSession({
    id: entry.id,
    step: entry.step ?? (hasValidCanvas(entry.canvas) ? 2 : 1),
    rawPitch: entry.rawPitch,
    pitchAnalysis: entry.pitchAnalysis,
    canvas: entry.canvas,
    context: entry.context,
    checkedSteps: entry.checkedSteps,
    launchBoard: entry.launchBoard ?? null,
  });
}

export function isSessionEmpty(session: LaunchLabSession): boolean {
  return (
    session.step === 1 &&
    !safeStr(session.rawPitch).trim() &&
    !session.pitchAnalysis &&
    !session.canvas &&
    !session.launchBoard &&
    !safeStr(session.context?.productName).trim() &&
    (session.checkedSteps?.length ?? 0) === 0
  );
}

export function isEntryEmpty(entry: SavedLaunchSession): boolean {
  return isSessionEmpty(entryToSession(entry));
}

export function findEmptyUntitledSession(
  sessions: SavedLaunchSession[],
): SavedLaunchSession | undefined {
  return sessions.find((entry) => {
    const title = deriveSessionTitle(entry);
    return title === "Untitled" && isEntryEmpty(entry);
  });
}

export function readSidebarVisible(): boolean {
  try {
    return localStorage.getItem(LAUNCH_LAB_SIDEBAR_VISIBLE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function persistSidebarVisible(visible: boolean) {
  localStorage.setItem(LAUNCH_LAB_SIDEBAR_VISIBLE_KEY, visible ? "true" : "false");
}

function readSessions(): SavedLaunchSession[] {
  try {
    const raw = localStorage.getItem(LAUNCH_LAB_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SavedLaunchSession>[];
    return parsed.map((entry) => normalizeEntry(entry));
  } catch {
    return [];
  }
}

export function sessionRichness(entry: SavedLaunchSession): number {
  let score = 0;
  if (entry.pitchAnalysis) score += 100;
  if (entry.canvas?.clusters) score += 200;
  if (safeStr(entry.rawPitch).trim().length > 20) score += 50;
  if (safeStr(entry.context?.productName).trim()) score += 5;
  return score;
}

export function sortSessionsBySavedAt(sessions: SavedLaunchSession[]): SavedLaunchSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

function mergeSessionEntries(entries: SavedLaunchSession[]): SavedLaunchSession[] {
  const map = new Map<string, SavedLaunchSession>();

  for (const entry of entries) {
    const normalized = normalizeEntry(entry);
    const existing = map.get(normalized.id);
    if (!existing || sessionRichness(normalized) > sessionRichness(existing)) {
      map.set(normalized.id, normalized);
    }
  }

  return sortSessionsBySavedAt([...map.values()]);
}

function collapseEmptyDuplicates(sessions: SavedLaunchSession[]): SavedLaunchSession[] {
  let keeper: SavedLaunchSession | null = null;
  const withContent: SavedLaunchSession[] = [];

  for (const entry of sessions) {
    if (isEntryEmpty(entry)) {
      if (!keeper) keeper = entry;
    } else {
      withContent.push(entry);
    }
  }

  if (!keeper) return withContent;
  return sortSessionsBySavedAt([keeper, ...withContent]);
}

function collectLegacyHistoryEntries(): SavedLaunchSession[] {
  try {
    const historyRaw = localStorage.getItem(LAUNCH_LAB_HISTORY_KEY);
    if (!historyRaw) return [];
    const history = JSON.parse(historyRaw) as Partial<SavedLaunchSession>[];
    return history.map((entry) => normalizeEntry(entry));
  } catch {
    return [];
  }
}

function collectLegacyActiveSession(): SavedLaunchSession | null {
  try {
    const sessionRaw = localStorage.getItem(LAUNCH_LAB_STORAGE_KEY);
    if (!sessionRaw) return null;

    const parsed = JSON.parse(sessionRaw) as Partial<LaunchLabSession> & {
      id?: string;
      savedAt?: string;
    };

    const hasContent =
      safeStr(parsed.rawPitch).trim() ||
      parsed.pitchAnalysis ||
      parsed.canvas ||
      safeStr(parsed.context?.productName).trim();

    if (!hasContent) return null;

    return normalizeEntry({
      id: parsed.id,
      savedAt: parsed.savedAt,
      rawPitch: parsed.rawPitch,
      pitchAnalysis: parsed.pitchAnalysis ?? null,
      canvas: parsed.canvas ?? null,
      context: parsed.context,
      checkedSteps: parsed.checkedSteps,
    });
  } catch {
    return null;
  }
}

function reconcileSessions(): SavedLaunchSession[] {
  const stored = readSessions();
  const legacyHistory = collectLegacyHistoryEntries();
  const legacyActive = collectLegacyActiveSession();

  const merged = collapseEmptyDuplicates(
    mergeSessionEntries([
      ...stored,
      ...legacyHistory,
      ...(legacyActive ? [legacyActive] : []),
    ]),
  );

  if (merged.length > 0) {
    persistSessions(merged);
    return merged;
  }

  const session = createEmptySession();
  const entry = sessionToEntry(session);
  persistSessions([entry]);
  return [entry];
}

function resolveActiveEntry(
  sessions: SavedLaunchSession[],
  activeId: string | null,
): SavedLaunchSession {
  const sorted = sortSessionsBySavedAt(sessions);

  if (activeId) {
    const preferred = sorted.find((s) => s.id === activeId);
    if (preferred && !isEntryEmpty(preferred)) return preferred;
  }

  const richest = sorted.find((s) => sessionRichness(s) > 0);
  if (richest) return richest;

  if (activeId) {
    const preferred = sorted.find((s) => s.id === activeId);
    if (preferred) return preferred;
  }

  return sorted[0];
}

function migrateLegacyStorage(): SavedLaunchSession[] {
  return reconcileSessions();
}

export function persistSessions(sessions: SavedLaunchSession[]) {
  localStorage.setItem(
    LAUNCH_LAB_SESSIONS_KEY,
    JSON.stringify(sessions.slice(0, MAX_LAUNCH_LAB_SESSIONS)),
  );
}

export function persistActiveId(id: string) {
  localStorage.setItem(LAUNCH_LAB_ACTIVE_ID_KEY, id);
}

export function loadLaunchLabWorkspace(): {
  session: LaunchLabSession;
  sessions: SavedLaunchSession[];
} {
  try {
    const sessions = migrateLegacyStorage();

    if (sessions.length === 0) {
      const session = createEmptySession();
      const entry = sessionToEntry(session);
      persistSessions([entry]);
      persistActiveId(session.id);
      return { session, sessions: [entry] };
    }

    const activeId = localStorage.getItem(LAUNCH_LAB_ACTIVE_ID_KEY);
    const activeEntry = resolveActiveEntry(sessions, activeId);
    persistActiveId(activeEntry.id);

    return {
      session: entryToSession(activeEntry),
      sessions,
    };
  } catch (error) {
    console.error("[launch-lab] Failed to load workspace, resetting:", error);
    const session = createEmptySession();
    const entry = sessionToEntry(session);
    persistSessions([entry]);
    persistActiveId(session.id);
    return { session, sessions: [entry] };
  }
}
