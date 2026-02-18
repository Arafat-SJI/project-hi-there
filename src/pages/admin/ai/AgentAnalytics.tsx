/**
 * AI Agent Analytics – cost tracking and performance metrics.
 * Route: /admin/ai/agent-analytics
 * All content (Cost by Agent + Cost by Provider & Model) on a single page.
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  BarChart3,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  useAgentAnalytics,
  formatCostMicro,
  formatTokens,
  type DateRangeDays,
} from "@/hooks/useAgentAnalytics";

const DATE_RANGE_OPTIONS: { value: DateRangeDays; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const COST_OPTIMIZATION_TIPS = [
  "Use Gemini 2.5 Flash for simple queries (99.9% cheaper than GPT-4)",
  "Use O3-mini for reasoning tasks instead of O1 (90% cheaper)",
  "Configure fallback chains to use cheaper models first",
  "Monitor token usage to identify optimization opportunities",
];

export default function AgentAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeDays>(30);

  const { data: analytics, isLoading } = useAgentAnalytics(dateRange);
  const dateLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? "Last 30 days";
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            AI Agent Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Cost tracking and performance metrics
          </p>
        </div>
        <Select
          value={String(dateRange)}
          onValueChange={(v) => setDateRange(Number(v) as DateRangeDays)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{dateLabel}</CardDescription>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCostMicro(analytics?.summary.totalCostMicro ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Agent executions</CardDescription>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.summary.totalRuns ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Total Runs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Across all agents</CardDescription>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTokens(analytics?.summary.totalTokens ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Response time</CardDescription>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.summary.avgLatencyMs != null
                    ? `${analytics.summary.avgLatencyMs}ms`
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Avg Latency</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Completion rate</CardDescription>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(analytics?.summary.completionRatePct ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Cost by Agent */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Cost by Agent</h2>
        <p className="text-sm text-muted-foreground">
          Total cost and execution count for each agent
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="max-h-[500px] space-y-2 overflow-y-auto">
            {(analytics?.costByAgent ?? []).map((row) => (
              <Card key={row.agentId} className="transition-colors">
                <CardContent className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{row.agentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.runs} runs • {row.successRatePct.toFixed(1)}% success
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCostMicro(row.totalCostMicro)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCostMicro(row.costPerRunMicro)} / run
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cost by Provider & Model — always visible */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          Cost by Provider & Model
        </h2>
        <p className="text-sm text-muted-foreground">
          Performance and cost comparison across AI providers
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {(analytics?.costByProviderModel ?? []).map((row) => (
              <div
                key={`${row.provider}-${row.model}`}
                className="flex flex-row items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {row.provider} - {row.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.runs} runs • {formatTokens(row.tokens)} tokens
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-foreground">
                    {formatCostMicro(row.totalCostMicro)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCostMicro(row.costPerRunMicro)} / run
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
            <TrendingUp className="h-4 w-4" />
            Cost Optimization Tips:
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-green-800/90 dark:text-green-200/90">
            {COST_OPTIMIZATION_TIPS.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
