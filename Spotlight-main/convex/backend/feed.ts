import { query, mutation } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { FEED_CONFIG, TIERS } from "./constants";
import {
  calculateFeedWeight,
  getFeedWeightMultiplier,
} from "./helpers";
import type { TierType } from "./constants";

interface FeedItem {
  content: any;
  owner: any;
  weight: number;
  isPromoted: boolean;
  tierMultiplier: number;
  freshnessHours: number;
}

export const getSpotlightFeed = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { limit = 50, offset = 0, userId }) => {
    const allContent = await ctx.db
      .query("artistContent")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(500);
    
    const now = new Date();
    const feedItems: FeedItem[] = [];
    const artistAppearances: Record<string, number> = {};
    
    for (const content of allContent) {
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved") {
        continue;
      }
      
      const owner = await ctx.db.get(content.ownerId);
      if (!owner || owner.isSuspended) continue;
      
      const tier = (owner.tier || "standard") as TierType;
      const tierMultiplier = getFeedWeightMultiplier(tier);
      
      const hoursSinceCreation = (now.getTime() - content.createdAt.getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 100 - (hoursSinceCreation * 0.5));
      
      let weight = calculateFeedWeight({
        engagementScore: content.engagementScore,
        freshnessScore,
        isPromoted: content.isPromoted && content.promotionEndDate && new Date(content.promotionEndDate) > now,
        promotionEndDate: content.promotionEndDate,
        exposureCount: content.exposureCount,
        tierMultiplier,
      });
      
      if (hoursSinceCreation < FEED_CONFIG.SPOTLIGHT_FEED.freshContentBoostHours) {
        weight *= 1.2;
      }
      
      if (content.isPromoted && content.promotionEndDate && new Date(content.promotionEndDate) > now) {
        weight *= FEED_CONFIG.SPOTLIGHT_FEED.promotionBoostMultiplier;
      }
      
      const artistKey = content.ownerId;
      if (artistAppearances[artistKey]) {
        const appearances = artistAppearances[artistKey];
        const maxAppearances = FEED_CONFIG.SPOTLIGHT_FEED.maxSameArtistPerPage;
        
        if (appearances >= maxAppearances) {
          weight *= 0.3;
        }
        
        const lastExposure = content.lastExposureDate;
        if (lastExposure) {
          const hoursSinceExposure = (now.getTime() - lastExposure.getTime()) / (1000 * 60 * 60);
          if (hoursSinceExposure < FEED_CONFIG.SPOTLIGHT_FEED.exposureCooldownHours) {
            weight *= 0.5;
          }
        }
      }
      
      feedItems.push({
        content,
        owner: {
          _id: owner._id,
          name: owner.name,
          username: owner.username,
          avatarUrl: owner.avatarUrl,
          isVerified: owner.isVerified,
          tier: owner.tier,
        },
        weight,
        isPromoted: content.isPromoted && content.promotionEndDate && new Date(content.promotionEndDate) > now,
        tierMultiplier,
        freshnessHours: hoursSinceCreation,
      });
      
      artistAppearances[artistKey] = (artistAppearances[artistKey] || 0) + 1;
    }
    
    feedItems.sort((a, b) => b.weight - a.weight);
    
    const startIndex = offset;
    const paginatedItems = feedItems.slice(startIndex, startIndex + limit);
    
    return paginatedItems.map(item => ({
      ...item.content,
      owner: item.owner,
      weight: item.weight,
      isPromoted: item.isPromoted,
      tierLabel: TIERS[item.tier as TierType]?.name || "Standard",
    }));
  },
});

export const getFreshFaceFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20 }) => {
    const now = new Date();
    
    const freshFaces = await ctx.db
      .query("users")
      .withIndex("by_freshFaceScore", (q) => q.order("desc"))
      .take(100)
      .collect();
    
    const eligibleFreshFaces = freshFaces.filter(u => 
      u.isFreshFace && 
      u.freshFaceScore >= FEED_CONFIG.FRESH_FACE.minFreshFaceScore &&
      !u.isSuspended
    );
    
    const feedItems: any[] = [];
    
    for (const user of eligibleFreshFaces) {
      const content = await ctx.db
        .query("artistContent")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .first();
      
      if (!content) continue;
      
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved") {
        continue;
      }
      
      const hoursSinceCreation = (now.getTime() - content.createdAt.getTime()) / (1000 * 60 * 60);
      const daysSinceLastUpload = hoursSinceCreation / 24;
      
      if (daysSinceLastUpload > FEED_CONFIG.FRESH_FACE.maxDaysSinceLastUpload) {
        continue;
      }
      
      let weight = content.engagementScore * FEED_CONFIG.FRESH_FACE.engagementGrowthBoost;
      weight += (100 - hoursSinceCreation * 0.5);
      weight += user.freshFaceScore;
      
      if (hoursSinceCreation < FEED_CONFIG.FRESH_FACE.newArtistBoostHours / 24) {
        weight *= 1.5;
      }
      
      if (user.exposureCount < FEED_CONFIG.FRESH_FACE.maxPriorExposure) {
        weight *= 1.3;
      }
      
      feedItems.push({
        ...content,
        owner: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          freshFaceScore: user.freshFaceScore,
        },
        weight,
        isFreshFace: true,
        daysOld: Math.round(hoursSinceCreation / 24),
      });
    }
    
    feedItems.sort((a, b) => b.weight - a.weight);
    
    return feedItems.slice(0, limit);
  },
});

