import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { PROMOTION_CREDITS, PROMOTION_PAID, TIERS } from "./constants";
import {
  spendLightCredz,
  startPromotion,
  endPromotion,
  checkContentEligibility,
} from "./helpers";
import type { TierType } from "./constants";

export const getPromotionCost = query({
  args: { promotionKey: v.string() },
  handler: async (ctx, { promotionKey }) => {
    const creditPromo = PROMOTION_CREDITS[PROMOTION_CREDITS as unknown as keyof typeof PROMOTION_CREDITS][promotionKey as keyof typeof PROMOTION_CREDITS];
    const paidPromo = PROMOTION_PAID[PROMOTION_PAID as unknown as keyof typeof PROMOTION_PAID][promotionKey as keyof typeof PROMOTION_PAID];
    
    if (creditPromo) {
      return { type: "credits", ...creditPromo };
    }
    if (paidPromo) {
      return { type: "paid", ...paidPromo };
    }
    
    return null;
  },
});

export const getAllPromotionOptions = query({
  args: { tier: v.optional(v.string()) },
  handler: async (ctx, { tier }) => {
    const userTier = (tier as TierType) || "standard";
    const discount = TIERS[userTier]?.promotionDiscount || 0;
    
    const creditOptions = Object.entries(PROMOTION_CREDITS).map(([key, value]) => ({
      key,
      ...value,
      discountedCredits: Math.floor(value.credits * (1 - discount / 100)),
    }));
    
    const paidOptions = Object.entries(PROMOTION_PAID).map(([key, value]) => ({
      key,
      ...value,
      discountedPrice: Math.floor(value.price * (1 - discount / 100) * 100) / 100,
    }));
    
    return {
      creditOptions,
      paidOptions,
      discount,
    };
  },
});

