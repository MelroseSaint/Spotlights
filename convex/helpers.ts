import { QueryCtx, MutationCtx } from "convex/server";
import { Id } from "convex/values";
import { TIERS, ROOT_ADMIN_EMAIL, CONTENT_REQUIREMENTS } from "./constants";

export async function getUserById(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db.get(userId);
}

export async function getUserByEmail(ctx: QueryCtx | MutationCtx, email: string) {
  return await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
}

export function isRootAdmin(email: string): boolean {
  return email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
}

export function isAdmin(role?: string): boolean {
  return role === "root_admin" || role === "admin" || role === "moderator";
}

export async function canUploadContent(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<{ canUpload: boolean; reason?: string }> {
  const user = await ctx.db.get(userId);
  if (!user) return { canUpload: false, reason: "User not found" };
  if (user.isSuspended) return { canUpload: false, reason: "Account is suspended" };
  if (isAdmin(user.role)) return { canUpload: true }; // Admins have unlimited uploads
  if (user.activeContentCount >= user.maxContentAllowed) {
    return { canUpload: false, reason: `Upload limit reached (${user.activeContentCount}/${user.maxContentAllowed}). Delete content or upgrade.` };
  }
  return { canUpload: true };
}

export function validateContentFields(content: {
  title?: string; artistName?: string; description?: string; genre?: string; region?: string; contentType?: string; duration?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!content.title || content.title.length < CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH) errors.push(`Title must be at least ${CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH} characters`);
  if (content.title && content.title.length > CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH) errors.push(`Title must be less than ${CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH} characters`);
  if (!content.artistName || content.artistName.trim().length === 0) errors.push("Artist name is required");
  if (!content.description || content.description.length < CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH) errors.push(`Description must be at least ${CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH} characters`);
  if (!content.genre || !CONTENT_REQUIREMENTS.ALLOWED_GENRES.includes(content.genre)) errors.push("Valid genre is required");
  if (!content.region || !CONTENT_REQUIREMENTS.ALLOWED_REGIONS.includes(content.region)) errors.push("Valid region is required");
  if (!content.contentType || !CONTENT_REQUIREMENTS.ALLOWED_CONTENT_TYPES.includes(content.contentType as any)) errors.push("Valid content type required");
  return { isValid: errors.length === 0, errors };
}

export async function checkContentEligibility(ctx: QueryCtx | MutationCtx, contentId: Id<"artistContent">) {
  const content = await ctx.db.get(contentId);
  if (!content) return { eligible: false, reason: "Content not found" };
  const validation = validateContentFields({ title: content.title, artistName: content.artistName, description: content.description, genre: content.genre, region: content.region, contentType: content.contentType, duration: content.duration });
  if (!validation.isValid) return { eligible: false, reason: validation.errors.join(", ") };
  if (!content.mediaUrl || content.mediaUrl.trim().length === 0) return { eligible: false, reason: "Valid media file is required" };
  return { eligible: true };
}

export async function updateContentEngagementScore(ctx: MutationCtx, contentId: Id<"artistContent">) {
  const content = await ctx.db.get(contentId);
  if (!content) return;
  const engagementScore = (content.likes * 3) + (content.comments * 5) + (content.shares * 10) + (content.views * 0.1);
  const hoursSinceCreation = (Date.now() - content.createdAt) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 100 - (hoursSinceCreation * 0.5));
  await ctx.db.patch(contentId, { engagementScore, freshnessScore, updatedAt: Date.now() });
}

export async function incrementUserContentCount(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return;
  await ctx.db.patch(userId, { activeContentCount: user.activeContentCount + 1, postsCount: (user.postsCount || 0) + 1, updatedAt: Date.now() });
}

export async function decrementUserContentCount(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return;
  await ctx.db.patch(userId, { activeContentCount: Math.max(0, user.activeContentCount - 1), postsCount: Math.max(0, (user.postsCount || 0) - 1), updatedAt: Date.now() });
}

export async function hasActionCooldown(ctx: QueryCtx | MutationCtx, userId: Id<"users">, action: string): Promise<boolean> {
  const cooldown = await ctx.db.query("creditCooldowns").withIndex("by_user_action", (q) => q.eq("userId", userId).eq("action", action)).first();
  if (!cooldown) return false;
  const cooldowns: Record<string, number> = { comment: 60000, share: 300000, like: 60000, view: 60000 };
  const cooldownMs = cooldowns[action] || 60000;
  if (cooldownMs === 0) return false;
  return Date.now() - cooldown.lastActionDate < cooldownMs;
}

