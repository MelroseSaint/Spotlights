import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getUserNotifications = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()), unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, { userId, limit = 50, unreadOnly = false }) => {
    let notifications = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    if (unreadOnly) notifications = notifications.filter(n => !n.isRead);
    return notifications.slice(0, limit);
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications"), userId: v.id("users") },
  handler: async (ctx, { notificationId, userId }) => {
    const notification = await ctx.db.get(notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Cannot mark another user's notification as read");
    await ctx.db.patch(notificationId, { isRead: true });
    return { success: true };
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const notifications = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return { count: unreadCount };
  },
});
