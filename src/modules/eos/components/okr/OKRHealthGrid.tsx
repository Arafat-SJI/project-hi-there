/**
 * OKR Health Grid
 *
 * Displays a responsive grid of OKR health cards sorted by urgency,
 * with status badges, progress bars, and owner/pod context.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";
import type { OKR, OKRStatus } from "../../types";

const statusColors: Record<OKRStatus, string> = {
  active: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-amber-100 text-amber-800",
  behind: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  closed: "bg-gray-100 text-gray-600",
};

const sortPriority: Record<OKRStatus, number> = {
  at_risk: 0,
  behind: 1,
  active: 2,
  on_track: 3,
  draft: 4,
  completed: 5,
  closed: 6,
};

interface OKRHealthGridProps {
  okrs: OKR[];
}

export function OKRHealthGrid({ okrs }: OKRHealthGridProps) {
  const sorted = useMemo(
    () =>
      [...okrs].sort(
        (a, b) =>
          (sortPriority[a.status] ?? 99) - (sortPriority[b.status] ?? 99)
      ),
    [okrs]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2" />
        <p>No OKRs to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((okr) => (
        <Card key={okr.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm leading-tight">
                {okr.title}
              </CardTitle>
              <Badge
                variant="secondary"
                className={`shrink-0 ${statusColors[okr.status] || ""}`}
              >
                {okr.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge variant="outline" className="text-xs">
                {okr.quarter}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {Math.round(okr.progress)}%
                  </span>
                </div>
                <Progress value={okr.progress} className="h-2" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{okr.owner?.full_name || "No owner"}</span>
                {okr.pod && (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: okr.pod.color }}
                    />
                    {okr.pod.name}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