export async function recordActionCooldown(ctx: MutationCtx, userId: Id<"users">, action: string) {
  const existing = await ctx.db.query("creditCooldowns").withIndex("by_user_action", (q) => q.eq("userId", userId).eq("action", action)).first();
  if (existing) {
    await ctx.db.patch(existing._id, { lastActionDate: Date.now(), actionCount: existing.actionCount + 1 });
  } else {
    await ctx.db.insert("creditCooldowns", { userId, action, lastActionDate: Date.now(), actionCount: 1 });
  }
}

export async function awardLightCredz(ctx: MutationCtx, userId: Id<"users">, amount: number, action: string, description: string, relatedContentId?: Id<"artistContent">) {
  const user = await ctx.db.get(userId);
  if (!user) return null;
  await ctx.db.patch(userId, { lightCredzBalance: user.lightCredzBalance + amount, lightCredzTotalEarned: user.lightCredzTotalEarned + amount, updatedAt: Date.now() });
  return await ctx.db.insert("lightCredzTransactions", { userId, amount, action, description, relatedContentId, createdAt: Date.now() });
}

export async function spendLightCredz(ctx: MutationCtx, userId: Id<"users">, amount: number, action: string, description: string, relatedContentId?: Id<"artistContent">) {
  const user = await ctx.db.get(userId);
  if (!user) return { success: false, reason: "User not found" };
  if (user.lightCredzBalance < amount) return { success: false, reason: `Insufficient LightCredz. Need ${amount}, have ${user.lightCredzBalance}` };
  await ctx.db.patch(userId, { lightCredzBalance: user.lightCredzBalance - amount, lightCredzTotalSpent: user.lightCredzTotalSpent + amount, updatedAt: Date.now() });
  await ctx.db.insert("lightCredzTransactions", { userId, amount: -amount, action, description, relatedContentId, createdAt: Date.now() });
  return { success: true };
}

export async function startPromotion(ctx: MutationCtx, contentId: Id<"artistContent">, userId: Id<"users">, promotionType: string, hours: number, creditsUsed?: number, paymentAmount?: number) {
  const startDate = Date.now();
  const endDate = startDate + hours * 60 * 60 * 1000;
  await ctx.db.patch(contentId, { isPromoted: true, promotionType, promotionSource: creditsUsed ? "lightcredz" : "direct_payment", promotionStartDate: startDate, promotionEndDate: endDate, updatedAt: Date.now() });
  await ctx.db.insert("promotions", { contentId, userId, promotionType, promotionSource: creditsUsed ? "lightcredz" : "direct_payment", promotionDuration: hours <= 1 ? "hour" : hours <= 24 ? "day" : "week", hours, creditsUsed, paymentAmount, startDate, endDate, isActive: true, createdAt: Date.now() });
}

export async function endPromotion(ctx: MutationCtx, contentId: Id<"artistContent">) {
  await ctx.db.patch(contentId, { isPromoted: false, promotionType: undefined, promotionStartDate: undefined, promotionEndDate: undefined, promotionSource: undefined, promotionTier: undefined, updatedAt: Date.now() });
  const activePromotions = await ctx.db.query("promotions").withIndex("by_content", (q) => q.eq("contentId", contentId)).filter((q) => q.eq(q.field("isActive"), true)).collect();
  for (const promo of activePromotions) await ctx.db.patch(promo._id, { isActive: false });
}

export function getFeedWeightMultiplier(tier: string, role?: string): number {
  if (isAdmin(role)) return 10.0; // Admins get maximum feed weight
  return TIERS[tier as keyof typeof TIERS]?.feedWeightMultiplier ?? 1.0;
}

export async function createNotification(ctx: MutationCtx, userId: Id<"users">, type: string, title: string, message: string, fromUserId?: Id<"users">, contentId?: Id<"artistContent">) {
  return await ctx.db.insert("notifications", { userId, type, title, message, fromUserId, contentId, isRead: false, createdAt: Date.now() });
}
