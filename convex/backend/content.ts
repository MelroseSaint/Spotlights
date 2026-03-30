import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { LIGHTCREDZ_EARN } from "../constants";
import { canUploadContent, incrementUserContentCount, decrementUserContentCount, updateContentEngagementScore, hasActionCooldown, recordActionCooldown, createNotification } from "../helpers";

export const createContent = mutation({
  args: {
    ownerId: v.id("users"), title: v.string(), artistName: v.string(), description: v.string(),
    genre: v.string(), region: v.string(), contentType: v.string(), mediaUrl: v.string(),
    thumbnailUrl: v.optional(v.string()), duration: v.optional(v.number()), tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const uploadCheck = await canUploadContent(ctx, args.ownerId);
    if (!uploadCheck.canUpload) throw new Error(uploadCheck.reason);
    const user = await ctx.db.get(args.ownerId);
    const contentId = await ctx.db.insert("artistContent", {
      ownerId: args.ownerId, title: args.title, artistName: args.artistName, description: args.description,
      genre: args.genre, region: args.region, contentType: args.contentType, mediaUrl: args.mediaUrl,
      thumbnailUrl: args.thumbnailUrl, duration: args.duration, views: 0, likes: 0, comments: 0, shares: 0,
      moderationStatus: "pending", eligibilityStatus: "eligible", submissionStatus: "uploaded", rejectionReason: undefined,
      isPromoted: false, promotionType: undefined, promotionStartDate: undefined, promotionEndDate: undefined,
      promotionSource: undefined, promotionTier: undefined, engagementScore: 0, freshnessScore: 100,
      exposureCount: 0, lastExposureDate: undefined, tags: args.tags || [], isActive: true,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    await incrementUserContentCount(ctx, args.ownerId);
    if (user && user.activeContentCount === 0) {
      await ctx.db.patch(user._id, { lightCredzBalance: user.lightCredzBalance + LIGHTCREDZ_EARN.FIRST_UPLOAD.amount, lightCredzTotalEarned: user.lightCredzTotalEarned + LIGHTCREDZ_EARN.FIRST_UPLOAD.amount });
    }
    return contentId;
  },
});

export const getContent = query({
  args: { contentId: v.id("artistContent") },
  handler: async (ctx, { contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content || !content.isActive) throw new Error("Content not found");
    return content;
  },
});

export const getUserContent = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 50 }) => {
    const contents = await ctx.db.query("artistContent").withIndex("by_owner", (q) => q.eq("ownerId", userId)).collect();
    const filtered = contents.filter(c => c.isActive).sort((a, b) => b.createdAt - a.createdAt);
    return filtered.slice(0, limit);
  },
});

