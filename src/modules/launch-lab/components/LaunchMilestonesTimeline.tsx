import { Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PitchMilestone } from "../types";

interface LaunchMilestonesTimelineProps {
  milestones: PitchMilestone[];
}

export function LaunchMilestonesTimeline({ milestones }: LaunchMilestonesTimelineProps) {
  if (!milestones?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flag className="h-4 w-4 text-primary" />
          30-day milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {milestones.map((m, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    Week {m.week}
                  </Badge>
                  <span className="font-medium text-sm">{m.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.description || m.goals?.join(" · ")}
                </p>
                {(m.deliverables ?? m.goals)?.length > 0 && (
                  <ul className="mt-2 text-xs space-y-0.5">
                    {(m.deliverables ?? m.goals).map((d, j) => (
                      <li key={j} className="text-muted-foreground">
                        → {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
