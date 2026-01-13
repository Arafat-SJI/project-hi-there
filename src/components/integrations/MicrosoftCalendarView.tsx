/**
 * Microsoft Calendar Weekly View Component
 * Displays a week view similar to Microsoft Teams Calendar
 */

import { useState } from 'react';
import { useMicrosoftCalendar, OutlookCalendarEvent } from '@/hooks/useMicrosoftCalendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight, RefreshCw, Video, MapPin, AlertCircle, X } from 'lucide-react';
import { format, isSameDay, isToday, parseISO, differenceInMinutes, addHours, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MicrosoftCalendarViewProps {
  onClose?: () => void;
}

// Time slots from 6 AM to 10 PM
const HOUR_START = 6;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

// Status colors
const STATUS_COLORS: Record<string, string> = {
  busy: 'bg-purple-500/90 border-purple-600',
  tentative: 'bg-purple-400/70 border-purple-500 border-dashed',
  free: 'bg-green-500/80 border-green-600',
  oof: 'bg-pink-500/80 border-pink-600',
  workingElsewhere: 'bg-blue-500/80 border-blue-600',
  unknown: 'bg-purple-500/90 border-purple-600',
};

export function MicrosoftCalendarView({ onClose }: MicrosoftCalendarViewProps) {
  const {
    events,
    isLoading,
    error,
    refetch,
    isRefetching,
    currentWeekStart,
    goToNextWeek,
    goToPrevWeek,
    goToToday,
  } = useMicrosoftCalendar();

  const [selectedEvent, setSelectedEvent] = useState<OutlookCalendarEvent | null>(null);

  // Generate days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Get events for a specific day
  const getEventsForDay = (date: Date): OutlookCalendarEvent[] => {
    return events.filter(event => {
      const eventDate = parseISO(event.start.dateTime);
      return isSameDay(eventDate, date);
    });
  };

  // Calculate event position and height
  const getEventStyle = (event: OutlookCalendarEvent) => {
    const start = parseISO(event.start.dateTime);
    const end = parseISO(event.end.dateTime);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    const gridStartMinutes = HOUR_START * 60;
    const gridEndMinutes = HOUR_END * 60;
    
    // Clamp to visible range
    const visibleStart = Math.max(startMinutes, gridStartMinutes);
    const visibleEnd = Math.min(endMinutes, gridEndMinutes);
    
    const top = ((visibleStart - gridStartMinutes) / 60) * 60; // 60px per hour
    const height = Math.max(((visibleEnd - visibleStart) / 60) * 60, 20); // minimum 20px
    
    return { top: `${top}px`, height: `${height}px` };
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Calendar Unavailable</p>
            <p className="text-sm text-destructive/80 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg ml-2">
            {format(currentWeekStart, 'MMMM yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-card z-10">
              <div className="p-2 text-center text-xs text-muted-foreground border-r" />
              {weekDays.map((date, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-2 text-center border-r last:border-r-0",
                    isToday(date) && "bg-primary/5"
                  )}
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(date, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold mt-0.5",
                    isToday(date) && "text-primary"
                  )}>
                    {format(date, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
              {/* Time labels column */}
              <div className="border-r">
                {HOURS.map(hour => (
                  <div 
                    key={hour} 
                    className="h-[60px] text-xs text-muted-foreground text-right pr-2 pt-1"
                  >
                    {format(addHours(startOfDay(new Date()), hour), 'h a')}
                  </div>
                ))}
              </div>

              {/* Day columns with events */}
              {weekDays.map((date, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className={cn(
                    "border-r last:border-r-0 relative",
                    isToday(date) && "bg-primary/5"
                  )}
                >
                  {/* Hour grid lines */}
                  {HOURS.map(hour => (
                    <div key={hour} className="h-[60px] border-b border-dashed border-muted" />
                  ))}

                  {/* Events */}
                  {getEventsForDay(date).map((event, eventIndex) => {
                    const style = getEventStyle(event);
                    const statusColor = STATUS_COLORS[event.showAs || 'unknown'];
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md border px-2 py-1 cursor-pointer overflow-hidden text-white text-xs hover:opacity-90 transition-opacity",
                          statusColor
                        )}
                        style={style}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="font-medium truncate">{event.subject}</div>
                        <div className="text-[10px] opacity-90 truncate">
                          {format(parseISO(event.start.dateTime), 'h:mm a')}
                        </div>
                        {event.isOnlineMeeting && (
                          <Video className="h-3 w-3 absolute bottom-1 right-1 opacity-80" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-card rounded-lg border shadow-lg max-w-md w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(parseISO(selectedEvent.start.dateTime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedEvent.start.dateTime), 'h:mm a')} - {format(parseISO(selectedEvent.end.dateTime), 'h:mm a')}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedEvent.location?.displayName && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{selectedEvent.location.displayName}</span>
              </div>
            )}

            {selectedEvent.isOnlineMeeting && selectedEvent.onlineMeeting?.joinUrl && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Video className="h-3 w-3" />
                  Teams Meeting
                </Badge>
                <Button 
                  size="sm" 
                  onClick={() => window.open(selectedEvent.onlineMeeting?.joinUrl, '_blank')}
                >
                  Join
                </Button>
              </div>
            )}

            {selectedEvent.bodyPreview && (
              <p className="text-sm text-muted-foreground border-t pt-3">
                {selectedEvent.bodyPreview}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
