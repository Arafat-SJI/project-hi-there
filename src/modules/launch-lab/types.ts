export type LaunchLabStep = 1 | 2;

export type PitchType = "elevator" | "investor" | "customer" | "demo_day";
export type PitchAudience = "investors" | "customers" | "partners" | "internal_team";
export type PitchIndustry =
  | "saas"
  | "fintech"
  | "healthtech"
  | "ecommerce"
  | "ai"
  | "agency"
  | "general";

export interface PitchScores {
  clarity: number;
  structure: number;
  value: number;
  cta: number;
}

export interface PitchObjection {
  question: string;
  suggested_answer: string;
}

export interface PitchWeakMoment {
  excerpt: string;
  issue: string;
  severity?: "low" | "medium" | "high";
  suggestion?: string;
}

export interface PitchKpi {
  label: string;
  target: string;
  timeframe?: string;
  rationale?: string;
}

export interface PitchMilestone {
  week: number;
  title: string;
  goals: string[];
  description?: string;
  deliverables?: string[];
}

export interface PitchAnalysis {
  scores: PitchScores;
  overall: number;
  ready_for_planning: boolean;
  improved_pitch: string;
  fixes: string[];
  objections: PitchObjection[];
  weak_moments: PitchWeakMoment[];
  headline?: string;
  tagline?: string;
  one_liner?: string;
  strengths?: string[];
  practice_questions?: string[];
  target_audience_fit?: string;
}

export interface CanvasNote {
  id: string;
  title: string;
  detail: string;
}

export interface IdeaCanvasClusters {
  problems: CanvasNote[];
  ideas: CanvasNote[];
  risks: CanvasNote[];
  next_steps: CanvasNote[];
}

export interface IdeaCanvasResult {
  clusters: IdeaCanvasClusters;
  synthesis: string;
  kpis?: PitchKpi[];
  milestones?: PitchMilestone[];
  elevator_hooks?: string[];
}

export interface LaunchLabContext {
  pitchType: PitchType;
  audience: PitchAudience;
  industry: PitchIndustry;
  productName: string;
}

export interface LaunchLabSession {
  step: LaunchLabStep;
  rawPitch: string;
  pitchAnalysis: PitchAnalysis | null;
  canvas: IdeaCanvasResult | null;
  context: LaunchLabContext;
  checkedSteps: string[];
}

export interface SavedLaunchSession {
  id: string;
  savedAt: string;
  productName: string;
  overall: number | null;
  rawPitch: string;
  pitchAnalysis: PitchAnalysis | null;
  canvas: IdeaCanvasResult | null;
  context: LaunchLabContext;
  checkedSteps: string[];
}

export type LaunchLabSessionState = LaunchLabSession;

export type LaunchLabAgentMode = "pitch" | "canvas";

export interface PitchAgentResponse extends PitchAnalysis {
  mode: "pitch";
}

export interface CanvasAgentResponse extends IdeaCanvasResult {
  mode: "canvas";
}

export interface PitchAnalyzeInput {
  pitch: string;
  pitch_type: PitchType;
  audience: PitchAudience;
  industry: PitchIndustry;
  product_name?: string;
}

export interface CanvasGenerateInput {
  improved_pitch: string;
  pitch_type: PitchType;
  audience: PitchAudience;
  industry: PitchIndustry;
  product_name?: string;
}
