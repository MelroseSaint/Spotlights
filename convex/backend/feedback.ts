import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { isAdmin } from "../helpers";

export const submitFeedback = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("bug_report"), v.literal("feature_request"), v.literal("general_feedback")),
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const feedbackId = await ctx.db.insert("feedback", {
      userId: args.userId,
      type: args.type,
      subject: args.subject,
      description: args.description,
      status: "open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, feedbackId };
  },
});

export const respondToFeedback = mutation({
  args: {
    feedbackId: v.id("feedback"),
    adminId: v.id("users"),
    response: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin) throw new Error("User not found");
    if (!isAdmin(admin.role)) throw new Error("Only admins can respond to feedback");
    
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");
    
    await ctx.db.patch(args.feedbackId, {
      adminResponse: args.response,
      status: args.status,
      updatedAt: Date.now(),
    });
    
    // Notify user
    await ctx.db.insert("notifications", {
      userId: feedback.userId,
      type: "feedback_response",
      title: "Feedback Update",
      message: `Your ${feedback.type.replace("_", " ")} has been updated: ${args.status}`,
      isRead: false,
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

export const getUserFeedback = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
      .then(items => items.sort((a, b) => b.createdAt - a.createdAt));
  },
});

export const getAllFeedback = query({
  args: { status: v.optional(v.string()), type: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const admin = args.adminId;
    let feedbacks = await ctx.db.query("feedback")
      .collect();
    
    if (args.status) {
      feedbacks = feedbacks.filter(f => f.status === args.status);
    }
    if (args.type) {
      feedbacks = feedbacks.filter(f => f.type === args.type);
    }
    
    const sorted = feedbacks.sort((a, b) => b.createdAt - a.createdAt);
    
    const withUsers = await Promise.all(
      sorted.slice(0, args.limit || 50).map(async (fb) => {
        const user = await ctx.db.get(fb.userId);
        return {
          ...fb,
          user: user ? { _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null,
        };
      })
    );
    
    return withUsers;
  },
});

export const getOpenFeedbackCount = query({
  args: {},
  handler: async (ctx) => {
    const feedbacks = await ctx.db.query("feedback")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    return feedbacks.length;
  },
});
