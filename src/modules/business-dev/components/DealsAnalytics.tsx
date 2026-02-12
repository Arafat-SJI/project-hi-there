/**
 * Deals Analytics Tab - Stage value and count charts
 * Matches Business Opportunities OptimizedDealAnalytics from replication guide.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { useDealPipelineStats } from "../hooks/useDeals";
import { Loader2, BarChart3 } from "lucide-react";
import type { DealStage } from "../types";

const STAGE_CONFIG: Record<DealStage, { label: string; color: string }> = {
  lead: { label: "Lead", color: "#6b7280" },
  discovery: { label: "Discovery", color: "#3b82f6" },
  qualified: { label: "Qualified", color: "#2563eb" },
  estimation: { label: "Estimation", color: "#8b5cf6" },
  proposal: { label: "Proposal", color: "#f59e0b" },
  won: { label: "Won", color: "#22c55e" },
  lost: { label: "Lost", color: "#ef4444" },
};

const ALL_STAGES: DealStage[] = ["lead", "discovery", "qualified", "estimation", "proposal", "won", "lost"];

export default function DealsAnalytics() {
  const { data: stats, isLoading } = useDealPipelineStats();

  const chartData = useMemo(() => {
    if (!stats?.by_stage) return [];
    return ALL_STAGES.map((stage) => {
      const cfg = STAGE_CONFIG[stage];
      const s = stats.by_stage[stage];
      return {
        name: cfg.label,
        stage,
        count: s?.count ?? 0,
        value: s?.value ?? 0,
        fill: cfg.color,
      };
    });
  }, [stats]);

  const chartConfig: ChartConfig = useMemo(
    () =>
      ALL_STAGES.reduce(
        (acc, stage) => {
          acc[stage] = { label: STAGE_CONFIG[stage].label, color: STAGE_CONFIG[stage].color };
          return acc;
        },
        {} as ChartConfig
      ),
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">No deals data yet</p>
        <p className="text-sm">Create deals to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deals by Stage (Count)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Deals">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v >= 1000 ? v / 1000 + "K" : v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Value">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
