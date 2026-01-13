/**
 * React hook for fetching Microsoft Outlook calendar events
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { getCalendarEvents, OutlookCalendarEvent } from '@/lib/microsoftTeamsMeetingService';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from 'date-fns';

interface UseMicrosoftCalendarOptions {
  enabled?: boolean;
}

export function useMicrosoftCalendar(options: UseMicrosoftCalendarOptions = {}) {
  const { enabled = true } = options;
  
  // State for week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 }) // Start on Sunday
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  const query = useQuery({
    queryKey: ['microsoft-calendar-events', currentWeekStart.toISOString()],
    queryFn: async () => {
      console.log('[useMicrosoftCalendar] Fetching events for week:', currentWeekStart);
      const start = startOfDay(currentWeekStart);
      const end = endOfDay(weekEnd);
      return await getCalendarEvents(start, end);
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on permission/mailbox errors
      if (error instanceof Error) {
        if (error.message?.includes('Exchange') || 
            error.message?.includes('permission')) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  }, []);

  const goToPrevWeek = useCallback(() => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  }, []);

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    currentWeekStart,
    weekEnd,
    goToNextWeek,
    goToPrevWeek,
    goToToday,
  };
}

export type { OutlookCalendarEvent };
