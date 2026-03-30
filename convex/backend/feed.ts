import { query } from "../_generated/server";
import { v } from "convex/values";
import { getFeedWeightMultiplier } from "../helpers";
import { TIER_VISIBILITY_FAIRNESS } from "../constants";

const FEED_CONFIG = {
  SPOTLIGHT_FEED: { maxSameArtistPerPage: 2, exposureCooldownHours: 24, promotionBoostMultiplier: 3.0, freshContentBoostHours: 72 },
  FRESH_FACE: { minFreshFaceScore: 50, engagementGrowthBoost: 1.5, maxPriorExposure: 5, maxDaysSinceLastUpload: 14 },
};

const TIER_ORDER: Record<string, number> = {
  standard: 1,
  growth: 2,
  elite: 3,
};

export const getSpotlightFeed = query({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()), userId: v.optional(v.id("users")) },
  handler: async (ctx, { limit = 50, offset = 0, userId }) => {
    // Get blocked users if userId provided
    let blockedUserIds: string[] = [];
    if (userId) {
      const blocks = await ctx.db.query("blocks").withIndex("by_blocker", (q) => q.eq("blockerId", userId)).collect();
      blockedUserIds = blocks.map(b => b.blockedId);
    }
    
    const allContent = (await ctx.db.query("artistContent").filter((q) => q.eq(q.field("isActive"), true)).collect()).slice(0, 500);
    const now = Date.now();
    const feedItems: any[] = [];
    const artistAppearances: Record<string, number> = {};

    for (const content of allContent) {
      // Skip blocked content
      if (blockedUserIds.includes(content.ownerId)) continue;
      
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved" && content.moderationStatus !== "pending") continue;
      const owner = await ctx.db.get(content.ownerId);
      if (!owner || owner.isSuspended) continue;

      const tier = owner.tier || "standard";
      const tierMultiplier = getFeedWeightMultiplier(tier, owner.role);
      const hoursSinceCreation = (now - content.createdAt) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 100 - (hoursSinceCreation * 0.5));

      let weight = content.engagementScore * 0.4 + freshnessScore * 0.3 + tierMultiplier * 20;

      // Tier fairness: Cap Elite content weight to prevent domination
      const tierLevel = TIER_ORDER[tier] || 1;
      if (tierLevel === 3) { // Elite
        weight = Math.min(weight, content.engagementScore * 0.4 + freshnessScore * 0.3 + TIER_VISIBILITY_FAIRNESS.ELITE_CONTENT_MAX_WEIGHT_MULTIPLIER * 20);
      }
      
      // Boost standard content slightly to keep fair visibility
      if (tierLevel === 1) {
        weight = Math.max(weight, content.engagementScore * 0.4 + freshnessScore * 0.3 + TIER_VISIBILITY_FAIRNESS.STANDARD_CONTENT_MIN_WEIGHT_MULTIPLIER * 20);
      }

      if (content.isPromoted && content.promotionEndDate && content.promotionEndDate > now) weight *= FEED_CONFIG.SPOTLIGHT_FEED.promotionBoostMultiplier;
      if (hoursSinceCreation < FEED_CONFIG.SPOTLIGHT_FEED.freshContentBoostHours) weight *= 1.2;

      const artistKey = content.ownerId;
      if (artistAppearances[artistKey]) {
        if (artistAppearances[artistKey] >= FEED_CONFIG.SPOTLIGHT_FEED.maxSameArtistPerPage) weight *= 0.3;
        if (content.lastExposureDate) {
          const hoursSinceExposure = (now - content.lastExposureDate) / (1000 * 60 * 60);
          if (hoursSinceExposure < FEED_CONFIG.SPOTLIGHT_FEED.exposureCooldownHours) weight *= 0.5;
        }
      }

      feedItems.push({
        ...content, owner: { _id: owner._id, name: owner.name, username: owner.username, avatarUrl: owner.avatarUrl, isVerified: owner.isVerified, tier: owner.tier }, weight,
        isPromoted: content.isPromoted && content.promotionEndDate && content.promotionEndDate > now,
      });
      artistAppearances[artistKey] = (artistAppearances[artistKey] || 0) + 1;
    }

    feedItems.sort((a, b) => b.weight - a.weight);
    return feedItems.slice(offset, offset + limit);
  },
});

export const getFreshFaceFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const now = Date.now();
    const freshFaces = await ctx.db.query("users").withIndex("by_freshFaceScore", (q) => q).collect();
    const eligible = freshFaces.filter(u => u.isFreshFace && u.freshFaceScore >= FEED_CONFIG.FRESH_FACE.minFreshFaceScore && !u.isSuspended).slice(0, 100);
    const feedItems: any[] = [];

    for (const user of eligible) {
      const contents = await ctx.db.query("artistContent").withIndex("by_owner", (q) => q.eq("ownerId", user._id)).filter((q) => q.eq(q.field("isActive"), true)).collect();
      const content = contents.sort((a, b) => b.createdAt - a.createdAt)[0];
      if (!content) continue;
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved" && content.moderationStatus !== "pending") continue;

      const hoursSinceCreation = (now - content.createdAt) / (1000 * 60 * 60);
      const daysSinceUpload = hoursSinceCreation / 24;
      if (daysSinceUpload > FEED_CONFIG.FRESH_FACE.maxDaysSinceLastUpload) continue;

      let weight = content.engagementScore * FEED_CONFIG.FRESH_FACE.engagementGrowthBoost + (100 - hoursSinceCreation * 0.5) + user.freshFaceScore;
      if (hoursSinceCreation < 168) weight *= 1.5;
      if (user.exposureCount < FEED_CONFIG.FRESH_FACE.maxPriorExposure) weight *= 1.3;

      feedItems.push({ ...content, owner: { _id: user._id, name: user.name, username: user.username, avatarUrl: user.avatarUrl, isVerified: user.isVerified, freshFaceScore: user.freshFaceScore }, weight, isFreshFace: true, daysOld: Math.round(hoursSinceCreation / 24) });
    }

    feedItems.sort((a, b) => b.weight - a.weight);
    return feedItems.slice(0, limit);
  },
});

export const getTrendingContent = query({
  args: { limit: v.optional(v.number()), period: v.optional(v.string()) },
  handler: async (ctx, { limit = 20, period = "week" }) => {
    const now = Date.now();
    const periodHours = period === "day" ? 24 : period === "month" ? 720 : 168;
    const cutoff = now - periodHours * 60 * 60 * 1000;
    const allContent = (await ctx.db.query("artistContent").filter((q) => q.eq(q.field("isActive"), true)).collect()).slice(0, 500);
    const trendingItems: any[] = [];

    for (const content of allContent) {
      if (content.createdAt < cutoff) continue;
      if (content.moderationStatus !== "approved" && content.submissionStatus !== "approved" && content.moderationStatus !== "pending") continue;
      const owner = await ctx.db.get(content.ownerId);
      if (!owner || owner.isSuspended) continue;
      const trendingScore = (content.likes || 0) * 3 + (content.comments || 0) * 5 + (content.shares || 0) * 10 + (content.views || 0) * 0.1;
      trendingItems.push({ ...content, owner: { _id: owner._id, name: owner.name, username: owner.username, avatarUrl: owner.avatarUrl, isVerified: owner.isVerified }, trendingScore, period });
    }

    trendingItems.sort((a, b) => b.trendingScore - a.trendingScore);
    return trendingItems.slice(0, limit);
  },
});
