/**
 * Agent Team Configuration
 *
 * Static mapping of agent teams to sections. Each team has a set of agents
 * with Lucide icon names, descriptions, and gradient colors.
 */

export interface AgentTeamAgent {
  name: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface AgentTeamDef {
  id: string;
  name: string;
  tagline: string;
  accentColor: string; // Tailwind border color class
  gradientFrom: string; // HSL values for gradient start
  gradientTo: string; // HSL values for gradient end
  agents: AgentTeamAgent[];
}

export const agentTeams: Record<string, AgentTeamDef> = {
  sales: {
    id: "sales",
    name: "Sales Intelligence Team",
    tagline: "AI agents that help you close deals faster",
    accentColor: "border-b-red-500",
    gradientFrom: "280 70% 50%",
    gradientTo: "330 80% 55%",
    agents: [
      {
        name: "Deal Coach",
        slug: "deal-coach",
        description: "Get real-time coaching and strategy suggestions for your active deals",
        icon: "Trophy",
      },
      {
        name: "Daily Briefing",
        slug: "deal-daily-briefing",
        description: "Start your day with an AI-curated summary of pipeline changes",
        icon: "Newspaper",
      },
      {
        name: "Quick Deal Email",
        slug: "quick-deal-email",
        description: "Draft personalized follow-up emails in seconds",
        icon: "Mail",
      },
      {
        name: "Deal AI Chat",
        slug: "deal-ai-chat",
        description: "Ask anything about your deals, clients, and pipeline",
        icon: "MessageSquare",
      },
    ],
  },
  meetings: {
    id: "meetings",
    name: "Meeting AI Team",
    tagline: "Never miss a detail from any meeting again",
    accentColor: "border-b-blue-500",
    gradientFrom: "190 80% 45%",
    gradientTo: "210 85% 55%",
    agents: [
      {
        name: "Meeting Summarizer",
        slug: "meeting-summarizer",
        description: "Get concise, actionable summaries from any meeting transcript",
        icon: "FileText",
      },
      {
        name: "Action Extractor",
        slug: "action-item-extractor",
        description: "Automatically pull action items and assign owners",
        icon: "ListChecks",
      },
      {
        name: "Efficiency Analyzer",
        slug: "meeting-efficiency-analyzer",
        description: "Analyze meeting quality and get tips to improve",
        icon: "Gauge",
      },
      {
        name: "Client Call Analyzer",
        slug: "client-call-analyzer",
        description: "Deep-dive analysis of client conversations and sentiment",
        icon: "PhoneCall",
      },
    ],
  },
  eos: {
    id: "eos",
    name: "Strategy AI Team",
    tagline: "AI-powered strategic planning and execution",
    accentColor: "border-b-amber-500",
    gradientFrom: "30 90% 50%",
    gradientTo: "45 95% 55%",
    agents: [
      {
        name: "EOS Coach",
        slug: "eos-coach",
        description: "Get guidance on implementing EOS methodology",
        icon: "GraduationCap",
      },
      {
        name: "Pattern Detective",
        slug: "eos-pattern-detective",
        description: "Identify recurring patterns in your organizational issues",
        icon: "Search",
      },
      {
        name: "Pod Health",
        slug: "eos-pod-health",
        description: "Analyze team health metrics and get improvement suggestions",
        icon: "HeartPulse",
      },
      {
        name: "Quarterly Digest",
        slug: "eos-quarterly-digest",
        description: "Generate comprehensive quarterly performance reports",
        icon: "CalendarRange",
      },
    ],
  },
  projects: {
    id: "projects",
    name: "Project AI Team",
    tagline: "Smarter project management with AI assistance",
    accentColor: "border-b-emerald-500",
    gradientFrom: "150 70% 40%",
    gradientTo: "170 75% 50%",
    agents: [
      {
        name: "Project Analyst",
        slug: "project-analyst",
        description: "Get insights on project health, risks, and resource allocation",
        icon: "BarChart3",
      },
      {
        name: "Bug & Feature Planner",
        slug: "bug-feature-planner",
        description: "Organize and prioritize bugs and feature requests",
        icon: "Bug",
      },
      {
        name: "Technical Planner",
        slug: "technical-plan-generator",
        description: "Generate detailed technical implementation plans",
        icon: "Cpu",
      },
      {
        name: "Code Reviewer",
        slug: "code-review-generator",
        description: "AI-powered code review suggestions and best practices",
        icon: "Code",
      },
    ],
  },
};

export const allTeams = Object.values(agentTeams);
