import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { TIERS } from "../constants";

export const getSubscriptionTiers = query({
  args: {},
  handler: async (ctx) => Object.values(TIERS).map(tier => ({ ...tier, isCurrentTier: false })),
});

export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const isAdmin = user.role === "root_admin" || user.role === "admin" || user.role === "moderator";
    const currentTier = TIERS[user.tier as keyof typeof TIERS];
    return {
      tier: user.tier, tierDetails: currentTier, status: user.subscriptionStatus,
      startDate: user.subscriptionStartDate, endDate: user.subscriptionEndDate,
      isActive: user.subscriptionStatus === "active" && user.subscriptionEndDate && user.subscriptionEndDate > Date.now(),
      maxContentAllowed: isAdmin ? -1 : user.maxContentAllowed, activeContentCount: user.activeContentCount,
      canUpgrade: !isAdmin && user.tier !== "elite", canDowngrade: !isAdmin && user.tier !== "standard",
      isAdmin,
    };
  },
});

export const upgradeTier = mutation({
  args: { userId: v.id("users"), newTier: v.string(), duration: v.number() },
  handler: async (ctx, { userId, newTier, duration }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const newTierConfig = TIERS[newTier as keyof typeof TIERS];
    if (!newTierConfig) throw new Error("Invalid tier");
    const startDate = Date.now();
    const endDate = startDate + duration * 30 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(userId, { tier: newTier, subscriptionStatus: "active", subscriptionStartDate: startDate, subscriptionEndDate: endDate, maxContentAllowed: newTierConfig.maxContent, updatedAt: Date.now() });
    await ctx.db.insert("subscriptions", { userId, tier: newTier, status: "active", startDate, endDate, autoRenew: false, createdAt: Date.now(), updatedAt: Date.now() });
    return { success: true, tier: newTier, tierDetails: newTierConfig, startDate, endDate };
  },
});

export const cancelSubscription = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.subscriptionStatus !== "active") throw new Error("No active subscription to cancel");
    await ctx.db.patch(userId, { subscriptionStatus: "cancelled", updatedAt: Date.now() });
    const activeSub = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).filter((q) => q.eq(q.field("status"), "active")).first();
    if (activeSub) await ctx.db.patch(activeSub._id, { status: "cancelled", updatedAt: Date.now() });
    return { success: true };
  },
});
