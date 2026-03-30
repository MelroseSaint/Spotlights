import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useUserNotifications = (userId: Id<"users"> | undefined, limit?: number, unreadOnly?: boolean) => {
  return useQuery(
    api.backend.notifications.getUserNotifications, 
    userId ? { userId, limit: limit ?? 50, unreadOnly: unreadOnly ?? false } : "skip"
  );
};

export const useUnreadCount = (userId: Id<"users"> | undefined) => {
  return useQuery(
    api.backend.notifications.getUnreadCount, 
    userId ? { userId } : "skip"
  );
};

export const useNotifications = (userId: Id<"users"> | null) => {
  return {
    getUserNotifications: useUserNotifications,
    getUnreadCount: useUnreadCount,
  };
};

export const useMarkNotificationRead = () => {
  return useMutation(api.backend.notifications.markNotificationRead);
};
