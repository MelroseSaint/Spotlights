import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";

export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, limit = 50, unreadOnly = false }) => {
    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit * 2);
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    
    const notificationsWithDetails = await Promise.all(
      notifications.slice(0, limit).map(async (notification) => {
        let fromUser = null;
        let content = null;
        
        if (notification.fromUserId) {
          const user = await ctx.db.get(notification.fromUserId);
          if (user) {
            fromUser = {
              _id: user._id,
              name: user.name,
              avatarUrl: user.avatarUrl,
            };
          }
        }
        
        if (notification.contentId) {
          const contentDoc = await ctx.db.get(notification.contentId);
          if (contentDoc) {
            content = {
              _id: contentDoc._id,
              title: contentDoc.title,
              artistName: contentDoc.artistName,
              thumbnailUrl: contentDoc.thumbnailUrl,
            };
          }
        }
        
        return {
          ...notification,
          fromUser,
          content,
        };
      })
    );
    
    return notificationsWithDetails;
  },
});

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, { notificationId, userId }) => {
    const notification = await ctx.db.get(notificationId);
    if (!notification) throw new Error("Notification not found");
    
    if (notification.userId !== userId) {
      throw new Error("Cannot mark another user's notification as read");
    }
    
    await ctx.db.patch(notificationId, {
      isRead: true,
    });
    
    return { success: true };
  },
});

export const markAllNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }
    
    return { success: true, markedCount: notifications.length };
  },
});

export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, { notificationId, userId }) => {
    const notification = await ctx.db.get(notificationId);
    if (!notification) throw new Error("Notification not found");
    
    if (notification.userId !== userId) {
      throw new Error("Cannot delete another user's notification");
    }
    
    await ctx.db.delete(notificationId);
    
    return { success: true };
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const count = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .count();
    
    return { count };
  },
});

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    fromUserId: v.optional(v.id("users")),
    contentId: v.optional(v.id("artistContent")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      fromUserId: args.fromUserId,
      contentId: args.contentId,
      isRead: false,
      createdAt: new Date(),
    });
    
    return notificationId;
  },
});

export const deleteAllNotifications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    
    return { success: true, deletedCount: notifications.length };
  },
});
