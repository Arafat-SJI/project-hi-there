import { Sparkles, Target, Zap, TrendingUp } from "lucide-react";
import { AIIndicator } from "@/components/ui/ai-indicator";
import { Badge } from "@/components/ui/badge";

interface LaunchLabHeroProps {
  step: 1 | 2;
  overall: number | null;
  productName: string;
}

export function LaunchLabHero({ step, overall, productName }: LaunchLabHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-background p-6 sm:p-8">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
              Hackathon 2026
            </Badge>
            <AIIndicator variant="badge" status="active" label="Gemini 2.5 Flash" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {productName ? `${productName} — Launch Lab` : "Launch Lab"}
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            {step === 1
              ? "AI pitch coach scores your narrative, surfaces objections, and crafts a investor-ready version."
              : "Transform your pitch into a visual launch board, KPIs, milestones, and a 30-day action plan."}
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <HeroStat icon={Target} label="Step" value={step === 1 ? "Pitch" : "Canvas"} />
          <HeroStat
            icon={TrendingUp}
            label="Score"
            value={overall != null ? `${overall}` : "—"}
            highlight={overall != null && overall >= 70}
          />
          <HeroStat icon={Zap} label="Agent" value="Live" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Powered by Google Gemini · Standalone hackathon workspace
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
