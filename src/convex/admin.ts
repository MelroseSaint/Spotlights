import { defineMutation, defineQuery } from "convex/server";
import { v } from "convex/values";

// Get all users (admin)
export const getAllUsers = defineQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50, offset = 0 }) => {
    return await ctx.db
      .query("users")
      .order("desc")
      .take(limit, offset)
      .collect();
  },
});

// Get all posts (admin)
export const getAllPosts = defineQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50, offset = 0 }) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_createdAt", (q) => q.order("desc"))
      .take(limit, offset)
      .collect();
  },
});

// Get reported content
export const getReportedContent = defineQuery({
  args: {},
  handler: async (ctx) => {
    // In a real app, you'd have a reports table
    // For now, return empty array
    return [];
  },
});

// Update user status (suspend/activate)
export const updateUserStatus = defineMutation({
  args: {
    userId: v.id("users"),
    status: v.string(), // "active", "suspended", "pending"
  },
  handler: async (ctx, { userId, status }) => {
    await ctx.db.patch(userId, {
      status,
      updatedAt: new Date(),
    });
    return { success: true };
  },
});

// Delete a post
export const deletePost = defineMutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Delete associated likes and comments
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("postId"), postId))
      .collect();
    
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("postId"), postId))
      .collect();
    
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Update author's post count
    const authorId = post.authorId;
    const author = await ctx.db.get(authorId);
    if (author) {
      await ctx.db.patch(authorId, {
        postsCount: Math.max(0, (author.postsCount || 0) - 1),
        updatedAt: new Date(),
      });
    }

    // Delete the post
    await ctx.db.delete(postId);

    return { success: true };
  },
});

// Get platform stats
export const getPlatformStats = defineQuery({
  args: {},
  handler: async (ctx) => {
    const totalUsers = await ctx.db.query("users").count();
    const totalPosts = await ctx.db.query("posts").count();
    const totalLikes = await ctx.db.query("likes").count();
    const totalFollows = await ctx.db.query("follows").count();
    
    // Get active broadcasts (posts from last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeBroadcasts = await ctx.db
      .query("posts")
      .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
      .count();

    return {
      totalUsers,
      totalPosts,
      totalLikes,
      totalFollows,
      activeBroadcasts,
    };
  },
});