import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { PROMOTION_CREDITS, PROMOTION_PAID, TIERS } from "../constants";
import { spendLightCredz, startPromotion, checkContentEligibility } from "../helpers";

export const getAllPromotionOptions = query({
  args: { tier: v.optional(v.string()) },
  handler: async (ctx, { tier }) => {
    const userTier = tier || "standard";
    const discount = TIERS[userTier as keyof typeof TIERS]?.promotionDiscount || 0;
    const creditOptions = Object.entries(PROMOTION_CREDITS).map(([key, value]) => ({ key, ...value, discountedCredits: Math.floor(value.credits * (1 - discount / 100)) }));
    const paidOptions = Object.entries(PROMOTION_PAID).map(([key, value]) => ({ key, ...value, discountedPrice: Math.floor(value.price * (1 - discount / 100) * 100) / 100 }));
    return { creditOptions, paidOptions, discount };
  },
});

export const promoteWithCredits = mutation({
  args: { contentId: v.id("artistContent"), userId: v.id("users"), promotionKey: v.string() },
  handler: async (ctx, { contentId, userId, promotionKey }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    if (content.ownerId !== userId) throw new Error("You can only promote your own content");
    if (!content.isActive) throw new Error("Cannot promote inactive content");
    const eligibility = await checkContentEligibility(ctx, contentId);
    if (!eligibility.eligible) throw new Error(`Content is not eligible for promotion: ${eligibility.reason}`);
    if (content.isPromoted && content.promotionEndDate && content.promotionEndDate > Date.now()) throw new Error("Content is already being promoted");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const promotionOption = (PROMOTION_CREDITS as any)[promotionKey];
    if (!promotionOption) throw new Error("Invalid promotion option");

    const discount = TIERS[user.tier as keyof typeof TIERS]?.promotionDiscount || 0;
    const creditsNeeded = Math.floor(promotionOption.credits * (1 - discount / 100));

    const spendResult = await spendLightCredz(ctx, userId, creditsNeeded, "promotion_spent", `${promotionOption.label} promotion`, contentId);
    if (!spendResult.success) throw new Error(spendResult.reason);

    await startPromotion(ctx, contentId, userId, "credits", promotionOption.hours, creditsNeeded);
    return { success: true, creditsSpent: creditsNeeded, promotionHours: promotionOption.hours, endDate: Date.now() + promotionOption.hours * 60 * 60 * 1000 };
  },
});

export const promoteWithPayment = mutation({
  args: { contentId: v.id("artistContent"), userId: v.id("users"), promotionKey: v.string() },
  handler: async (ctx, { contentId, userId, promotionKey }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    if (content.ownerId !== userId) throw new Error("You can only promote your own content");
    if (!content.isActive) throw new Error("Cannot promote inactive content");
    const eligibility = await checkContentEligibility(ctx, contentId);
    if (!eligibility.eligible) throw new Error(`Content is not eligible: ${eligibility.reason}`);

    const promotionOption = (PROMOTION_PAID as any)[promotionKey];
    if (!promotionOption) throw new Error("Invalid promotion option");

    const user = await ctx.db.get(userId);
    const discount = TIERS[user?.tier as keyof typeof TIERS]?.promotionDiscount || 0;
    const price = Math.floor(promotionOption.price * (1 - discount / 100) * 100) / 100;

    await startPromotion(ctx, contentId, userId, "paid", promotionOption.hours, undefined, price);
    return { success: true, amount: price, promotionHours: promotionOption.hours, endDate: Date.now() + promotionOption.hours * 60 * 60 * 1000 };
  },
});

export const getContentPromotionStatus = query({
  args: { contentId: v.id("artistContent") },
  handler: async (ctx, { contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    if (!content.isPromoted) return { isPromoted: false, promotionType: null, promotionSource: null, hoursRemaining: 0, endDate: null };
    const now = Date.now();
    const endDate = content.promotionEndDate || null;
    const hoursRemaining = endDate ? Math.max(0, (endDate - now) / (1000 * 60 * 60)) : 0;
    return { isPromoted: true, promotionType: content.promotionType, promotionSource: content.promotionSource, hoursRemaining: Math.round(hoursRemaining * 10) / 10, endDate, isActive: endDate ? endDate > now : false };
  },
});
