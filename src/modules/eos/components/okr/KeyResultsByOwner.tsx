/**
 * Key Results By Owner
 *
 * Groups key results by owner and displays them in cards
 * with progress bars and status badges.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";
import type { OKRKeyResult } from "../../types";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  not_started: { label: "Not Started", className: "bg-gray-100 text-gray-700" },
  on_track: { label: "On Track", className: "bg-green-100 text-green-800" },
  at_risk: { label: "At Risk", className: "bg-amber-100 text-amber-800" },
  behind: { label: "Behind", className: "bg-red-100 text-red-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
};

interface OwnerGroup {
  name: string;
  email: string | null;
  keyResults: OKRKeyResult[];
}

interface KeyResultsByOwnerProps {
  keyResults: OKRKeyResult[];
}

export function KeyResultsByOwner({ keyResults }: KeyResultsByOwnerProps) {
  const groups = useMemo(() => {
    const map = new Map<string, OwnerGroup>();

    for (const kr of keyResults) {
      const key = kr.owner?.full_name || "Unassigned";
      const existing = map.get(key);

      if (existing) {
        existing.keyResults.push(kr);
      } else {
        map.set(key, {
          name: key,
          email: kr.owner?.email || null,
          keyResults: [kr],
        });
      }
    }

    return Array.from(map.values());
  }, [keyResults]);

  if (keyResults.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>No key results to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.name}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm">{group.name}</CardTitle>
                {group.email && (
                  <p className="text-xs text-muted-foreground">
                    {group.email}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.keyResults.map((kr) => {
                const progress =
                  kr.target_value !== kr.start_value
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          ((kr.current_value - kr.start_value) /
                            (kr.target_value - kr.start_value)) *
                            100
                        )
                      )
                    : 0;

                const config = statusConfig[kr.status];

                return (
                  <div key={kr.id} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{kr.title}</p>
                      <Badge
                        variant="secondary"
                        className={config?.className || ""}
                      >
                        {config?.label || kr.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {kr.current_value}
                        {kr.unit} / {kr.target_value}
                        {kr.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