export const submitContent = mutation({
  args: { contentId: v.id("artistContent"), userId: v.id("users") },
  handler: async (ctx, { contentId, userId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    if (content.ownerId !== userId) throw new Error("You can only submit your own content");
    if (content.eligibilityStatus !== "eligible") throw new Error("Content must be eligible before submission");
    await ctx.db.patch(contentId, { submissionStatus: "submitted", moderationStatus: "pending", updatedAt: Date.now() });
    await ctx.db.insert("moderationQueue", { contentId, reviewerId: undefined, status: "pending", rejectionReason: undefined, reviewedAt: undefined, createdAt: Date.now() });
    return { success: true };
  },
});

export const likeContent = mutation({
  args: { userId: v.id("users"), contentId: v.id("artistContent") },
  handler: async (ctx, { userId, contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content || !content.isActive) throw new Error("Content not found");
    const existingLike = await ctx.db.query("likes").withIndex("by_content", (q) => q.eq("contentId", contentId)).filter((q) => q.eq(q.field("userId"), userId)).first();
    if (existingLike) throw new Error("Already liked this content");
    await ctx.db.insert("likes", { userId, contentId, createdAt: Date.now() });
    await ctx.db.patch(contentId, { likes: (content.likes || 0) + 1, updatedAt: Date.now() });
    await updateContentEngagementScore(ctx, contentId);
    
    const playlists = await ctx.db.query("playlists").withIndex("by_owner", (q) => q.eq("ownerId", userId)).collect();
    const likedSongsPlaylist = playlists.find(p => p.name === "Liked Songs");
    if (likedSongsPlaylist && !likedSongsPlaylist.contentIds.includes(contentId)) {
      await ctx.db.patch(likedSongsPlaylist._id, {
        contentIds: [...likedSongsPlaylist.contentIds, contentId],
        updatedAt: Date.now(),
      });
    }
    
    if (content.ownerId !== userId) {
      const hasCooldown = await hasActionCooldown(ctx, userId, "like");
      if (!hasCooldown) {
        await ctx.db.patch(content.ownerId, { lightCredzBalance: (await ctx.db.get(content.ownerId))!.lightCredzBalance + LIGHTCREDZ_EARN.ENGAGEMENT_LIKE.amount, lightCredzTotalEarned: (await ctx.db.get(content.ownerId))!.lightCredzTotalEarned + LIGHTCREDZ_EARN.ENGAGEMENT_LIKE.amount });
        await recordActionCooldown(ctx, userId, "like");
      }
    }
    return { success: true };
  },
});

export const unlikeContent = mutation({
  args: { userId: v.id("users"), contentId: v.id("artistContent") },
  handler: async (ctx, { userId, contentId }) => {
    const like = await ctx.db.query("likes").withIndex("by_content", (q) => q.eq("contentId", contentId)).filter((q) => q.eq(q.field("userId"), userId)).first();
    if (!like) throw new Error("Not liked this content");
    await ctx.db.delete(like._id);
    const content = await ctx.db.get(contentId);
    if (content) { await ctx.db.patch(contentId, { likes: Math.max(0, (content.likes || 0) - 1), updatedAt: Date.now() }); await updateContentEngagementScore(ctx, contentId); }
    
    const playlists = await ctx.db.query("playlists").withIndex("by_owner", (q) => q.eq("ownerId", userId)).collect();
    const likedSongsPlaylist = playlists.find(p => p.name === "Liked Songs");
    if (likedSongsPlaylist && likedSongsPlaylist.contentIds.includes(contentId)) {
      await ctx.db.patch(likedSongsPlaylist._id, {
        contentIds: likedSongsPlaylist.contentIds.filter(id => id !== contentId),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

export const addComment = mutation({
  args: { authorId: v.id("users"), contentId: v.id("artistContent"), content: v.string() },
  handler: async (ctx, { authorId, contentId, content }) => {
    const contentItem = await ctx.db.get(contentId);
    if (!contentItem || !contentItem.isActive) throw new Error("Content not found");
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < LIGHTCREDZ_EARN.COMMENT.minWords) throw new Error(`Comment must be at least ${LIGHTCREDZ_EARN.COMMENT.minWords} words`);
    const commentId = await ctx.db.insert("comments", { authorId, contentId, content, wordCount, createdAt: Date.now() });
    await ctx.db.patch(contentId, { comments: (contentItem.comments || 0) + 1, updatedAt: Date.now() });
    await updateContentEngagementScore(ctx, contentId);
    if (contentItem.ownerId !== authorId) {
      const hasCooldown = await hasActionCooldown(ctx, authorId, "comment");
      if (!hasCooldown) {
        await ctx.db.patch(contentItem.ownerId, { lightCredzBalance: (await ctx.db.get(contentItem.ownerId))!.lightCredzBalance + LIGHTCREDZ_EARN.COMMENT.amount, lightCredzTotalEarned: (await ctx.db.get(contentItem.ownerId))!.lightCredzTotalEarned + LIGHTCREDZ_EARN.COMMENT.amount });
        await recordActionCooldown(ctx, authorId, "comment");
        await createNotification(ctx, contentItem.ownerId, "comment", "New Comment", `Someone commented on your content`, authorId, contentId);
      }
    }
    return commentId;
  },
});

export const getComments = query({
  args: { contentId: v.id("artistContent"), limit: v.optional(v.number()) },
  handler: async (ctx, { contentId, limit = 50 }) => {
    const comments = await ctx.db.query("comments").withIndex("by_content", (q) => q.eq("contentId", contentId)).order("asc").take(limit).collect();
    return Promise.all(comments.map(async (comment) => {
      const author = await ctx.db.get(comment.authorId);
      return { ...comment, author: author ? { _id: author._id, name: author.name, username: author.username, avatarUrl: author.avatarUrl } : null };
    }));
  },
});

export const shareContent = mutation({
  args: { userId: v.id("users"), contentId: v.id("artistContent"), platform: v.optional(v.string()) },
  handler: async (ctx, { userId, contentId, platform }) => {
    const content = await ctx.db.get(contentId);
    if (!content || !content.isActive) throw new Error("Content not found");
    const existingShare = await ctx.db.query("shares").withIndex("by_content", (q) => q.eq("contentId", contentId)).filter((q) => q.eq(q.field("userId"), userId)).first();
    if (existingShare) throw new Error("Already shared this content");
    await ctx.db.insert("shares", { userId, contentId, platform, createdAt: Date.now() });
    await ctx.db.patch(contentId, { shares: (content.shares || 0) + 1, updatedAt: Date.now() });
    await updateContentEngagementScore(ctx, contentId);
    if (content.ownerId !== userId) {
      const hasCooldown = await hasActionCooldown(ctx, userId, "share");
      if (!hasCooldown) {
        await ctx.db.patch(content.ownerId, { lightCredzBalance: (await ctx.db.get(content.ownerId))!.lightCredzBalance + LIGHTCREDZ_EARN.SHARE.amount, lightCredzTotalEarned: (await ctx.db.get(content.ownerId))!.lightCredzTotalEarned + LIGHTCREDZ_EARN.SHARE.amount });
        await recordActionCooldown(ctx, userId, "share");
      }
    }
    return { success: true };
  },
});

export const deleteContent = mutation({
  args: { contentId: v.id("artistContent"), userId: v.id("users") },
  handler: async (ctx, { contentId, userId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    if (content.ownerId !== userId) throw new Error("You can only delete your own content");
    await ctx.db.patch(contentId, { isActive: false, updatedAt: Date.now() });
    await decrementUserContentCount(ctx, userId);
    return { success: true };
  },
});

export const searchContent = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { query: searchQuery, limit = 50 }) => {
    const allContent = (await ctx.db.query("artistContent").filter((q) => q.eq(q.field("isActive"), true)).collect()).slice(0, 500);
    const queryLower = searchQuery.toLowerCase();
    return allContent.filter(c => c.title.toLowerCase().includes(queryLower) || c.artistName.toLowerCase().includes(queryLower) || c.description.toLowerCase().includes(queryLower) || c.genre.toLowerCase().includes(queryLower)).slice(0, limit);
  },
});
