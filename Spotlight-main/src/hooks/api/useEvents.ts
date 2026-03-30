import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUpcomingEvents(limit?: number) {
  return useQuery(api.backend.events.getUpcomingEvents, { limit });
}

export function usePastEvents(limit?: number) {
  return useQuery(api.backend.events.getPastEvents, { limit });
}

export function useEvent(eventId: string) {
  return useQuery(api.backend.events.getEvent, { eventId: eventId as any });
}

export function useUserEvents(userId: string, limit?: number) {
  return useQuery(api.backend.events.getUserEvents, { userId: userId as any, limit });
}

export function useUserCheckIns(userId: string, limit?: number) {
  return useQuery(api.backend.events.getUserCheckIns, { userId: userId as any, limit });
}

export function useEventAttendees(eventId: string, limit?: number) {
  return useQuery(api.backend.events.getEventAttendees, { eventId: eventId as any, limit });
}

export function useHasCheckedIn(eventId: string, userId: string) {
  return useQuery(api.backend.events.hasCheckedIn, { eventId: eventId as any, userId: userId as any });
}

export function useSearchEvents(query: string, limit?: number) {
  return useQuery(api.backend.events.searchEvents, { query, limit });
}

export function useCreateEvent() {
  return useMutation(api.backend.events.createEvent);
}

export function useCheckInToEvent() {
  return useMutation(api.backend.events.checkInToEvent);
}

export function useCancelEvent() {
  return useMutation(api.backend.events.cancelEvent);
}
