import { mutation, query } from "convex/server";
import { v } from "convex/values";

// Create a new post
export const createPost = mutation({
  args: {
    authorId: v.id("users"),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { authorId, ...postData } = args;
    
    const postId = await ctx.db.insert("posts", {
      ...postData,
      authorId,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update user's posts count
    const user = await ctx.db.get(authorId);
    if (user) {
      await ctx.db.patch(authorId, {
        postsCount: (user.postsCount || 0) + 1,
        updatedAt: new Date(),
      });
    }

    return postId;
  },
});

// Get all posts (for feed)
export const getPosts = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20, offset = 0 }) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_createdAt", (q) => q.order("desc"))
      .take(limit, offset)
      .collect();
  },
});

// Get posts by a specific userexport const getUserPosts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    return await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

// Get posts by category
export const getPostsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, limit = 20 }) => {
    return await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("category"), category))
      .order("desc")
      .take(limit)
      .collect();
  },
});

// Get trending posts (most liked/shared)
export const getTrendingPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db
      .query("posts")
      .order("desc")
      .take(limit)
      .collect();
  },
});

// Like a post
export const likePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) => {
    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("postId"), postId)
        )
      )
      .first();

    if (existingLike) {
      throw new Error("Already liked this post");
    }

    // Create like
    await ctx.db.insert("likes", {
      userId,
      postId,
      createdAt: new Date(),
    });

    // Update post like count
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        likes: (post.likes || 0) + 1,
        updatedAt: new Date(),
      });
    }

    return { success: true };
  },
});

// Unlike a post
export const unlikePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) => {
    // Find and delete the like
    const like = await ctx.db
      .query("likes")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("postId"), postId)
        )
      )
      .first();

    if (!like) {
      throw new Error("Not liked this post");
    }

    await ctx.db.delete(like._id);

    // Update post like count
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        likes: Math.max(0, (post.likes || 0) - 1),
        updatedAt: new Date(),
      });
    }

    return { success: true };
  },
});

// Check if user has liked a post
export const hasLikedPost = query({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) => {
    const like = await ctx.db
      .query("likes")
      .filter((q) =>         q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("postId"), postId)
        )
      )
      .first();

    return !!like;
  },
});

// Add a comment to a post
export const addComment = mutation({
  args: {
    authorId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { authorId, postId, content } = args;
    
    const commentId = await ctx.db.insert("comments", {
      authorId,
      postId,
      content,
      createdAt: new Date(),
    });

    // Update post comment count
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        comments: (post.comments || 0) + 1,
        updatedAt: new Date(),
      });
    }

    return commentId;
  },
});

// Get comments for a post
export const getComments = query({
  args: {
    postId: v.id("posts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { postId, limit = 50 }) => {
    return await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("postId"), postId))
      .order("asc")
      .take(limit)
      .collect();
  },
});

// Share a post (increment share count)
export const sharePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        shares: (post.shares || 0) + 1,
        updatedAt: new Date(),
      });
    }
    return { success: true };
  },
});