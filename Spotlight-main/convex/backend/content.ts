import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { 
  CONTENT_REQUIREMENTS, 
  LIGHTCREDZ_EARN,
  ELIGIBILITY_STATUS,
  SUBMISSION_STATUS,
} from "./constants";
import {
  validateContentFields,
  canUploadContent,
  incrementUserContentCount,
  decrementUserContentCount,
  updateContentEngagementScore,
  awardLightCredz,
  hasActionCooldown,
  recordActionCooldown,
  createNotification,
  getFeedWeightMultiplier,
  calculateFeedWeight,
} from "./helpers";
import type { TierType } from "./constants";

export const createContent = mutation({
  args: {
    ownerId: v.id("users"),
    title: v.string(),
    artistName: v.string(),
    description: v.string(),
    genre: v.string(),
    region: v.string(),
    contentType: v.string(),
    mediaUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { ownerId, ...contentData } = args;
    
    const uploadCheck = await canUploadContent(ctx, ownerId);
    if (!uploadCheck.canUpload) {
      throw new Error(uploadCheck.reason);
    }
    
    const validation = validateContentFields({
      title: args.title,
      artistName: args.artistName,
      description: args.description,
      genre: args.genre,
      region: args.region,
      contentType: args.contentType,
      duration: args.duration,
    });
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }
    
    if (!args.mediaUrl || args.mediaUrl.trim().length === 0) {
      throw new Error("Valid media file is required");
    }
    
    const eligibility = validation.isValid && args.mediaUrl ? ELIGIBILITY_STATUS.ELIGIBLE : ELIGIBILITY_STATUS.INELIGIBLE;
    
    const user = await ctx.db.get(ownerId);
    const tier = (user?.tier || "standard") as TierType;
    const tierMultiplier = getFeedWeightMultiplier(tier);
    
    const contentId = await ctx.db.insert("artistContent", {
      ownerId,
      title: args.title,
      artistName: args.artistName,
      description: args.description,
      genre: args.genre,
      region: args.region,
      contentType: args.contentType,
      mediaUrl: args.mediaUrl,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      moderationStatus: "pending",
      eligibilityStatus: eligibility,
      submissionStatus: SUBMISSION_STATUS.UPLOADED,
      rejectionReason: undefined,
      isPromoted: false,
      promotionType: undefined,
      promotionStartDate: undefined,
      promotionEndDate: undefined,
      promotionSource: undefined,
      promotionTier: undefined,
      engagementScore: 0,
      freshnessScore: 100,
      exposureCount: 0,
      lastExposureDate: undefined,
      tags: args.tags || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await incrementUserContentCount(ctx, ownerId);
    
    if (user && user.activeContentCount === 0) {
      await awardLightCredz(ctx, ownerId, LIGHTCREDZ_EARN.FIRST_UPLOAD.amount, "first_upload", LIGHTCREDZ_EARN.FIRST_UPLOAD.description, contentId);
    }
    
    const hoursSinceCreation = 0;
    await ctx.db.patch(contentId, {
      freshnessScore: Math.max(0, 100 - (hoursSinceCreation * 0.5)),
      firstPublishDate: new Date(),
    });
    
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

export const getContentWithOwner = query({
  args: { contentId: v.id("artistContent") },
  handler: async (ctx, { contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    const owner = await ctx.db.get(content.ownerId);
    
    return {
      ...content,
      owner: owner ? {
        _id: owner._id,
        name: owner.name,
        username: owner.username,
        avatarUrl: owner.avatarUrl,
        isVerified: owner.isVerified,
        tier: owner.tier,
      } : null,
    };
  },
});

export const getUserContent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, limit = 50, includeInactive = false }) => {
    let contents = await ctx.db
      .query("artistContent")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(limit)
      .collect();
    
    if (!includeInactive) {
      contents = contents.filter(c => c.isActive);
    }
    
    return contents;
  },
});

export const getContentByGenre = query({
  args: {
    genre: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { genre, limit = 50 }) => {
    return await ctx.db
      .query("artistContent")
      .withIndex("by_genre", (q) => q.eq("genre", genre))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit)
      .collect();
  },
});

export const getContentByRegion = query({
  args: {
    region: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { region, limit = 50 }) => {
    return await ctx.db
      .query("artistContent")
      .withIndex("by_region", (q) => q.eq("region", region))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit)
      .collect();
  },
});

