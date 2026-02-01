/**
 * OKR Card Component
 *
 * Displays an OKR with progress bar and key results summary.
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KeyResultProgress } from "./KeyResultProgress";
import type { OKR } from "../../types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-yellow-100 text-yellow-800",
  behind: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-100 text-gray-600",
};

interface OKRCardProps {
  okr: OKR;
  onClick?: () => void;
}

export function OKRCard({ okr, onClick }: OKRCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{okr.title}</CardTitle>
          <Badge variant="secondary" className={statusColors[okr.status] || ""}>
            {okr.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{okr.quarter}</span>
          {okr.owner && <span>· {okr.owner.full_name}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(okr.progress)}%</span>
            </div>
            <Progress value={okr.progress} className="h-2" />
          </div>

          {okr.key_results && okr.key_results.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">
                Key Results ({okr.key_results.length})
              </p>
              {okr.key_results.slice(0, 3).map((kr) => (
                <KeyResultProgress key={kr.id} keyResult={kr} compact />
              ))}
              {okr.key_results.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{okr.key_results.length - 3} more
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
