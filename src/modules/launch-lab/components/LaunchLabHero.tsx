import { Target, Zap, TrendingUp } from "lucide-react";
import type { LaunchLabStep } from "../types";

interface LaunchLabHeroProps {
  step: LaunchLabStep;
  overall: number | null;
  productName: string;
}

const STEP_COPY: Record<LaunchLabStep, string> = {
  1: "Share a pitch, project idea, or plan — AI scores your narrative, surfaces objections, and crafts a polished version.",
  2: "Transform your refined idea into a visual launch board, KPIs, milestones, and a 30-day action plan.",
  3: "Your graphical command center — readiness score, strategy map, KPIs, roadmap, and launch brief in one view.",
  4: "Launch lab complete — review your summary, celebrate the milestone, and share your project with teammates.",
};

const STEP_LABEL: Record<LaunchLabStep, string> = {
  1: "Refine",
  2: "Canvas",
  3: "Command",
  4: "Done",
};

export function LaunchLabHero({ step, overall, productName }: LaunchLabHeroProps) {
  const displayName = productName.trim() && productName !== "Untitled" ? productName.trim() : "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-background p-6 sm:p-8">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {displayName ? `${displayName} — Launch Lab` : "Launch Lab"}
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            {STEP_COPY[step]}
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <HeroStat icon={Target} label="Step" value={STEP_LABEL[step]} />
          <HeroStat
            icon={TrendingUp}
            label="Score"
            value={overall != null ? `${overall}` : "—"}
            highlight={overall != null && overall >= 70}
          />
          <HeroStat icon={Zap} label="Agent" value="Live" />
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 min-w-[88px] text-center backdrop-blur-sm ${
        highlight ? "border-emerald-500/40 bg-emerald-500/10" : "border-border/60 bg-background/60"
      }`}
    >
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary opacity-80" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
