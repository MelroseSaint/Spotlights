import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { 
  TIERS, 
  ROLES, 
  ROOT_ADMIN_EMAIL, 
  ELIGIBILITY_STATUS,
  SUBMISSION_STATUS,
} from "./constants";
import {
  isRootAdmin,
  canManageUser,
} from "./helpers";
import type { RoleType, TierType } from "./constants";

export const verifyAdminAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { isAdmin: false, role: null, permissions: null };
    
    if (isRootAdmin(user.email)) {
      return {
        isAdmin: true,
        role: "root_admin",
        permissions: ROLES.ROOT_ADMIN,
      };
    }
    
    const roleConfig = ROLES[user.role as RoleType];
    if (!roleConfig || roleConfig.level < 25) {
      return { isAdmin: false, role: user.role, permissions: null };
    }
    
    return {
      isAdmin: true,
      role: user.role,
      permissions: roleConfig,
    };
  },
});

export const getAdminDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    if (!isRootAdmin(user.email) && user.role !== "admin" && user.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const totalUsers = await ctx.db.query("users").count();
    const totalContent = await ctx.db.query("artistContent").count();
    const activeContent = await ctx.db
      .query("artistContent")
      .filter((q) => q.eq(q.field("isActive"), true))
      .count();
    
    const pendingModeration = await ctx.db
      .query("moderationQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .count();
    
    const activePromotions = await ctx.db
      .query("promotions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .count();
    
    const tierBreakdown = {
      standard: await ctx.db.withIndex("by_tier", (q) => q.eq("tier", "standard")).count(),
      growth: await ctx.db.withIndex("by_tier", (q) => q.eq("tier", "growth")).count(),
      elite: await ctx.db.withIndex("by_tier", (q) => q.eq("tier", "elite")).count(),
    };
    
    const roleBreakdown = {
      root_admin: await ctx.db.withIndex("by_role", (q) => q.eq("role", "root_admin")).count(),
      admin: await ctx.db.withIndex("by_role", (q) => q.eq("role", "admin")).count(),
      moderator: await ctx.db.withIndex("by_role", (q) => q.eq("role", "moderator")).count(),
      user: await ctx.db.withIndex("by_role", (q) => q.eq("role", "user")).count(),
    };
    
    return {
      stats: {
        totalUsers,
        totalContent,
        activeContent,
        pendingModeration,
        activePromotions,
      },
      tierBreakdown,
      roleBreakdown,
    };
  },
});

export const getAllUsersAdmin = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    role: v.optional(v.string()),
    tier: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, offset = 0, role, tier, search }) => {
    let users = await ctx.db.query("users").take(500);
    
    if (role) {
      users = users.filter(u => u.role === role);
    }
    
    if (tier) {
      users = users.filter(u => u.tier === tier);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.username && u.username.toLowerCase().includes(searchLower))
      );
    }
    
    return users
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  },
});

export const updateUserRole = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
    newRole: v.string(),
  },
  handler: async (ctx, { adminId, targetUserId, newRole }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    if (isRootAdmin(targetUser.email)) {
      throw new Error("Cannot modify root admin role");
    }
    
    const newRoleConfig = ROLES[newRole as RoleType];
    if (!newRoleConfig) {
      throw new Error("Invalid role");
    }
    
    if (!isRootAdmin(admin.email)) {
      if (newRoleConfig.level >= ROLES[admin.role as RoleType].level) {
        throw new Error("Cannot assign role equal to or higher than your own");
      }
    }
    
    await ctx.db.patch(targetUserId, {
      role: newRole,
      updatedAt: new Date(),
    });
    
    return { success: true };
  },
});

export const updateUserTier = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
    newTier: v.string(),
  },
  handler: async (ctx, { adminId, targetUserId, newTier }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const newTierConfig = TIERS[newTier as TierType];
    if (!newTierConfig) {
      throw new Error("Invalid tier");
    }
    
    await ctx.db.patch(targetUserId, {
      tier: newTier,
      maxContentAllowed: newTierConfig.maxContent,
      updatedAt: new Date(),
    });
    
    return { success: true };
  },
});

