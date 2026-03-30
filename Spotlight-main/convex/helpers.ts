import { QueryCtx, MutationCtx } from "convex/server";
import { Id } from "convex/values";
import {
  TIERS,
  ROLES,
  ROOT_ADMIN_EMAIL,
  CONTENT_REQUIREMENTS,
  type TierType,
  type RoleType,
} from "./constants";

// ========== USER HELPERS ==========
export async function getUserById(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db.get(userId);
}

export async function getUserByEmail(ctx: QueryCtx | MutationCtx, email: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
}

export function isRootAdmin(email: string): boolean {
  return email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
}

export function canManageUser(requestingUser: { role: string; email: string } | null, targetUserId: Id<"users">, targetUser: { email: string; role: string }): boolean {
  if (!requestingUser) return false;
  
  // Root admin can manage anyone
  if (isRootAdmin(requestingUser.email)) return true;
  
  // Cannot manage other admins or root admin
  const targetRole = ROLES[targetUser.role as RoleType];
  const requesterRole = ROLES[requestingUser.role as RoleType];
  
  if (!targetRole || !requesterRole) return false;
  if (targetRole.level >= requesterRole.level) return false;
  
  return requesterRole.canManageUsers;
}

export async function checkSubscriptionActive(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;
  
  if (user.subscriptionStatus === "active" && user.subscriptionEndDate) {
    return new Date(user.subscriptionEndDate) > new Date();
  }
  
  return false;
}

export function getMaxContentAllowed(tier: TierType): number {
  return TIERS[tier]?.maxContent ?? TIERS.STANDARD.maxContent;
}

export function getFeedWeightMultiplier(tier: TierType): number {
  return TIERS[tier]?.feedWeightMultiplier ?? 1.0;
}

