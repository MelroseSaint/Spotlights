import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { TIERS, isRootAdmin } from "./constants";
import type { TierType } from "./constants";

export const getSubscriptionTiers = query({
  args: {},
  handler: async (ctx) => {
    return Object.values(TIERS).map(tier => ({
      ...tier,
      isCurrentTier: false,
    }));
  },
});

export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const currentTier = TIERS[user.tier as TierType];
    
    return {
      tier: user.tier,
      tierDetails: currentTier,
      status: user.subscriptionStatus,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      isActive: user.subscriptionStatus === "active" && 
                user.subscriptionEndDate && 
                new Date(user.subscriptionEndDate) > new Date(),
      maxContentAllowed: user.maxContentAllowed,
      activeContentCount: user.activeContentCount,
      canUpgrade: user.tier !== "elite",
      canDowngrade: user.tier !== "standard",
    };
  },
});

export const upgradeTier = mutation({
  args: {
    userId: v.id("users"),
    newTier: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, { userId, newTier, duration }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const newTierConfig = TIERS[newTier as TierType];
    if (!newTierConfig) {
      throw new Error("Invalid tier");
    }
    
    const currentTierIndex = Object.keys(TIERS).indexOf(user.tier);
    const newTierIndex = Object.keys(TIERS).indexOf(newTier);
    
    if (newTierIndex <= currentTierIndex && user.tier !== "standard") {
      throw new Error("Use downgradeTier for downgrading. For same tier, use renewSubscription.");
    }
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
    
    await ctx.db.patch(userId, {
      tier: newTier,
      subscriptionStatus: "active",
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      maxContentAllowed: newTierConfig.maxContent,
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("subscriptions", {
      userId,
      tier: newTier,
      status: "active",
      startDate,
      endDate,
      autoRenew: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId,
      type: "subscription_upgrade",
      title: "Subscription Upgraded",
      message: `You've upgraded to ${newTierConfig.name} tier! Enjoy your new features.`,
      isRead: false,
      createdAt: new Date(),
    });
    
    return {
      success: true,
      tier: newTier,
      tierDetails: newTierConfig,
      startDate,
      endDate,
    };
  },
});

export const downgradeTier = mutation({
  args: {
    userId: v.id("users"),
    effectiveDate: v.optional(v.string()),
  },
  handler: async (ctx, { userId, effectiveDate }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    if (user.tier === "standard") {
      throw new Error("Already on the lowest tier");
    }
    
    const currentTierConfig = TIERS[user.tier as TierType];
    let newTier = "standard";
    let newTierConfig = TIERS.STANDARD;
    
    if (user.tier === "elite") {
      newTier = "growth";
      newTierConfig = TIERS.GROWTH;
    }
    
    if (user.activeContentCount > newTierConfig.maxContent) {
      throw new Error(`Cannot downgrade: You have ${user.activeContentCount} active content items but ${newTierConfig.name} tier only allows ${newTierConfig.maxContent}. Please delete some content first.`);
    }
    
    const effective = effectiveDate ? new Date(effectiveDate) : new Date();
    
    await ctx.db.patch(userId, {
      tier: newTier,
      subscriptionStatus: "active",
      subscriptionStartDate: effective,
      subscriptionEndDate: effective,
      maxContentAllowed: newTierConfig.maxContent,
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("subscriptions", {
      userId,
      tier: newTier,
      status: "active",
      startDate: effective,
      endDate: effective,
      autoRenew: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId,
      type: "subscription_downgrade",
      title: "Subscription Downgraded",
      message: `Your subscription has been downgraded to ${newTierConfig.name} tier. Your new upload limit is ${newTierConfig.maxContent} content items.`,
      isRead: false,
      createdAt: new Date(),
    });
    
    return {
      success: true,
      tier: newTier,
      tierDetails: newTierConfig,
      effectiveDate: effective,
    };
  },
});

export const cancelSubscription = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    if (user.subscriptionStatus !== "active") {
      throw new Error("No active subscription to cancel");
    }
    
    await ctx.db.patch(userId, {
      subscriptionStatus: "cancelled",
      updatedAt: new Date(),
    });
    
    const activeSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (activeSub) {
      await ctx.db.patch(activeSub._id, {
        status: "cancelled",
        updatedAt: new Date(),
      });
    }
    
    await ctx.db.insert("notifications", {
      userId,
      type: "subscription_cancelled",
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled. You will retain paid features until your current period ends.",
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const processExpiredSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    
    const users = await ctx.db.query("users").collect();
    
    let processed = 0;
    for (const user of users) {
      if (user.subscriptionStatus === "active" && user.subscriptionEndDate) {
        if (new Date(user.subscriptionEndDate) < now) {
          await ctx.db.patch(user._id, {
            subscriptionStatus: "expired",
            tier: "standard",
            maxContentAllowed: TIERS.STANDARD.maxContent,
            updatedAt: new Date(),
          });
          
          const activeSub = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();
          
          if (activeSub) {
            await ctx.db.patch(activeSub._id, {
              status: "expired",
              updatedAt: new Date(),
            });
          }
          
          processed++;
        }
      }
    }
    
    return { processedSubscriptions: processed };
  },
});

export const getSubscriptionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

export const getAdminSubscriptionOverview = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const users = await ctx.db.query("users").collect();
    
    const breakdown = {
      standard: 0,
      growth: 0,
      elite: 0,
      active: 0,
      expired: 0,
      cancelled: 0,
      none: 0,
    };
    
    const revenue = {
      monthly: 0,
      estimated: 0,
    };
    
    for (const user of users) {
      breakdown[user.tier as keyof typeof breakdown]++;
      breakdown[user.subscriptionStatus as keyof typeof breakdown]++;
      
      if (user.subscriptionStatus === "active") {
        revenue.monthly += TIERS[user.tier as TierType]?.price || 0;
      }
    }
    
    revenue.estimated = revenue.monthly * 12;
    
    return {
      breakdown,
      revenue,
      totalUsers: users.length,
    };
  },
});

export const assignTierManually = mutation({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
    tier: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, { adminId, userId, tier, reason }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const targetUser = await ctx.db.get(userId);
    if (!targetUser) throw new Error("User not found");
    
    const tierConfig = TIERS[tier as TierType];
    if (!tierConfig) {
      throw new Error("Invalid tier");
    }
    
    if (targetUser.activeContentCount > tierConfig.maxContent) {
      throw new Error(`User has ${targetUser.activeContentCount} content items but ${tierConfig.name} only allows ${tierConfig.maxContent}`);
    }
    
    await ctx.db.patch(userId, {
      tier,
      maxContentAllowed: tierConfig.maxContent,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("subscriptions", {
      userId,
      tier,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: false,
      paymentId: "admin_grant",
      paymentAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId,
      type: "tier_granted",
      title: "Tier Upgraded",
      message: `You've been granted ${tierConfig.name} tier: ${reason}`,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});