export const suspendUser = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { adminId, targetUserId, reason }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    if (isRootAdmin(targetUser.email)) {
      throw new Error("Cannot suspend root admin");
    }
    
    await ctx.db.patch(targetUserId, {
      isSuspended: true,
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId: targetUserId,
      type: "suspension",
      title: "Account Suspended",
      message: `Your account has been suspended${reason ? `: ${reason}` : "."}`,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const unsuspendUser = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, { adminId, targetUserId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    await ctx.db.patch(targetUserId, {
      isSuspended: false,
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId: targetUserId,
      type: "unsuspension",
      title: "Account Reactivated",
      message: "Your account has been reinstated.",
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const getModerationQueue = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    const queue = await ctx.db
      .query("moderationQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(limit)
      .collect();
    
    const itemsWithContent = await Promise.all(
      queue.map(async (item) => {
        const content = await ctx.db.get(item.contentId);
        const owner = content ? await ctx.db.get(content.ownerId) : null;
        return {
          ...item,
          content,
          owner: owner ? {
            _id: owner._id,
            name: owner.name,
            email: owner.email,
            avatarUrl: owner.avatarUrl,
            tier: owner.tier,
          } : null,
        };
      })
    );
    
    return itemsWithContent.filter(item => item.content);
  },
});

export const approveContent = mutation({
  args: {
    moderatorId: v.id("users"),
    contentId: v.id("artistContent"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { moderatorId, contentId, notes }) => {
    const moderator = await ctx.db.get(moderatorId);
    if (!moderator) throw new Error("Moderator not found");
    
    if (!isRootAdmin(moderator.email) && 
        moderator.role !== "admin" && 
        moderator.role !== "root_admin" && 
        moderator.role !== "moderator") {
      throw new Error("Moderator access required");
    }
    
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    await ctx.db.patch(contentId, {
      moderationStatus: "approved",
      submissionStatus: SUBMISSION_STATUS.APPROVED,
      eligibilityStatus: ELIGIBILITY_STATUS.ELIGIBLE,
      updatedAt: new Date(),
    });
    
    const queueItem = await ctx.db
      .query("moderationQueue")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .first();
    
    if (queueItem) {
      await ctx.db.patch(queueItem._id, {
        status: "approved",
        reviewerId: moderatorId,
        reviewedAt: new Date(),
      });
    }
    
    await ctx.db.insert("notifications", {
      userId: content.ownerId,
      type: "content_approved",
      title: "Content Approved",
      message: "Your content has been approved and is now live!",
      contentId,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const rejectContent = mutation({
  args: {
    moderatorId: v.id("users"),
    contentId: v.id("artistContent"),
    reason: v.string(),
  },
  handler: async (ctx, { moderatorId, contentId, reason }) => {
    const moderator = await ctx.db.get(moderatorId);
    if (!moderator) throw new Error("Moderator not found");
    
    if (!isRootAdmin(moderator.email) && 
        moderator.role !== "admin" && 
        moderator.role !== "root_admin" && 
        moderator.role !== "moderator") {
      throw new Error("Moderator access required");
    }
    
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    await ctx.db.patch(contentId, {
      moderationStatus: "rejected",
      submissionStatus: SUBMISSION_STATUS.REJECTED,
      eligibilityStatus: ELIGIBILITY_STATUS.INELIGIBLE,
      rejectionReason: reason,
      updatedAt: new Date(),
    });
    
    const queueItem = await ctx.db
      .query("moderationQueue")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .first();
    
    if (queueItem) {
      await ctx.db.patch(queueItem._id, {
        status: "rejected",
        rejectionReason: reason,
        reviewerId: moderatorId,
        reviewedAt: new Date(),
      });
    }
    
    await ctx.db.insert("notifications", {
      userId: content.ownerId,
      type: "content_rejected",
      title: "Content Rejected",
      message: `Your content was rejected: ${reason}`,
      contentId,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const deleteContentAdmin = mutation({
  args: {
    adminId: v.id("users"),
    contentId: v.id("artistContent"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { adminId, contentId, reason }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    await ctx.db.patch(contentId, {
      isActive: false,
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId: content.ownerId,
      type: "content_deleted",
      title: "Content Removed",
      message: reason ? `Your content was removed: ${reason}` : "Your content has been removed by an administrator.",
      contentId,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const awardLightCredzAdmin = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { adminId, targetUserId, amount, reason }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) throw new Error("Target user not found");
    
    const newBalance = targetUser.lightCredzBalance + amount;
    const newTotalEarned = targetUser.lightCredzTotalEarned + amount;
    
    await ctx.db.patch(targetUserId, {
      lightCredzBalance: newBalance,
      lightCredzTotalEarned: newTotalEarned,
      updatedAt: new Date(),
    });
    
    await ctx.db.insert("lightCredzTransactions", {
      userId: targetUserId,
      amount,
      action: "admin_award",
      description: `Admin award: ${reason}`,
      createdAt: new Date(),
    });
    
    await ctx.db.insert("notifications", {
      userId: targetUserId,
      type: "lightcredz_awarded",
      title: "LightCredz Awarded",
      message: `You received ${amount} LightCredz: ${reason}`,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true, newBalance };
  },
});

export const getReports = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    let reports;
    
    if (status) {
      reports = await ctx.db
        .query("reports")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit)
        .collect();
    } else {
      reports = await ctx.db
        .query("reports")
        .order("desc")
        .take(limit)
        .collect();
    }
    
    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        const content = await ctx.db.get(report.contentId);
        const reviewer = report.reviewedBy ? await ctx.db.get(report.reviewedBy) : null;
        
        return {
          ...report,
          reporter: reporter ? { _id: reporter._id, name: reporter.name, avatarUrl: reporter.avatarUrl } : null,
          content: content ? { _id: content._id, title: content.title, artistName: content.artistName } : null,
          reviewer: reviewer ? { _id: reviewer._id, name: reviewer.name } : null,
        };
      })
    );
    
    return reportsWithDetails;
  },
});

export const submitReport = mutation({
  args: {
    reporterId: v.id("users"),
    contentId: v.id("artistContent"),
    reason: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { reporterId, contentId, reason, description }) => {
    const reporter = await ctx.db.get(reporterId);
    if (!reporter) throw new Error("Reporter not found");
    
    const content = await ctx.db.get(contentId);
    if (!content) throw new Error("Content not found");
    
    const existingReport = await ctx.db
      .query("reports")
      .filter((q) => 
        q.and(
          q.eq(q.field("reporterId"), reporterId),
          q.eq(q.field("contentId"), contentId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    
    if (existingReport) {
      throw new Error("You have already reported this content");
    }
    
    await ctx.db.insert("reports", {
      reporterId,
      contentId,
      reason,
      description,
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      createdAt: new Date(),
    });
    
    return { success: true };
  },
});

export const resolveReport = mutation({
  args: {
    moderatorId: v.id("users"),
    reportId: v.id("reports"),
    action: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { moderatorId, reportId, action, notes }) => {
    const moderator = await ctx.db.get(moderatorId);
    if (!moderator) throw new Error("Moderator not found");
    
    if (!isRootAdmin(moderator.email) && 
        moderator.role !== "admin" && 
        moderator.role !== "root_admin" && 
        moderator.role !== "moderator") {
      throw new Error("Moderator access required");
    }
    
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found");
    
    let newStatus = "reviewed";
    let contentAction = false;
    
    if (action === "dismiss") {
      newStatus = "dismissed";
    } else if (action === "warn") {
      newStatus = "resolved";
    } else if (action === "remove") {
      newStatus = "resolved";
      contentAction = true;
    }
    
    await ctx.db.patch(reportId, {
      status: newStatus,
      reviewedBy: moderatorId,
      reviewedAt: new Date(),
    });
    
    if (contentAction) {
      await ctx.db.patch(report.contentId, {
        isActive: false,
        updatedAt: new Date(),
      });
    }
    
    return { success: true };
  },
});

export const forceExpireSubscriptions = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Admin not found");
    
    if (!isRootAdmin(admin.email) && admin.role !== "admin" && admin.role !== "root_admin") {
      throw new Error("Admin access required");
    }
    
    const now = new Date();
    const expiredUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("subscriptionStatus"), "active"))
      .collect();
    
    let count = 0;
    for (const user of expiredUsers) {
      if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < now) {
        await ctx.db.patch(user._id, {
          subscriptionStatus: "expired",
          tier: "standard",
          maxContentAllowed: TIERS.STANDARD.maxContent,
          updatedAt: new Date(),
        });
        count++;
      }
    }
    
    return { expiredCount: count };
  },
});
