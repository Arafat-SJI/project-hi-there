/**
 * Meetings Calendar Component
 *
 * Monthly calendar view of meetings with day cells showing meeting indicators.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Meeting } from "@/hooks/useMeetings";

interface MeetingsCalendarProps {
  meetings: Meeting[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MeetingsCalendar({ meetings }: MeetingsCalendarProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month fill
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Index meetings by date
  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach((m) => {
      if (!m.scheduled_at) return;
      const dateKey = new Date(m.scheduled_at).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(m);
    });
    return map;
  }, [meetings]);

  const today = new Date().toISOString().split("T")[0];

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold text-lg min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }, i) => {
            const dateKey = date.toISOString().split("T")[0];
            const dayMeetings = meetingsByDate[dateKey] || [];
            const isToday = dateKey === today;

            return (
              <div
                key={i}
                className={`min-h-[100px] border-t border-r p-1.5 ${
                  !isCurrentMonth ? "bg-muted/30" : ""
                } ${isToday ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium ${
                      isToday
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayMeetings.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {dayMeetings.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayMeetings.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      className="w-full text-left text-[11px] px-1 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 truncate block"
                      onClick={() => navigate(`/meetings/${m.id}`)}
                    >
                      {m.scheduled_at
                        ? new Date(m.scheduled_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}{" "}
                      {m.title}
                    </button>
                  ))}
                  {dayMeetings.length > 3 && (
                    <p className="text-[10px] text-muted-foreground px-1">
                      +{dayMeetings.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
