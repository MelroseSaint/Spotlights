import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useEvents = () => {
  const getUpcomingEvents = (limit?: number) =>
    useQuery(api.backend.events.getUpcomingEvents, { limit: limit ?? 20 });

  const hasCheckedIn = (eventId: Id<"events">, userId: Id<"users">) =>
    useQuery(api.backend.events.hasCheckedIn, { eventId, userId });

  return { getUpcomingEvents, hasCheckedIn };
};

export const useCreateEvent = () => {
  return useMutation(api.backend.events.createEvent);
};

export const useCheckInToEvent = () => {
  return useMutation(api.backend.events.checkInToEvent);
};