export async function canUploadContent(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<{ canUpload: boolean; reason?: string }> {
  const user = await ctx.db.get(userId);
  if (!user) return { canUpload: false, reason: "User not found" };
  
  if (user.isSuspended) {
    return { canUpload: false, reason: "Account is suspended" };
  }
  
  const maxAllowed = user.maxContentAllowed;
  const activeCount = user.activeContentCount;
  
  if (activeCount >= maxAllowed) {
    return { 
      canUpload: false, 
      reason: `Upload limit reached (${activeCount}/${maxAllowed}). Delete content or upgrade your tier.` 
    };
  }
  
  return { canUpload: true };
}

// ========== CONTENT HELPERS ==========
export function validateContentFields(content: {
  title?: string;
  artistName?: string;
  description?: string;
  genre?: string;
  region?: string;
  contentType?: string;
  duration?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content.title || content.title.length < CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH) {
    errors.push(`Title must be at least ${CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH} characters`);
  }
  if (content.title && content.title.length > CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH) {
    errors.push(`Title must be less than ${CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH} characters`);
  }
  
  if (!content.artistName || content.artistName.trim().length === 0) {
    errors.push("Artist name is required");
  }
  
  if (!content.description || content.description.length < CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH) {
    errors.push(`Description must be at least ${CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH} characters`);
  }
  
  if (!content.genre || !CONTENT_REQUIREMENTS.ALLOWED_GENRES.includes(content.genre)) {
    errors.push("Valid genre is required");
  }
  
  if (!content.region || !CONTENT_REQUIREMENTS.ALLOWED_REGIONS.includes(content.region)) {
    errors.push("Valid Central PA region is required");
  }
  
  if (!content.contentType || !CONTENT_REQUIREMENTS.ALLOWED_CONTENT_TYPES.includes(content.contentType)) {
    errors.push("Valid content type (audio/video) is required");
  }
  
  if (content.duration !== undefined) {
    if (content.duration < CONTENT_REQUIREMENTS.MIN_DURATION_SECONDS) {
      errors.push(`Content must be at least ${CONTENT_REQUIREMENTS.MIN_DURATION_SECONDS} seconds`);
    }
    if (content.duration > CONTENT_REQUIREMENTS.MAX_DURATION_SECONDS) {
      errors.push(`Content must be less than ${CONTENT_REQUIREMENTS.MAX_DURATION_SECONDS} seconds`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

export async function checkContentEligibility(ctx: QueryCtx | MutationCtx, contentId: Id<"artistContent">): Promise<{ eligible: boolean; reason?: string }> {
  const content = await ctx.db.get(contentId);
  if (!content) return { eligible: false, reason: "Content not found" };
  
  const validation = validateContentFields({
    title: content.title,
    artistName: content.artistName,
    description: content.description,
    genre: content.genre,
    region: content.region,
    contentType: content.contentType,
    duration: content.duration,
  });
  
  if (!validation.isValid) {
    return { eligible: false, reason: validation.errors.join(", ") };
  }
  
  if (!content.mediaUrl || content.mediaUrl.trim().length === 0) {
    return { eligible: false, reason: "Valid media file is required" };
  }
  
  return { eligible: true };
}

export async function updateContentEngagementScore(ctx: MutationCtx, contentId: Id<"artistContent">) {
  const content = await ctx.db.get(contentId);
  if (!content) return;
  
  const views = content.views || 0;
  const likes = content.likes || 0;
  const comments = content.comments || 0;
  const shares = content.shares || 0;
  
  const engagementScore = (likes * 3) + (comments * 5) + (shares * 10) + (views * 0.1);
  
  const hoursSinceCreation = (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 100 - (hoursSinceCreation * 0.5));
  
  await ctx.db.patch(contentId, {
    engagementScore,
    freshnessScore,
    updatedAt: new Date(),
  });
}

export async function incrementUserContentCount(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return;
  
  await ctx.db.patch(userId, {
    activeContentCount: user.activeContentCount + 1,
    postsCount: (user.postsCount || 0) + 1,
    updatedAt: new Date(),
  });
}

export async function decrementUserContentCount(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return;
  
  await ctx.db.patch(userId, {
    activeContentCount: Math.max(0, user.activeContentCount - 1),
    postsCount: Math.max(0, (user.postsCount || 0) - 1),
    updatedAt: new Date(),
  });
}

// ========== LIGHTCREDZ HELPERS ==========
export async function hasActionCooldown(ctx: QueryCtx | MutationCtx, userId: Id<"users">, action: string): Promise<boolean> {
  const cooldown = await ctx.db
    .query("creditCooldowns")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("action"), action))
    .first();
  
  if (!cooldown) return false;
  
  const cooldownMs = getCooldownMs(action);
  if (cooldownMs === 0) return false;
  
  const timeSinceLastAction = Date.now() - cooldown.lastActionDate.getTime();
  return timeSinceLastAction < cooldownMs;
}

export function getCooldownMs(action: string): number {
  switch (action) {
    case "comment":
      return 60000; // 1 minute
    case "share":
      return 300000; // 5 minutes
    case "like":
      return 60000; // 1 minute
    case "view":
      return 60000; // 1 minute
    default:
      return 60000;
  }
}

export async function recordActionCooldown(ctx: MutationCtx, userId: Id<"users">, action: string) {
  const existing = await ctx.db
    .query("creditCooldowns")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("action"), action))
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      lastActionDate: new Date(),
      actionCount: existing.actionCount + 1,
    });
  } else {
    await ctx.db.insert("creditCooldowns", {
      userId,
      action,
      lastActionDate: new Date(),
      actionCount: 1,
    });
  }
}

export async function awardLightCredz(ctx: MutationCtx, userId: Id<"users">, amount: number, action: string, description: string, relatedContentId?: Id<"artistContent">) {
  const user = await ctx.db.get(userId);
  if (!user) return null;
  
  const newBalance = user.lightCredzBalance + amount;
  const newTotalEarned = user.lightCredzTotalEarned + amount;
  
  await ctx.db.patch(userId, {
    lightCredzBalance: newBalance,
    lightCredzTotalEarned: newTotalEarned,
    updatedAt: new Date(),
  });
  
  const transaction = await ctx.db.insert("lightCredzTransactions", {
    userId,
    amount,
    action,
    description,
    relatedContentId,
    createdAt: new Date(),
  });
  
  return transaction;
}

export async function spendLightCredz(ctx: MutationCtx, userId: Id<"users">, amount: number, action: string, description: string, relatedContentId?: Id<"artistContent">) {
  const user = await ctx.db.get(userId);
  if (!user) return { success: false, reason: "User not found" };
  
  if (user.lightCredzBalance < amount) {
    return { success: false, reason: `Insufficient LightCredz. Need ${amount}, have ${user.lightCredzBalance}` };
  }
  
  const newBalance = user.lightCredzBalance - amount;
  const newTotalSpent = user.lightCredzTotalSpent + amount;
  
  await ctx.db.patch(userId, {
    lightCredzBalance: newBalance,
    lightCredzTotalSpent: newTotalSpent,
    updatedAt: new Date(),
  });
  
  await ctx.db.insert("lightCredzTransactions", {
    userId,
    amount: -amount,
    action,
    description,
    relatedContentId,
    createdAt: new Date(),
  });
  
  return { success: true };
}

