import type { PitchAudience, PitchIndustry, PitchType } from "./types";

export const SAMPLE_PITCHES = [
  {
    label: "Project idea",
    productName: "FlowStack",
    text: `FlowStack is a project management platform for remote agencies.
We want to unify client work, tasks, and billable hours in one workspace.
Target users are 10–50 person creative and dev agencies.
Next step: validate with 5 agency interviews and a clickable prototype.`,
  },
  {
    label: "SaaS pitch",
    productName: "FlowStack",
    text: `We're building FlowStack, a project management tool for remote agencies. 
It helps teams track client work and billable hours in one place. 
We have 12 beta users and $4k MRR. We're raising a pre-seed round to hire two engineers 
and expand to mid-size agencies in the US. Our ask is $500k.`,
  },
  {
    label: "AI assistant",
    productName: "CollabAI",
    text: `CollabAI helps businesses run operations with AI agents. 
We connect meetings, CRM, and knowledge base so teams stop switching between ten apps. 
Early customers save about 8 hours per week. We want partners who understand B2B SaaS.`,
  },
  {
    label: "Fintech pitch",
    productName: "PayBridge",
    text: `PayBridge automates invoice reconciliation for SMB accountants. 
We reduce manual matching from 6 hours to 20 minutes per week using AI document parsing. 
Pilot with 3 accounting firms, $12k ARR. Seeking $750k seed to expand sales.`,
  },
  {
    label: "Needs work (demo)",
    productName: "MyApp",
    text: `We have an app. It's good. People like it. We need money to grow.`,
  },
] as const;

export const PITCH_TYPES: { value: PitchType; label: string; description: string }[] = [
  { value: "project_idea", label: "Project idea", description: "Early concept or product vision" },
  { value: "business_plan", label: "Business plan", description: "Strategy, market, and goals" },
  { value: "product_plan", label: "Product plan", description: "Roadmap and feature direction" },
  { value: "elevator", label: "Elevator", description: "30–60 second hook" },
  { value: "investor", label: "Investor", description: "Fundraising narrative" },
  { value: "customer", label: "Customer", description: "Buyer-focused value" },
  { value: "demo_day", label: "Demo day", description: "Stage presentation" },
];

export const PITCH_AUDIENCES: { value: PitchAudience; label: string }[] = [
  { value: "investors", label: "Investors / VCs" },
  { value: "customers", label: "Prospective customers" },
  { value: "partners", label: "Strategic partners" },
  { value: "internal_team", label: "Internal team" },
];

export const PITCH_INDUSTRIES: { value: PitchIndustry; label: string }[] = [
  { value: "saas", label: "B2B SaaS" },
  { value: "ai", label: "AI / ML" },
  { value: "fintech", label: "Fintech" },
  { value: "healthtech", label: "Healthtech" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "agency", label: "Agency / Services" },
  { value: "general", label: "General / Other" },
];

export const CLUSTER_META = {
  problems: {
    label: "Problems",
    emoji: "🎯",
    color: "border-orange-500/50 bg-gradient-to-br from-orange-500/15 to-orange-600/5",
    header: "from-orange-500/20",
  },
  ideas: {
    label: "Ideas",
    emoji: "💡",
    color: "border-blue-500/50 bg-gradient-to-br from-blue-500/15 to-violet-600/5",
    header: "from-blue-500/20",
  },
  risks: {
    label: "Risks",
    emoji: "⚠️",
    color: "border-red-500/50 bg-gradient-to-br from-red-500/15 to-rose-600/5",
    header: "from-red-500/20",
  },
  next_steps: {
    label: "Next steps",
    emoji: "🚀",
    color: "border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-teal-600/5",
    header: "from-emerald-500/20",
  },
} as const;

export const PITCH_READY_THRESHOLD = 60;
export const LAUNCH_LAB_STORAGE_KEY = "launch-lab-session-v2";
export const LAUNCH_LAB_HISTORY_KEY = "launch-lab-history-v1";
export const LAUNCH_LAB_SESSIONS_KEY = "launch-lab-sessions-v1";
export const LAUNCH_LAB_ACTIVE_ID_KEY = "launch-lab-active-id-v1";
export const LAUNCH_LAB_SIDEBAR_VISIBLE_KEY = "launch-lab-sidebar-visible-v1";
export const LAUNCH_LAB_SIDEBAR_WIDTH = 260;
export const MAX_LAUNCH_LAB_SESSIONS = 20;

export const DEFAULT_CONTEXT = {
  pitchType: "investor" as PitchType,
  audience: "investors" as PitchAudience,
  industry: "saas" as PitchIndustry,
  productName: "",
};
