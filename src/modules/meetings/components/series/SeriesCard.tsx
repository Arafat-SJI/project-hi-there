/**
 * Series Card Component
 *
 * Displays a meeting series with recurrence info and action buttons.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Repeat, MoreHorizontal, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MeetingSeries } from "../../types";

interface SeriesCardProps {
  series: MeetingSeries;
  onArchive?: (id: string) => void;
}

/**
 * Parse an iCal RRULE into a human-readable string.
 */
function formatRecurrence(rule: string): string {
  const match = rule.match(/FREQ=(\w+)/);
  if (!match) return rule;

  const freq = match[1].toLowerCase();
  const dayMatch = rule.match(/BYDAY=([\w,]+)/);
  const intervalMatch = rule.match(/INTERVAL=(\d+)/);
  const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;

  const freqLabels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  let label = interval > 1 ? `Every ${interval} ${freq}s` : freqLabels[freq] || freq;

  if (dayMatch) {
    const dayMap: Record<string, string> = {
      MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun",
    };
    const days = dayMatch[1].split(",").map((d) => dayMap[d] || d).join(", ");
    label += ` on ${days}`;
  }

  return label;
}

export function SeriesCard({ series, onArchive }: SeriesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{series.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onArchive?.(series.id)}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Series
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {series.description && (
          <p className="text-sm text-muted-foreground mb-3">{series.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            {formatRecurrence(series.recurrence_rule)}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {series.duration_minutes} min
          </Badge>
          {series.default_agenda.length > 0 && (
            <Badge variant="secondary">
              {series.default_agenda.length} agenda items
            </Badge>
          )}
          {series.next_occurrence && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Next: {new Date(series.next_occurrence).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