// ========== PROMOTION HELPERS ==========
export async function startPromotion(ctx: MutationCtx, contentId: Id<"artistContent">, userId: Id<"users">, promotionType: string, hours: number, creditsUsed?: number, paymentAmount?: number) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
  
  await ctx.db.patch(contentId, {
    isPromoted: true,
    promotionType,
    promotionSource: creditsUsed ? "lightcredz" : "direct_payment",
    promotionStartDate: startDate,
    promotionEndDate: endDate,
    updatedAt: new Date(),
  });
  
  await ctx.db.insert("promotions", {
    contentId,
    userId,
    promotionType,
    promotionSource: creditsUsed ? "lightcredz" : "direct_payment",
    promotionDuration: hours <= 1 ? "hour" : hours <= 12 ? "half_day" : hours <= 24 ? "day" : hours <= 168 ? "week" : "month",
    hours,
    creditsUsed,
    paymentAmount,
    startDate,
    endDate,
    isActive: true,
    createdAt: new Date(),
  });
}

export async function endPromotion(ctx: MutationCtx, contentId: Id<"artistContent">) {
  await ctx.db.patch(contentId, {
    isPromoted: false,
    promotionType: undefined,
    promotionStartDate: undefined,
    promotionEndDate: undefined,
    promotionSource: undefined,
    promotionTier: undefined,
    updatedAt: new Date(),
  });
  
  const activePromotions = await ctx.db
    .query("promotions")
    .withIndex("by_content", (q) => q.eq("contentId", contentId))
    .filter((q) => q.eq(q.field("isActive"), true))
    .collect();
  
  for (const promo of activePromotions) {
    await ctx.db.patch(promo._id, { isActive: false });
  }
}

export async function checkAndExpirePromotions(ctx: MutationCtx) {
  const now = new Date();
  const expiredPromotions = await ctx.db
    .query("promotions")
    .withIndex("by_isActive", (q) => q.eq("isActive", true))
    .filter((q) => q.lt(q.field("endDate"), now))
    .collect();
  
  for (const promo of expiredPromotions) {
    await ctx.db.patch(promo._id, { isActive: false });
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
  
  return expiredPromotions.length;
}

// ========== FEED HELPERS ==========
export function calculateFeedWeight(content: {
  engagementScore: number;
  freshnessScore: number;
  isPromoted: boolean;
  promotionEndDate?: Date;
  exposureCount: number;
  tierMultiplier: number;
}): number {
  let weight = 0;
  
  weight += content.engagementScore * 0.4;
  weight += content.freshnessScore * 0.3;
  weight += content.tierMultiplier * 0.2;
  
  if (content.isPromoted && content.promotionEndDate && new Date(content.promotionEndDate) > new Date()) {
    weight *= 3.0;
  }
  
  const exposurePenalty = Math.min(content.exposureCount * 0.05, 0.5);
  weight *= (1 - exposurePenalty);
  
  return Math.max(0, weight);
}

export async function shouldShowFreshFace(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;
  
  if (user.freshFaceScore >= 50 && user.exposureCount <= 5) {
    return true;
  }
  
  return false;
}

// ========== TIER HELPERS ==========
export async function checkAndUpdateExpiredSubscriptions(ctx: MutationCtx) {
  const now = new Date();
  
  const expiredUsers = await ctx.db
    .query("users")
    .withIndex("by_subscriptionStatus", (q) => q.eq("subscriptionStatus", "active"))
    .collect();
  
  for (const user of expiredUsers) {
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < now) {
      await ctx.db.patch(user._id, {
        subscriptionStatus: "expired",
        tier: "standard",
        maxContentAllowed: TIERS.STANDARD.maxContent,
        updatedAt: new Date(),
      });
    }
  }
  
  return expiredUsers.length;
}

// ========== NOTIFICATION HELPERS ==========
export async function createNotification(
  ctx: MutationCtx,
  userId: Id<"users">,
  type: string,
  title: string,
  message: string,
  fromUserId?: Id<"users">,
  contentId?: Id<"artistContent">
) {
  return await ctx.db.insert("notifications", {
    userId,
    type,
    title,
    message,
    fromUserId,
    contentId,
    isRead: false,
    createdAt: new Date(),
  });
}
