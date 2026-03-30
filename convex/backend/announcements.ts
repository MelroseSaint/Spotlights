import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { isAdmin } from "../helpers";

export const createAnnouncement = mutation({
  args: { 
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("update"), v.literal("announcement"), v.literal("bug_report"), v.literal("whats_new")),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId);
    if (!author) throw new Error("User not found");
    if (!isAdmin(author.role)) throw new Error("Only admins can create announcements");
    
    const announcementId = await ctx.db.insert("announcements", {
      authorId: args.authorId,
      title: args.title,
      content: args.content,
      type: args.type,
      isPinned: args.isPinned,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, announcementId };
  },
});

export const updateAnnouncement = mutation({
  args: { 
    announcementId: v.id("announcements"),
    authorId: v.id("users"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(v.union(v.literal("update"), v.literal("announcement"), v.literal("bug_report"), v.literal("whats_new"))),
    isPinned: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId);
    if (!author) throw new Error("User not found");
    if (!isAdmin(author.role)) throw new Error("Only admins can update announcements");
    
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) throw new Error("Announcement not found");
    
    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.type !== undefined) updates.type = args.type;
    if (args.isPinned !== undefined) updates.isPinned = args.isPinned;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    
    await ctx.db.patch(args.announcementId, updates);
    
    return { success: true };
  },
});

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("announcements"), authorId: v.id("users") },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId);
    if (!author) throw new Error("User not found");
    if (!isAdmin(author.role)) throw new Error("Only admins can delete announcements");
    
    await ctx.db.delete(args.announcementId);
    return { success: true };
  },
});

export const getAnnouncements = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const announcements = await ctx.db.query("announcements")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    
    const sorted = announcements.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
    
    const withAuthors = await Promise.all(
      sorted.slice(0, limit).map(async (ann) => {
        const author = await ctx.db.get(ann.authorId);
        return {
          ...ann,
          author: author ? { _id: author._id, name: author.name, avatarUrl: author.avatarUrl } : null,
        };
      })
    );
    
    return withAuthors;
  },
});

export const getAnnouncementById = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) return null;
    
    const author = await ctx.db.get(announcement.authorId);
    return {
      ...announcement,
      author: author ? { _id: author._id, name: author.name, avatarUrl: author.avatarUrl } : null,
    };
  },
});