export const submitContent = mutation({
  args: {
    contentId: v.id("artistContent"),
    userId: v.id("users"),
  },
  handler: async (ctx, { contentId, userId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (content.ownerId !== userId) {
      throw new Error("You can only submit your own content");
    }
    
    if (content.eligibilityStatus !== ELIGIBILITY_STATUS.ELIGIBLE) {
      throw new Error("Content must be eligible before submission");
    }
    
    if (content.submissionStatus === SUBMISSION_STATUS.SUBMITTED || 
        content.submissionStatus === SUBMISSION_STATUS.APPROVED) {
      throw new Error("Content is already submitted or approved");
    }
    
    await ctx.db.patch(contentId, {
      submissionStatus: SUBMISSION_STATUS.SUBMITTED,
      moderationStatus: "pending",
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("moderationQueue", {
      contentId,
      reviewerId: undefined,
      status: "pending",
      rejectionReason: undefined,
      reviewedAt: undefined,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const likeContent = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.id("artistContent"),
  },
  handler: async (ctx, { userId, contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content || !content.isActive) throw new Error("Content not found");
    
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    if (existingLike) {
      throw new Error("Already liked this content");
    }
    
    await ctx.db.insert("likes", {
      userId,
      contentId,
      createdAt: new Date(),
    });
    
    await ctx.db.patch(contentId, {
      likes: (content.likes || 0) + 1,
      updatedAt: new Date(),
    });
    
    await updateContentEngagementScore(ctx, contentId);
    
    if (content.ownerId !== userId) {
      const hasCooldown = await hasActionCooldown(ctx, userId, "like");
      if (!hasCooldown) {
        await awardLightCredz(ctx, content.ownerId, LIGHTCREDZ_EARN.ENGAGEMENT_LIKE.amount, "engagement_like", LIGHTCREDZ_EARN.ENGAGEMENT_LIKE.description, contentId);
        await recordActionCooldown(ctx, userId, "like");
      }
    }
    
    return { success: true };
  },
});

export const unlikeContent = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.id("artistContent"),
  },
  handler: async (ctx, { userId, contentId }) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    if (!like) {
      throw new Error("Not liked this content");
    }
    
    await ctx.db.delete(like._id);
    
    const content = await ctx.db.get(contentId);
    if (content) {
      await ctx.db.patch(contentId, {
        likes: Math.max(0, (content.likes || 0) - 1),
        updatedAt: new Date(),
      });
      
      await updateContentEngagementScore(ctx, contentId);
    }
    
    return { success: true };
  },
});

export const hasLikedContent = query({
  args: {
    userId: v.id("users"),
    contentId: v.id("artistContent"),
  },
  handler: async (ctx, { userId, contentId }) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    return !!like;
  },
});

export const addComment = mutation({
  args: {
    authorId: v.id("users"),
    contentId: v.id("artistContent"),
    content: v.string(),
  },
  handler: async (ctx, { authorId, contentId, content }) => {
    const contentItem = await ctx.db.get(contentId);
    if (!contentItem || !contentItem.isActive) throw new Error("Content not found");
    
    const wordCount = content.trim().split(/\s+/).length;
    
    if (wordCount < LIGHTCREDZ_EARN.COMMENT.minWords) {
      throw new Error(`Comment must be at least ${LIGHTCREDZ_EARN.COMMENT.minWords} words to earn credits`);
    }
    
    const commentId = await ctx.db.insert("comments", {
      authorId,
      contentId,
      content,
      wordCount,
      createdAt: new Date(),
    });
    
    await ctx.db.patch(contentId, {
      comments: (contentItem.comments || 0) + 1,
      updatedAt: new Date(),
    });
    
    await updateContentEngagementScore(ctx, contentId);
    
    if (contentItem.ownerId !== authorId) {
      const hasCooldown = await hasActionCooldown(ctx, authorId, "comment");
      if (!hasCooldown) {
        await awardLightCredz(ctx, contentItem.ownerId, LIGHTCREDZ_EARN.COMMENT.amount, "comment", `${LIGHTCREDZ_EARN.COMMENT.description} (+${wordCount} words)`, contentId);
        await recordActionCooldown(ctx, authorId, "comment");
        
        await createNotification(
          ctx,
          contentItem.ownerId,
          "comment",
          "New Comment",
          `Someone commented on your content`,
          authorId,
          contentId
        );
      }
    }
    
    return commentId;
  },
});