export const promoteWithCredits = mutation({
  args: {
    contentId: v.id("artistContent"),
    userId: v.id("users"),
    promotionKey: v.string(),
  },
  handler: async (ctx, { contentId, userId, promotionKey }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (content.ownerId !== userId) {
      throw new Error("You can only promote your own content");
    }
    
    if (!content.isActive) {
      throw new Error("Cannot promote inactive content");
    }
    
    const eligibility = await checkContentEligibility(ctx, contentId);
    if (!eligibility.eligible) {
      throw new Error(`Content is not eligible for promotion: ${eligibility.reason}`);
    }
    
    if (content.isPromoted && content.promotionEndDate && new Date(content.promotionEndDate) > new Date()) {
      throw new Error("Content is already being promoted");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const promotionOption = PROMOTION_CREDITS[PROMOTION_CREDITS as unknown as keyof typeof PROMOTION_CREDITS][promotionKey as keyof typeof PROMOTION_CREDITS];
    if (!promotionOption) {
      throw new Error("Invalid promotion option");
    }
    
    const discount = TIERS[user.tier as TierType]?.promotionDiscount || 0;
    const creditsNeeded = Math.floor(promotionOption.credits * (1 - discount / 100));
    
    const spendResult = await spendLightCredz(
      ctx,
      userId,
      creditsNeeded,
      "promotion_spent",
      `${promotionOption.label} promotion`,
      contentId
    );
    
    if (!spendResult.success) {
      throw new Error(spendResult.reason);
    }
    
    await startPromotion(ctx, contentId, userId, "credits", promotionOption.hours, creditsNeeded);
    
    return {
      success: true,
      creditsSpent: creditsNeeded,
      promotionHours: promotionOption.hours,
      endDate: new Date(Date.now() + promotionOption.hours * 60 * 60 * 1000),
    };
  },
});

export const promoteWithPayment = mutation({
  args: {
    contentId: v.id("artistContent"),
    userId: v.id("users"),
    promotionKey: v.string(),
  },
  handler: async (ctx, { contentId, userId, promotionKey }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (content.ownerId !== userId) {
      throw new Error("You can only promote your own content");
    }
    
    if (!content.isActive) {
      throw new Error("Cannot promote inactive content");
    }
    
    const eligibility = await checkContentEligibility(ctx, contentId);
    if (!eligibility.eligible) {
      throw new Error(`Content is not eligible for promotion: ${eligibility.reason}`);
    }
    
    if (content.isPromoted && content.promotionEndDate && new Date(content.promotionEndDate) > new Date()) {
      throw new Error("Content is already being promoted");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const promotionOption = PROMOTION_PAID[PROMOTION_PAID as unknown as keyof typeof PROMOTION_PAID][promotionKey as keyof typeof PROMOTION_PAID];
    if (!promotionOption) {
      throw new Error("Invalid promotion option");
    }
    
    const discount = TIERS[user.tier as TierType]?.promotionDiscount || 0;
    const price = Math.floor(promotionOption.price * (1 - discount / 100) * 100) / 100;
    
    await startPromotion(ctx, contentId, userId, "paid", promotionOption.hours, undefined, price);
    
    return {
      success: true,
      amount: price,
      promotionHours: promotionOption.hours,
      endDate: new Date(Date.now() + promotionOption.hours * 60 * 60 * 1000),
    };
  },
});

export const stopPromotion = mutation({
  args: {
    contentId: v.id("artistContent"),
    userId: v.id("users"),
  },
  handler: async (ctx, { contentId, userId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (content.ownerId !== userId) {
      throw new Error("You can only stop promotion of your own content");
    }
    
    if (!content.isPromoted) {
      throw new Error("Content is not currently promoted");
    }
    
    await endPromotion(ctx, contentId);
    
    return { success: true };
  },
});

export const getContentPromotionStatus = query({
  args: { contentId: v.id("artistContent") },
  handler: async (ctx, { contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    if (!content.isPromoted) {
      return {
        isPromoted: false,
        promotionType: null,
        promotionSource: null,
        hoursRemaining: 0,
        endDate: null,
      };
    }
    
    const now = new Date();
    const endDate = content.promotionEndDate ? new Date(content.promotionEndDate) : null;
    const hoursRemaining = endDate ? Math.max(0, (endDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0;
    
    return {
      isPromoted: true,
      promotionType: content.promotionType,
      promotionSource: content.promotionSource,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      endDate: endDate,
      isActive: endDate ? endDate > now : false,
    };
  },
});

export const getUserPromotions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("promotions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

export const getActivePromotions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const now = new Date();
    const activePromotions = await ctx.db
      .query("promotions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.gt(q.field("endDate"), now))
      .take(limit)
      .collect();
    
    const promotionsWithContent = await Promise.all(
      activePromotions.map(async (promo) => {
        const content = await ctx.db.get(promo.contentId);
        const owner = content ? await ctx.db.get(content.ownerId) : null;
        return {
          ...promo,
          content: content ? {
            _id: content._id,
            title: content.title,
            artistName: content.artistName,
            thumbnailUrl: content.thumbnailUrl,
            genre: content.genre,
          } : null,
          owner: owner ? {
            _id: owner._id,
            name: owner.name,
            avatarUrl: owner.avatarUrl,
            tier: owner.tier,
          } : null,
        };
      })
    );
    
    return promotionsWithContent.filter(p => p.content);
  },
});

export const checkExpiredPromotions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    
    const expiredPromotions = await ctx.db
      .query("promotions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.lt(q.field("endDate"), now))
      .collect();
    
    let count = 0;
    for (const promo of expiredPromotions) {
      await ctx.db.patch(promo._id, { isActive: false });
      
      const content = await ctx.db.get(promo.contentId);
      if (content && content.isPromoted) {
        await ctx.db.patch(promo.contentId, {
          isPromoted: false,
          promotionType: undefined,
          promotionStartDate: undefined,
          promotionEndDate: undefined,
          promotionSource: undefined,
          promotionTier: undefined,
          updatedAt: new Date(),
        });
      }
      count++;
    }
    
    return { expiredCount: count };
  },
});
