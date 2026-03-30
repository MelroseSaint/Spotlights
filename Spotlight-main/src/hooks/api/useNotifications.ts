import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUserNotifications(userId: string, limit?: number, unreadOnly?: boolean) {
  return useQuery(api.backend.notifications.getUserNotifications, { 
    userId: userId as any, 
    limit, 
    unreadOnly 
  });
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery(api.backend.notifications.getUnreadCount, { userId: userId as any });
}

export function useMarkNotificationRead() {
  return useMutation(api.backend.notifications.markNotificationRead);
}

export function useMarkAllNotificationsRead() {
  return useMutation(api.backend.notifications.markAllNotificationsRead);
}

export function useDeleteNotification() {
  return useMutation(api.backend.notifications.deleteNotification);
}
