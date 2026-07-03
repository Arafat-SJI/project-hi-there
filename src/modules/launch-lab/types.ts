export type LaunchLabStep = 1 | 2 | 3 | 4;

export type PitchType =
  | "project_idea"
  | "business_plan"
  | "product_plan"
  | "elevator"
  | "investor"
  | "customer"
  | "demo_day";
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

export type LaunchFlowNodeType = "week" | "task" | "goal" | "custom";

export interface LaunchFlowNodeData {
  label: string;
  detail?: string;
  week?: number;
  goals?: string[];
  sourceId?: string;
}

export interface LaunchFlowNode {
  id: string;
  type: LaunchFlowNodeType;
  position: { x: number; y: number };
  data: LaunchFlowNodeData;
}

export interface LaunchFlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface LaunchBoardState {
  nodes: LaunchFlowNode[];
  edges: LaunchFlowEdge[];
}

export interface LaunchLabSession {
  id: string;
  step: LaunchLabStep;
  rawPitch: string;
  pitchAnalysis: PitchAnalysis | null;
  canvas: IdeaCanvasResult | null;
  context: LaunchLabContext;
  checkedSteps: string[];
  launchBoard: LaunchBoardState | null;
  socialBanners: SocialBannersState | null;
  commandTab: LaunchCommandTab;
  completedAt: string | null;
  /** Set when loading a session row; used for read-only shared access */
  ownerId?: string;
}

export interface LaunchLabSessionShare {
  id: string;
  sessionId: string;
  sharedWithUserId: string;
  sharedByUserId: string;
  createdAt: string;
  sharedWithEmail?: string | null;
  sharedWithName?: string | null;
}

export interface LaunchLabShareableUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface SavedLaunchSession {
  id: string;
  savedAt: string;
  productName: string;
  overall: number | null;
  step?: LaunchLabStep;
  rawPitch: string;
  pitchAnalysis: PitchAnalysis | null;
  canvas: IdeaCanvasResult | null;
  context: LaunchLabContext;
  checkedSteps: string[];
  launchBoard?: LaunchBoardState | null;
  socialBanners?: SocialBannersState | null;
  commandTab?: LaunchCommandTab;
  completedAt?: string | null;
  /** True when this session was shared with the current user */
  isShared?: boolean;
  /** Owner user id (set for shared sessions) */
  ownerId?: string;
  sharedAt?: string | null;
}

export type LaunchLabSessionState = LaunchLabSession;

export type LaunchLabAgentMode = "pitch" | "canvas" | "social-post";

export type LaunchCommandTab = "flow" | "banners" | "brief";

export type BannerPlatform = "linkedin" | "facebook" | "instagram" | "x";

export type BannerAspectRatio = "1.91:1" | "1.9:1" | "16:9" | "4:5" | "1:1" | "4:3" | "3:2";

export interface SocialBannerItem {
  imageUrl: string | null;
  variantIndex: number;
  aspectRatio: BannerAspectRatio;
  suggestedPost: string | null;
}

export interface SocialBannersState {
  hasGenerated: boolean;
  initialized: boolean;
  postsCreated: boolean;
  linkedin: SocialBannerItem;
  facebook: SocialBannerItem;
  instagram: SocialBannerItem;
  x: SocialBannerItem;
}

export interface SocialPostGenerateInput {
  platform: BannerPlatform;
  product_name?: string;
  headline?: string;
  tagline?: string;
  one_liner?: string;
  pitch_type?: PitchType;
  audience?: PitchAudience;
  industry?: PitchIndustry;
}

export interface SocialPostAgentResponse {
  mode: "social-post";
  platform: BannerPlatform;
  post_copy: string;
}

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
