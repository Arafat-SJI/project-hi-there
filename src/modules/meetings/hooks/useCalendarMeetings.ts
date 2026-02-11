/**
 * Calendar Meetings Hook
 *
 * Fetches meetings within a date range for calendar views.
 * Also provides a convenience hook for fetching meetings by month.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CALENDAR_MEETINGS_KEY = "calendar-meetings";

interface CalendarMeeting {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string | null;
  slug: string | null;
  client_id: string | null;
  meeting_type: string | null;
  clients: { name: string } | null;
}

/**
 * Fetch meetings within a date range for calendar display.
 */
export function useCalendarMeetings(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [CALENDAR_MEETINGS_KEY, startDate, endDate],
    queryFn: async (): Promise<CalendarMeeting[]> => {
      const { data, error } = await supabase
        .from("meetings")
        .select(
          "id, title, scheduled_at, duration_minutes, status, slug, client_id, meeting_type, clients(name)"
        )
        .gte("scheduled_at", startDate)
        .lte("scheduled_at", endDate)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as CalendarMeeting[];
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Convenience hook to fetch all meetings for a given month.
 * Computes the start and end dates from the year and month,
 * then delegates to useCalendarMeetings.
 */
export function useMeetingsForMonth(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  return useCalendarMeetings(startDate, endDate);
}
