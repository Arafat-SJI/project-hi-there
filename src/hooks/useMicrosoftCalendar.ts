/**
 * Microsoft Calendar Hook
 * Fetches and manages calendar events from Microsoft Outlook/Exchange
 */

import { useQuery } from '@tanstack/react-query';
import { callGraphAPI } from '@/lib/microsoftGraphClient';
import { OutlookCalendarEvent } from '@/lib/microsoftTeamsMeetingService';

interface CalendarEventsResponse {
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
  value: OutlookCalendarEvent[];
}

interface UseMicrosoftCalendarOptions {
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

/**
 * Fetch calendar events from Microsoft Outlook/Exchange
 * Requires Calendars.Read permission
 */
async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<OutlookCalendarEvent[]> {
  const filter = `start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'`;
  const select = 'id,subject,bodyPreview,start,end,location,isOnlineMeeting,onlineMeeting,onlineMeetingUrl,organizer,isAllDay,showAs';
  const url = `/me/calendar/events?$filter=${encodeURIComponent(filter)}&$select=${select}&$orderby=start/dateTime&$top=100`;

  console.log('[Calendar] Fetching events from', startDate.toDateString(), 'to', endDate.toDateString());

  try {
    const response = await callGraphAPI<CalendarEventsResponse>(url);
    console.log(`[Calendar] Found ${response.value.length} events`);
    return response.value;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message?.includes('MailboxNotEnabledForRESTAPI') || 
          error.message?.includes('MailboxNotSupportedForRESTAPI')) {
        throw new Error('Calendar sync requires an Exchange Online mailbox. Your account may only have Teams licensing.');
      }
      if (error.message?.includes('Calendars.Read')) {
        throw new Error('Missing Calendars.Read permission. Please disconnect and reconnect your Microsoft account.');
      }
    }
    throw error;
  }
}

export function useMicrosoftCalendar(options: UseMicrosoftCalendarOptions) {
  const { startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: ['microsoft-calendar-events', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchCalendarEvents(startDate, endDate),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on permission/mailbox errors
      if (error instanceof Error) {
        if (error.message?.includes('mailbox') || error.message?.includes('permission')) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

/**
 * Get events for a specific date from a list of events
 */
export function getEventsForDate(
  events: OutlookCalendarEvent[],
  date: Date
): OutlookCalendarEvent[] {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  return events.filter(event => {
    const eventStart = new Date(event.start.dateTime);
    return eventStart >= dateStart && eventStart <= dateEnd;
  });
}

/**
 * Get all dates that have events
 */
export function getDatesWithEvents(events: OutlookCalendarEvent[]): Date[] {
  const dateSet = new Set<string>();
  
  events.forEach(event => {
    const eventDate = new Date(event.start.dateTime);
    eventDate.setHours(0, 0, 0, 0);
    dateSet.add(eventDate.toISOString());
  });

  return Array.from(dateSet).map(iso => new Date(iso));
}
