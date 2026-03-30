import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useUserEvents = (creatorId: Id<"users"> | null) => {
  return useQuery(api.backend.userEvents.getUserEvents, creatorId ? { creatorId } : "skip");
};

export const useUpcomingUserEvents = (limit?: number) => {
  return useQuery(api.backend.userEvents.getUpcomingUserEvents, { limit: limit ?? 20 });
};

export const useUserEventById = (eventId: Id<"userEvents"> | null) => {
  return useQuery(api.backend.userEvents.getUserEventById, eventId ? { eventId } : "skip");
};

export const useCreateUserEvent = () => {
  return useMutation(api.backend.userEvents.createUserEvent);
};

export const useUpdateUserEvent = () => {
  return useMutation(api.backend.userEvents.updateUserEvent);
};

export const useDeleteUserEvent = () => {
  return useMutation(api.backend.userEvents.deleteUserEvent);
};
