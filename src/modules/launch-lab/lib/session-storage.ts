import { DEFAULT_CONTEXT, MAX_LAUNCH_LAB_SESSIONS } from "../constants";
import { deriveSessionTitle } from "./session-title";
import { normalizeSocialBanners } from "./social-banners";
import type {
  IdeaCanvasResult,
  LaunchBoardState,
  LaunchLabSession,
  LaunchLabStep,
  PitchAnalysis,
  PitchScores,
  SavedLaunchSession,
} from "../types";

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
    socialBanners: normalizeSocialBanners(session.socialBanners),
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
    socialBanners: entry.socialBanners,
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
    socialBanners: null,
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
    socialBanners: session.socialBanners ?? null,
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
    socialBanners: normalizeSocialBanners(entry.socialBanners),
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

export function resolveActiveEntry(
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
