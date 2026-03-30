import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { ROLES, TIERS, ROOT_ADMIN_EMAIL, ELIGIBILITY_STATUS, SUBMISSION_STATUS } from "../constants";
import { isRootAdmin, createNotification } from "../helpers";

export const verifyAdminAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { isAdmin: false, role: null, permissions: null };
    if (isRootAdmin(user.email)) return { isAdmin: true, role: "root_admin", permissions: ROLES.ROOT_ADMIN };
    const roleConfig = ROLES[user.role as keyof typeof ROLES];
    if (!roleConfig || roleConfig.level < 25) return { isAdmin: false, role: user.role, permissions: null };
    return { isAdmin: true, role: user.role, permissions: roleConfig };
  },
});

export const getAdminDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (!isRootAdmin(user.email) && user.role !== "admin" && user.role !== "root_admin") throw new Error("Admin access required");

    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const allContent = await ctx.db.query("artistContent").collect();
    const totalContent = allContent.length;
    const activeContent = allContent.filter(c => c.isActive).length;
    const pendingModeration = allContent.filter(c => c.moderationStatus === "pending").length;
    const allPromotions = await ctx.db.query("promotions").collect();
    const activePromotions = allPromotions.filter(p => p.isActive).length;

    return { stats: { totalUsers, totalContent, activeContent, pendingModeration, activePromotions }, tierBreakdown: { standard: 0, growth: 0, elite: 0 }, roleBreakdown: { root_admin: 0, admin: 0, moderator: 0, user: 0 } };
  },
});

export const updateUserRole = mutation({
  args: { adminId: v.id("users"), targetUserId: v.id("users"), newRole: v.string() },
  handler: async (ctx, { adminId, targetUserId, newRole }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    if (isRootAdmin(targetUser.email)) throw new Error("Cannot modify root admin role");
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") throw new Error("Admin access required");
    await ctx.db.patch(targetUserId, { role: newRole, updatedAt: Date.now() });
    return { success: true };
  },
});

export const suspendUser = mutation({
  args: { adminId: v.id("users"), targetUserId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, { adminId, targetUserId, reason }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    if (isRootAdmin(targetUser.email)) throw new Error("Cannot suspend root admin");
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") throw new Error("Admin access required");
    await ctx.db.patch(targetUserId, { isSuspended: true, updatedAt: Date.now() });
    await createNotification(ctx, targetUserId, "suspension", "Account Suspended", `Your account has been suspended${reason ? `: ${reason}` : "."}`);
    return { success: true };
  },
});

export const getModerationQueue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const queue = (await ctx.db.query("moderationQueue").withIndex("by_status", (q) => q.eq("status", "pending")).collect()).slice(0, limit);
    return Promise.all(queue.map(async (item) => {
      const content = await ctx.db.get(item.contentId);
      const owner = content ? await ctx.db.get(content.ownerId) : null;
      return { ...item, content, owner: owner ? { _id: owner._id, name: owner.name, email: owner.email, avatarUrl: owner.avatarUrl, tier: owner.tier } : null };
    }));
  },
});

export const approveContent = mutation({
  args: { moderatorId: v.id("users"), contentId: v.id("artistContent"), notes: v.optional(v.string()) },
  handler: async (ctx, { moderatorId, contentId, notes }) => {
    const moderator = await ctx.db.get(moderatorId);
    if (!moderator) throw new Error("Moderator not found");
    if (!isRootAdmin(moderator.email) && moderator.role !== "admin" && moderator.role !== "root_admin" && moderator.role !== "moderator") throw new Error("Moderator access required");
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    await ctx.db.patch(contentId, { moderationStatus: "approved", submissionStatus: SUBMISSION_STATUS.APPROVED, eligibilityStatus: ELIGIBILITY_STATUS.ELIGIBLE, updatedAt: Date.now() });
    const queueItem = await ctx.db.query("moderationQueue").withIndex("by_content", (q) => q.eq("contentId", contentId)).first();
    if (queueItem) await ctx.db.patch(queueItem._id, { status: "approved", reviewerId: moderatorId, reviewedAt: Date.now() });
    await createNotification(ctx, content.ownerId, "content_approved", "Content Approved", "Your content has been approved and is now live!");
    return { success: true };
  },
});

export const rejectContent = mutation({
  args: { moderatorId: v.id("users"), contentId: v.id("artistContent"), reason: v.string() },
  handler: async (ctx, { moderatorId, contentId, reason }) => {
    const moderator = await ctx.db.get(moderatorId);
    if (!moderator) throw new Error("Moderator not found");
    if (!isRootAdmin(moderator.email) && moderator.role !== "admin" && moderator.role !== "root_admin" && moderator.role !== "moderator") throw new Error("Moderator access required");
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    await ctx.db.patch(contentId, { moderationStatus: "rejected", submissionStatus: SUBMISSION_STATUS.REJECTED, eligibilityStatus: ELIGIBILITY_STATUS.INELIGIBLE, rejectionReason: reason, updatedAt: Date.now() });
    const queueItem = await ctx.db.query("moderationQueue").withIndex("by_content", (q) => q.eq("contentId", contentId)).first();
    if (queueItem) await ctx.db.patch(queueItem._id, { status: "rejected", rejectionReason: reason, reviewerId: moderatorId, reviewedAt: Date.now() });
    await createNotification(ctx, content.ownerId, "content_rejected", "Content Rejected", `Your content was rejected: ${reason}`);
    return { success: true };
  },
});

export const deleteUser = mutation({
  args: { adminId: v.id("users"), targetUserId: v.id("users") },
  handler: async (ctx, { adminId, targetUserId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    if (isRootAdmin(targetUser.email)) throw new Error("Cannot delete root admin");
    if (adminId === targetUserId) throw new Error("Cannot delete yourself");
    if (!isRootAdmin(admin.email) && admin.role !== "root_admin") throw new Error("Only root admin can delete users");
    
    const userContents = await ctx.db.query("artistContent").withIndex("by_owner", (q) => q.eq("ownerId", targetUserId)).collect();
    for (const content of userContents) {
      await ctx.db.patch(content._id, { isActive: false });
    }
    
    const userFollows = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", targetUserId)).collect();
    for (const follow of userFollows) {
      await ctx.db.delete(follow._id);
    }
    
    const sessions = await ctx.db.query("sessions").withIndex("by_user", (q) => q.eq("userId", targetUserId)).collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    await createNotification(ctx, targetUserId, "account_deleted", "Account Deleted", "Your account has been deleted by an administrator.");
    
    await ctx.db.delete(targetUserId);
    
    return { success: true };
  },
});
