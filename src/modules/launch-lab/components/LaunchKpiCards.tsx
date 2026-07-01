import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PitchKpi } from "../types";

interface LaunchKpiCardsProps {
  kpis: PitchKpi[];
}

export function LaunchKpiCards({ kpis }: LaunchKpiCardsProps) {
  if (!kpis?.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <Target className="h-4 w-4 text-blue-500" />
              <Badge variant="secondary" className="text-[10px]">
                {kpi.timeframe || "30 days"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium mt-2">{kpi.label}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpi.target}</p>
            {kpi.rationale && <p className="text-xs text-muted-foreground mt-1">{kpi.rationale}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
