/**
 * Microsoft Calendar View Component
 * Displays a calendar with Outlook events
 */

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Loader2, 
  Calendar as CalendarIcon,
  Video,
  MapPin,
  Clock,
  AlertCircle,
  User
} from 'lucide-react';
import { useMicrosoftCalendar, getEventsForDate, getDatesWithEvents } from '@/hooks/useMicrosoftCalendar';
import { OutlookCalendarEvent } from '@/lib/microsoftTeamsMeetingService';
import { cn } from '@/lib/utils';

interface MicrosoftCalendarViewProps {
  isConnected: boolean;
}

export function MicrosoftCalendarView({ isConnected }: MicrosoftCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate date range for current month view (with padding)
  const startDate = useMemo(() => {
    const start = startOfMonth(currentMonth);
    start.setDate(start.getDate() - 7); // Include week before
    return start;
  }, [currentMonth]);

  const endDate = useMemo(() => {
    const end = endOfMonth(currentMonth);
    end.setDate(end.getDate() + 7); // Include week after
    return end;
  }, [currentMonth]);

  const { 
    data: events = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useMicrosoftCalendar({
    startDate,
    endDate,
    enabled: isConnected,
  });

  // Get dates with events for calendar highlighting
  const datesWithEvents = useMemo(() => getDatesWithEvents(events), [events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => 
    getEventsForDate(events, selectedDate),
    [events, selectedDate]
  );

  const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Connect your Microsoft account to view your calendar</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Calendar unavailable</p>
            <p className="text-sm text-destructive/80 mt-1">
              {error instanceof Error ? error.message : 'Failed to load calendar'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-lg border p-3"
            modifiers={{
              hasEvent: datesWithEvents,
            }}
            modifiersClassNames={{
              hasEvent: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
            }}
          />
        </div>

        {/* Events List */}
        <div className="rounded-lg border bg-card">
          <div className="p-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <ScrollArea className="h-[280px]">
            {selectedDateEvents.length > 0 ? (
              <div className="p-2 space-y-2">
                {selectedDateEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No events scheduled</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Requires <code className="bg-muted px-1 rounded">Calendars.Read</code> permission
      </p>
    </div>
  );
}

// Event Card Component
function EventCard({ event }: { event: OutlookCalendarEvent }) {
  const startTime = new Date(event.start.dateTime);
  const endTime = new Date(event.end.dateTime);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  
  const showAsColors: Record<string, string> = {
    busy: 'bg-blue-500',
    tentative: 'bg-amber-500',
    free: 'bg-green-500',
    oof: 'bg-purple-500',
    workingElsewhere: 'bg-cyan-500',
  };

  return (
    <div className="rounded-lg border bg-background p-3 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-2">
        <div 
          className={cn(
            "w-1 h-full min-h-[40px] rounded-full",
            showAsColors[event.showAs || 'busy'] || 'bg-blue-500'
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{event.subject || 'Untitled Event'}</p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              <span className="ml-1 opacity-70">({durationMinutes} min)</span>
            </span>
          </div>

          {event.location?.displayName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location.displayName}</span>
            </div>
          )}

          {event.organizer?.emailAddress?.name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <User className="h-3 w-3" />
              <span className="truncate">{event.organizer.emailAddress.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {event.isOnlineMeeting && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Video className="h-3 w-3" />
                Teams
              </Badge>
            )}
            {event.isAllDay && (
              <Badge variant="outline" className="text-xs">All Day</Badge>
            )}
          </div>

          {event.isOnlineMeeting && event.onlineMeeting?.joinUrl && (
            <a
              href={event.onlineMeeting.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              <Video className="h-3 w-3" />
              Join Meeting
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