export const getComments = query({
  args: {
    contentId: v.id("artistContent"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { contentId, limit = 50 }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .order("asc")
      .take(limit)
      .collect();
    
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            _id: author._id,
            name: author.name,
            username: author.username,
            avatarUrl: author.avatarUrl,
          } : null,
        };
      })
    );
    
    return commentsWithAuthors;
  },
});

export const shareContent = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.id("artistContent"),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, { userId, contentId, platform }) => {
    const content = await ctx.db.get(contentId);
    if (!content || !content.isActive) throw new Error("Content not found");
    
    const existingShare = await ctx.db
      .query("shares")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    if (existingShare) {
      throw new Error("Already shared this content");
    }
    
    await ctx.db.insert("shares", {
      userId,
      contentId,
      platform,
      createdAt: new Date(),
    });
    
    await ctx.db.patch(contentId, {
      shares: (content.shares || 0) + 1,
      updatedAt: new Date(),
    });
    
    await updateContentEngagementScore(ctx, contentId);
    
    if (content.ownerId !== userId) {
      const hasCooldown = await hasActionCooldown(ctx, userId, "share");
      if (!hasCooldown) {
        await awardLightCredz(ctx, content.ownerId, LIGHTCREDZ_EARN.SHARE.amount, "share", `${LIGHTCREDZ_EARN.SHARE.description} (${platform || "internal"})`, contentId);
        await recordActionCooldown(ctx, userId, "share");
      }
    }
    
    return { success: true };
  },
});

export const recordView = mutation({
  args: {
    contentId: v.id("artistContent"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, { contentId, viewerId }) => {
    const content = await ctx.db.get(contentId);
    if (!content || !content.isActive) throw new Error("Content not found");
    
    await ctx.db.patch(contentId, {
      views: (content.views || 0) + 1,
      updatedAt: new Date(),
    });
    
    await updateContentEngagementScore(ctx, contentId);
    
    const owner = await ctx.db.get(content.ownerId);
    if (owner) {
      await ctx.db.patch(content.ownerId, {
        totalViews: (owner.totalViews || 0) + 1,
        updatedAt: new Date(),
      });
    }
    
    return { success: true };
  },
});

export const deleteContent = mutation({
  args: {
    contentId: v.id("artistContent"),
    userId: v.id("users"),
  },
  handler: async (ctx, { contentId, userId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (content.ownerId !== userId) {
      throw new Error("You can only delete your own content");
    }
    
    await ctx.db.patch(contentId, {
      isActive: false,
      updatedAt: new Date(),
    });
    
    await decrementUserContentCount(ctx, userId);
    
    return { success: true };
  },
});

export const updateContent = mutation({
  args: {
    contentId: v.id("artistContent"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    region: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { contentId, userId, ...updateData } = args;
    
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (content.ownerId !== userId) {
      throw new Error("You can only update your own content");
    }
    
    if (content.submissionStatus === SUBMISSION_STATUS.APPROVED || 
        content.moderationStatus === "approved") {
      throw new Error("Cannot update approved content");
    }
    
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(filteredData).length === 0) {
      throw new Error("No data provided to update");
    }
    
    if (filteredData.title || filteredData.description || filteredData.genre || filteredData.region) {
      const validation = validateContentFields({
        title: (filteredData.title as string) || content.title,
        artistName: content.artistName,
        description: (filteredData.description as string) || content.description,
        genre: (filteredData.genre as string) || content.genre,
        region: (filteredData.region as string) || content.region,
        contentType: content.contentType,
        duration: content.duration,
      });
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }
    }
    
    await ctx.db.patch(contentId, {
      ...filteredData,
      eligibilityStatus: ELIGIBILITY_STATUS.ELIGIBLE,
      updatedAt: new Date(),
    });
    
    return contentId;
  },
});

export const getPendingModeration = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    return await ctx.db
      .query("moderationQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(limit)
      .collect();
  },
});

export const searchContent = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, limit = 50 }) => {
    const allContent = await ctx.db
      .query("artistContent")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(500);
    
    const queryLower = searchQuery.toLowerCase();
    return allContent.filter(c => 
      c.title.toLowerCase().includes(queryLower) ||
      c.artistName.toLowerCase().includes(queryLower) ||
      c.description.toLowerCase().includes(queryLower) ||
      c.genre.toLowerCase().includes(queryLower) ||
      c.tags.some(t => t.toLowerCase().includes(queryLower))
    ).slice(0, limit);
  },
});