export const getTrendingContent = query({
  args: {
    limit: v.optional(v.number()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 20, period = "week" }) => {
    const now = new Date();
    let periodHours = 168;
    
    if (period === "day") periodHours = 24;
    else if (period === "month") periodHours = 720;
    
    const cutoff = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
    
    const allContent = await ctx.db
      .query("artistContent")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(500);
    
    const trendingItems: any[] = [];
    
    for (const content of allContent) {
      if (content.createdAt < cutoff) continue;
      
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved") {
        continue;
      }
      
      const owner = await ctx.db.get(content.ownerId);
      if (!owner || owner.isSuspended) continue;
      
      const trendingScore = 
        (content.likes || 0) * 3 + 
        (content.comments || 0) * 5 + 
        (content.shares || 0) * 10 +
        (content.views || 0) * 0.1;
      
      trendingItems.push({
        ...content,
        owner: {
          _id: owner._id,
          name: owner.name,
          username: owner.username,
          avatarUrl: owner.avatarUrl,
          isVerified: owner.isVerified,
        },
        trendingScore,
        period,
      });
    }
    
    trendingItems.sort((a, b) => b.trendingScore - a.trendingScore);
    
    return trendingItems.slice(0, limit);
  },
});

export const getFollowingFeed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    
    const followingIds = follows.map(f => f.followingId);
    
    if (followingIds.length === 0) {
      return [];
    }
    
    const now = new Date();
    const feedItems: any[] = [];
    
    for (const followingId of followingIds) {
      const content = await ctx.db
        .query("artistContent")
        .withIndex("by_owner", (q) => q.eq("ownerId", followingId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .first();
      
      if (!content) continue;
      
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved") {
        continue;
      }
      
      const owner = await ctx.db.get(followingId);
      
      feedItems.push({
        ...content,
        owner: owner ? {
          _id: owner._id,
          name: owner.name,
          username: owner.username,
          avatarUrl: owner.avatarUrl,
          isVerified: owner.isVerified,
        } : null,
      });
    }
    
    feedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return feedItems.slice(0, limit);
  },
});

export const recordExposure = mutation({
  args: {
    contentId: v.id("artistContent"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, { contentId, viewerId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    await ctx.db.patch(contentId, {
      exposureCount: (content.exposureCount || 0) + 1,
      lastExposureDate: new Date(),
      updatedAt: new Date(),
    });
    
    return { success: true };
  },
});

export const getGenreFeed = query({
  args: {
    genre: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { genre, limit = 50 }) => {
    const now = new Date();
    
    const content = await ctx.db
      .query("artistContent")
      .withIndex("by_genre", (q) => q.eq("genre", genre))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);
    
    const itemsWithWeight: any[] = [];
    
    for (const item of content) {
      if (item.moderationStatus !== "approved" && item.submissionStatus !== "approved") {
        continue;
      }
      
      const owner = await ctx.db.get(item.ownerId);
      if (!owner || owner.isSuspended) continue;
      
      const tier = (owner.tier || "standard") as TierType;
      const tierMultiplier = getFeedWeightMultiplier(tier);
      const hoursSinceCreation = (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 100 - (hoursSinceCreation * 0.5));
      
      const weight = calculateFeedWeight({
        engagementScore: item.engagementScore,
        freshnessScore,
        isPromoted: item.isPromoted && item.promotionEndDate && new Date(item.promotionEndDate) > now,
        promotionEndDate: item.promotionEndDate,
        exposureCount: item.exposureCount,
        tierMultiplier,
      });
      
      itemsWithWeight.push({
        ...item,
        owner: {
          _id: owner._id,
          name: owner.name,
          username: owner.username,
          avatarUrl: owner.avatarUrl,
          isVerified: owner.isVerified,
        },
        weight,
      });
    }
    
    itemsWithWeight.sort((a, b) => b.weight - a.weight);
    
    return itemsWithWeight.slice(0, limit);
  },
});

export const getRegionFeed = query({
  args: {
    region: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { region, limit = 50 }) => {
    const now = new Date();
    
    const content = await ctx.db
      .query("artistContent")
      .withIndex("by_region", (q) => q.eq("region", region))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);
    
    const itemsWithWeight: any[] = [];
    
    for (const item of content) {
      if (item.moderationStatus !== "approved" && item.submissionStatus !== "approved") {
        continue;
      }
      
      const owner = await ctx.db.get(item.ownerId);
      if (!owner || owner.isSuspended) continue;
      
      const tier = (owner.tier || "standard") as TierType;
      const tierMultiplier = getFeedWeightMultiplier(tier);
      const hoursSinceCreation = (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 100 - (hoursSinceCreation * 0.5));
      
      const weight = calculateFeedWeight({
        engagementScore: item.engagementScore,
        freshnessScore,
        isPromoted: item.isPromoted && item.promotionEndDate && new Date(item.promotionEndDate) > now,
        promotionEndDate: item.promotionEndDate,
        exposureCount: item.exposureCount,
        tierMultiplier,
      });
      
      itemsWithWeight.push({
        ...item,
        owner: {
          _id: owner._id,
          name: owner.name,
          username: owner.username,
          avatarUrl: owner.avatarUrl,
          isVerified: owner.isVerified,
        },
        weight,
      });
    }
    
    itemsWithWeight.sort((a, b) => b.weight - a.weight);
    
    return itemsWithWeight.slice(0, limit);
  },
});
