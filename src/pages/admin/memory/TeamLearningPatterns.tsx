/**
 * Admin: Team Learning Patterns
 * Route: /admin/memory/team-learning-patterns
 * Discover organizational patterns, team learning, and collective insights (real data from agent_memories + user-memory-stats).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useTeamLearningPatterns,
  type PatternCard,
  type SuccessRecommendation,
  type RiskPattern,
} from "@/hooks/useTeamLearningPatterns";
import {
  Users,
  TrendingUp,
  Zap,
  Target,
  Mail,
  Briefcase,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

function StatCard({
  value,
  label,
  sublabel,
  icon: Icon,
  iconClass,
}: {
  value: string | number;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  iconClass?: string;
}) {
  return (
    <Card className="border rounded-lg shadow-sm">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
          </div>
          <div className={iconClass ?? "rounded-md bg-muted/50 p-2"}>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternSectionCard({ card }: { card: PatternCard }) {
  return (
    <Card className="border rounded-lg shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{card.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {card.metric}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {card.badge}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ rec }: { rec: SuccessRecommendation }) {
  return (
    <Card className="border rounded-lg shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{rec.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" />
              {rec.action}
            </p>
          </div>
          <Badge
            className={
              rec.priority === "High"
                ? "shrink-0 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-0"
                : "shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-0"
            }
          >
            {rec.priority}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskCard({ risk }: { risk: RiskPattern }) {
  return (
    <Card className="border rounded-lg shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{risk.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {risk.action}
            </p>
          </div>
          <Badge
            className={
              risk.priority === "high"
                ? "shrink-0 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-0 capitalize"
                : "shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-0 capitalize"
            }
          >
            {risk.priority}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

const CONSOLIDATION_STEPS = [
  { main: "Auto-trigger at 20 turns", sub: "Per user, per conversation" },
  { main: "Archive old memories", sub: "After 7 days or relevance below 0.3" },
  { main: "Create summaries", sub: "Compress 2000 tokens to 100" },
  { main: "Track insights", sub: "Boost relevant pattern detection" },
];

export default function TeamLearningPatterns() {
  const { data, isLoading, error } = useTeamLearningPatterns();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load Team Learning Patterns: {(error as Error).message}
      </div>
    );
  }

  const s = data?.summary;
  const consolidation = data?.consolidation;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="h-6 w-6" />
          Team Learning Patterns
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover organizational patterns, team learning, and collective insights.
        </p>
      </div>

      {/* Top row – 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border rounded-lg shadow-sm">
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              value={s?.teamMemories ?? 0}
              label="Shared patterns"
              icon={Users}
              iconClass="rounded-md bg-violet-100 dark:bg-violet-900/30 p-2"
            />
            <StatCard
              value={`${(s?.avgRelevancePct ?? 0).toFixed(0)}%`}
              label="Pattern confidence"
              icon={TrendingUp}
              iconClass="rounded-md bg-green-100 dark:bg-green-900/30 p-2"
            />
            <StatCard
              value={s?.patternsThisWeek ?? 0}
              label="This week"
              icon={Zap}
              iconClass="rounded-md bg-violet-100 dark:bg-violet-900/30 p-2"
            />
            <StatCard
              value={s?.teamInsights ?? 0}
              label="Available"
              icon={Target}
              iconClass="rounded-md bg-amber-100 dark:bg-amber-900/30 p-2"
            />
          </>
        )}
      </div>

      {/* Email Communication Patterns + Deal Coaching Patterns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            Email Communication Patterns
          </h2>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : (data?.emailPatterns ?? []).map((card, i) => (
                  <PatternSectionCard key={i} card={card} />
                ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            Deal Coaching Patterns
          </h2>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : (data?.dealPatterns ?? []).map((card, i) => (
                  <PatternSectionCard key={i} card={card} />
                ))}
          </div>
        </div>
      </div>

      {/* Top Team Learnings (Most Used) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top Team Learnings (Most Used)</h2>
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : !data?.topLearnings?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team learnings recorded yet
              </p>
            ) : (
              <ul className="space-y-3">
                {data.topLearnings.slice(0, 8).map((l) => (
                  <li key={l.id} className="flex justify-between items-start gap-2 text-sm">
                    <span className="text-foreground line-clamp-2">
                      {l.summary || l.content.slice(0, 120)}
                      {(l.summary || l.content).length > 120 ? "…" : ""}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {l.access_count} uses
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Recommendations + Risk Patterns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            Success Recommendations
          </h2>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : (data?.successRecommendations ?? []).map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Risk Patterns Detected
          </h2>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : (data?.riskPatterns ?? []).map((risk, i) => <RiskCard key={i} risk={risk} />)}
          </div>
        </div>
      </div>

      {/* Memory Consolidation Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Memory Consolidation Activity</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border rounded-lg shadow-sm">
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="border rounded-lg shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold text-primary mt-1">{consolidation?.thisWeek ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">consolidations</p>
                </CardContent>
              </Card>
              <Card className="border rounded-lg shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Token Savings</p>
                  <p className="text-2xl font-bold text-primary mt-1">{consolidation?.tokenSavingsPct ?? 70}%</p>
                  <p className="text-xs text-muted-foreground mt-1">compression ratio</p>
                </CardContent>
              </Card>
              <Card className="border rounded-lg shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Impact</p>
                  <p className="text-2xl font-bold text-primary mt-1">{consolidation?.impactMultiplier ?? 4.2}x</p>
                  <p className="text-xs text-muted-foreground mt-1">faster searches</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">Consolidation Process</h3>
          <ul className="space-y-2">
            {CONSOLIDATION_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{step.main}</p>
                  <p className="text-muted-foreground text-xs ml-0">{step.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
